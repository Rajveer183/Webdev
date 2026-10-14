"""PDF content pipeline: syllabus PDF -> structured module records -> topics pending review.

Stages
1. extract_pages(): text per page with pdfplumber. Pages with almost no text are
   OCR'd when pytesseract + pypdfium2 are installed; otherwise they are flagged.
2. parse_syllabus(): split the text into course modules (name, code, L-T-P, type,
   semester, description, objectives, outcomes, units, practicals, links, books)
   with the PDF pages each one came from.
3. store_as_topics(): upsert one SourceTopic per module with status
   `pending_review`. Nothing extracted here is ever published automatically;
   an editor approves topics and links them to services/courses in the admin area.

The parser targets the syllabus template used by the source PDF (numbered fields
such as "Course Name", "Course Code", "Unit – 1 Number of lectures = 15 Title of
the unit: ..."). Anything it cannot read confidently is reported as a warning.
"""

from __future__ import annotations

import hashlib
import io
import logging
import re
from dataclasses import asdict, dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from app.models import IngestionRun, SourceTopic

log = logging.getLogger(__name__)

MIN_TEXT_CHARS = 40  # below this a page is treated as image-only/blank

_ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
_TICK = "[✔✓√]"
_SECTION_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("description", re.compile(r"^\d*\.?\s*Course Description\s*:?", re.I)),
    ("objectives", re.compile(r"^\d*\.?\s*Course Objectives\s*:?", re.I)),
    ("outcomes", re.compile(r"^\d*\.?\s*Course Outcomes", re.I)),
    ("units", re.compile(r"^\d*\.?\s*(Unit[- ]wise detailed content|Detailed contents?|Contents)\b", re.I)),
    ("practicals", re.compile(r"^\d*\.?\s*The list of practical", re.I)),
    ("elearning", re.compile(r"^\d*\.?\s*(Brief Description of self|E-learning|Web Links)", re.I)),
    ("books", re.compile(r"^\d*\.?\s*Books Recommended", re.I)),
]
_UNIT = re.compile(
    r"^Unit\s*[-–]?\s*(?P<num>\d+)\s*(?:Number of lectures\s*=\s*(?P<lec>\d+)?)?\s*(?:Title of the unit\s*:?)?\s*(?P<title>.*)$",
    re.I,
)
_URL = re.compile(r"https?://\S+")
_NUMBERED = re.compile(r"^\s*(\d{1,2})\.\s+")


@dataclass
class Unit:
    number: int
    lectures: int | None
    title: str
    content: str = ""


@dataclass
class Module:
    name: str
    code: str | None
    pages: list[int]
    semester: int | None = None
    course_type: str | None = None
    ltp: list[int] | None = None
    hours: dict[str, int] | None = None
    description: str = ""
    objectives: list[str] = field(default_factory=list)
    outcomes: list[str] = field(default_factory=list)
    units: list[Unit] = field(default_factory=list)
    practicals: list[str] = field(default_factory=list)
    e_learning: list[str] = field(default_factory=list)
    books: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def is_lab(self) -> bool:
        return bool(re.search(r"\blab\b", self.name, re.I))

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["is_lab"] = self.is_lab
        return d


@dataclass
class ExtractionResult:
    page_count: int
    pages: list[str]
    flagged_pages: list[int]
    ocr_pages: list[int]
    type_marks: dict[int, str] = field(default_factory=dict)  # page -> ticked course type, read from layout


# ---------------------------------------------------------------------------
# 1. Extraction
# ---------------------------------------------------------------------------


def _ocr_page(pdf_bytes: bytes, index: int) -> str | None:
    try:
        import pypdfium2 as pdfium  # type: ignore
        import pytesseract  # type: ignore
    except ImportError:
        return None
    try:
        doc = pdfium.PdfDocument(pdf_bytes)
        image = doc[index].render(scale=300 / 72).to_pil()
        return pytesseract.image_to_string(image)
    except Exception as exc:  # OCR is best-effort; failures are reported as flagged pages
        log.warning("OCR failed on page %s: %s", index + 1, type(exc).__name__)
        return None


_TYPE_LABELS = ("Core", "DSE", "AECC", "AEC", "SEC", "OE")
_TICK_CHARS = "✔✓√"


def detect_type_mark(page) -> str | None:
    """Read the ticked course type from the header table geometry.

    The labels (Core, DSE, AEC, SEC, OE) sit on one row; the tick is either on the
    same line right of its label or wrapped just below it in the label's column. Text
    extraction scrambles that order, so we use character positions instead: take the
    first tick at or just below the label row and assign it to the rightmost label
    whose left edge is not to the right of the tick.
    """
    labels = [w for w in page.extract_words() if w["text"] in _TYPE_LABELS]
    if len(labels) < 3:
        return None
    row_top = min(w["top"] for w in labels)
    labels = [w for w in labels if abs(w["top"] - row_top) < 6]
    ticks = [c for c in page.chars if c["text"] in _TICK_CHARS and row_top - 4 <= c["top"] <= row_top + 40]
    if not ticks:
        return None
    tick = min(ticks, key=lambda c: c["top"])
    candidates = [w for w in labels if w["x0"] <= tick["x0"] + 2]
    if not candidates:
        return None
    return max(candidates, key=lambda w: w["x0"])["text"]


def extract_pages(pdf_bytes: bytes) -> ExtractionResult:
    import pdfplumber

    pages: list[str] = []
    flagged: list[int] = []
    ocr_pages: list[int] = []
    type_marks: dict[int, str] = {}
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            if "Type of Course" in text:
                mark = detect_type_mark(page)
                if mark:
                    type_marks[i + 1] = mark
            if len(text.strip()) < MIN_TEXT_CHARS:
                ocr = _ocr_page(pdf_bytes, i)
                if ocr and len(ocr.strip()) >= MIN_TEXT_CHARS:
                    text = ocr
                    ocr_pages.append(i + 1)
                else:
                    flagged.append(i + 1)
            pages.append(text)
    return ExtractionResult(
        page_count=len(pages), pages=pages, flagged_pages=flagged, ocr_pages=ocr_pages, type_marks=type_marks
    )


# ---------------------------------------------------------------------------
# 2. Parsing
# ---------------------------------------------------------------------------


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _split_numbered(lines: list[str]) -> list[str]:
    """Join wrapped lines into numbered items ("1. ...", "2. ...")."""
    items: list[str] = []
    for line in lines:
        if _NUMBERED.match(line):
            items.append(_NUMBERED.sub("", line, count=1))
        elif items:
            items[-1] += " " + line
        elif line.strip():
            items.append(line)
    return [_norm(i) for i in items if _norm(i)]


def _header_fields(module: Module, header: str, layout_type: str | None = None) -> None:
    flat = _norm(header)
    m = re.search(r"\b(\d{8})\s+(?:Code\s+)?(\d)\s+(\d)\s+(\d)\b", flat)
    if m:
        module.code = m.group(1)
        module.ltp = [int(m.group(2)), int(m.group(3)), int(m.group(4))]
    else:
        module.warnings.append("Course code / L-T-P not found")
    t = re.search(rf"\b(Core|DSE|AECC|AEC|SEC|OE)\s*\(\s*{_TICK}\s*\)", flat)
    if layout_type:
        # Geometry (detect_type_mark) is more reliable than the scrambled text order.
        module.course_type = layout_type
        if t and t.group(1) != layout_type:
            module.warnings.append(f"Course type: layout reads {layout_type}, text reads {t.group(1)}; check the PDF page")
    elif t:
        module.course_type = t.group(1)
    else:
        module.warnings.append("Course type (Core/DSE/SEC/...) could not be read; check the PDF page")
    h = re.search(r"Lectures\s*=\s*(\d+)\s*Tutorials\s*=\s*(\d+)\s*Practical\s*=\s*(\d+)", flat)
    if h:
        module.hours = {"lectures": int(h.group(1)), "tutorials": int(h.group(2)), "practical": int(h.group(3))}


_SHORT_WORDS = {"a", "an", "and", "by", "for", "i", "ii", "in", "lab", "of", "on", "the", "to", "with"}


def _course_name(header_lines: list[str]) -> str:
    """Rebuild the course name from the header table.

    Table cells wrap unpredictably, e.g. "2. Course Operations / L T P / Name Research",
    so we take every line from the start marker up to the line holding the 8-digit
    course code, then drop the field labels ("Course", "Name", "L T P").
    """
    parts: list[str] = []
    for i, line in enumerate(header_lines):
        if i > 0 and re.search(r"\b\d{8}\b", line):
            break
        if i == 0:
            line = _MODULE_START.sub("", line)
        line = re.sub(r"\bL\s+T\s+P\b", " ", line)
        line = re.sub(r"^\s*Name\b", " ", line)
        if re.search(r"\b\d{8}\b", line):  # code on the same line as the name
            line = line[: re.search(r"\d+\.\s*Course|\b\d{8}\b", line).start()]
        parts.append(line)
    words = _norm(" ".join(parts)).split(" ")
    # Narrow cells split long words ("Programmi ng", "Computatio ns"): re-join short lowercase tails.
    merged: list[str] = []
    for w in words:
        if merged and re.fullmatch(r"[a-z]{1,3}", w) and w not in _SHORT_WORDS and len(merged[-1]) >= 5:
            merged[-1] += w
        elif w:
            merged.append(w)
    return " ".join(merged)


_MODULE_START = re.compile(r"^\d+\.\s*Course\s+(?:Name\s+)?(?!Code\b|Description\b|Objectives\b|Outcomes\b|\d)")


def parse_syllabus(pages: list[str], type_marks: dict[int, str] | None = None) -> list[Module]:
    modules: list[Module] = []
    semester: int | None = None
    current: Module | None = None
    section = "header"
    header_lines: list[str] = []
    buffers: dict[str, list[str]] = {}

    def finish() -> None:
        nonlocal current
        if current is None:
            return
        current.name = _course_name(header_lines)
        if not current.name:
            current.warnings.append("Course name not detected")
        _header_fields(current, "\n".join(header_lines), (type_marks or {}).get(current.pages[0]))
        current.description = _norm(" ".join(buffers.get("description", [])))
        current.objectives = _split_numbered(_drop_intro(buffers.get("objectives", [])))
        current.outcomes = _split_numbered(_drop_intro(buffers.get("outcomes", [])))
        current.practicals = _split_numbered(buffers.get("practicals", []))
        links_text = " ".join(buffers.get("elearning", []))
        current.e_learning = _URL.findall(links_text)
        current.books = _split_numbered(buffers.get("books", []))
        unit_lines = buffers.get("units", [])
        if unit_lines and not any(_UNIT.match(l) for l in unit_lines) and any(_NUMBERED.match(l) for l in unit_lines):
            # A practical list with a lead-in line, e.g. "Using Excel, MATLAB and Mathematica: 1. ..."
            first = next(i for i, l in enumerate(unit_lines) if _NUMBERED.match(l))
            current.practicals = current.practicals or _split_numbered(unit_lines[first:])
            unit_lines = []
        _finalise_units(current, unit_lines)
        if not current.units and not current.practicals:
            current.warnings.append("No units or practical list detected")
        if not current.description:
            current.warnings.append("Course description not detected")
        modules.append(current)
        current = None

    first_marker: int | None = None
    for page_no, text in enumerate(pages, start=1):
        for raw in text.splitlines():
            line = raw.strip()
            if not line or re.search(r"Name of the Department", line):
                continue
            sem = re.match(r"^Semester\s*[-–]?\s*([IVX]+)\b", line)
            if sem and sem.group(1) in _ROMAN:
                finish()
                semester = _ROMAN[sem.group(1)]
                first_marker = first_marker or semester
                continue
            if _MODULE_START.match(line):
                finish()
                current = Module(name="", code=None, pages=[page_no], semester=semester)
                section, header_lines, buffers = "header", [line], {}
                continue
            if current is None:
                continue
            if page_no not in current.pages:
                current.pages.append(page_no)
            matched = next((name for name, pat in _SECTION_PATTERNS if pat.match(line)), None)
            if matched:
                section = matched
                continue
            if section == "header":
                header_lines.append(line)
            elif section == "units" and _UNIT.match(line) is None and _NUMBERED.match(line) and not buffers.get("units"):
                # labs list their practicals under "Detailed contents" / "Contents"
                buffers.setdefault("practicals", []).append(line)
                section = "practicals"
            else:
                buffers.setdefault(section, []).append(line)
    finish()

    # The source has no "Semester-I" marker: modules before "Semester-II" belong to semester 1.
    if first_marker == 2:
        for m in modules:
            if m.semester is None:
                m.semester = 1
    return modules


def _drop_intro(lines: list[str]) -> list[str]:
    """Remove lead-ins such as 'After completing the course, students are expected to be able:'."""
    return [l for l in lines if not re.match(r"^(After|By the end|Upon|On completion|Students that|The objective|The students|Objectives:)", l, re.I)]


def _finalise_units(module: Module, lines: list[str]) -> None:
    unit: Unit | None = None
    pending_lectures = False
    for line in lines:
        m = _UNIT.match(line)
        if m:
            if unit:
                module.units.append(unit)
            lec = m.group("lec")
            title = _norm(m.group("title") or "")
            unit = Unit(number=int(m.group("num")), lectures=int(lec) if lec else None, title=title)
            pending_lectures = lec is None
            continue
        if unit is None:
            continue
        if pending_lectures and re.fullmatch(r"\d{1,3}", line):
            unit.lectures, pending_lectures = int(line), False
            continue
        if not unit.title:
            unit.title = _norm(re.sub(r"^Title of the unit\s*:?", "", line, flags=re.I))
            continue
        unit.content = _norm(f"{unit.content} {line}")
    if unit:
        module.units.append(unit)
    for u in module.units:
        if not u.content:
            module.warnings.append(f"Unit {u.number}: content not separated from title; review manually")


# ---------------------------------------------------------------------------
# 3. Storage
# ---------------------------------------------------------------------------


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:80]


def topic_id(module: Module) -> str:
    return f"pdf-{module.code or 'nocode'}-{_slug(module.name) or 'module'}"


def ingest_pdf(db: Session, pdf_bytes: bytes, filename: str) -> tuple[IngestionRun, int, int, list[Module]]:
    extraction = extract_pages(pdf_bytes)
    modules = parse_syllabus(extraction.pages, extraction.type_marks)

    warnings: list[str] = []
    if extraction.flagged_pages:
        warnings.append(
            "Pages with little or no text (blank, section-divider or image-only; install OCR extras for scanned pages): "
            + ", ".join(map(str, extraction.flagged_pages))
        )
    if extraction.ocr_pages:
        warnings.append("Pages read with OCR (verify carefully): " + ", ".join(map(str, extraction.ocr_pages)))
    for m in modules:
        warnings.extend(f"{m.name or '?'} (p{m.pages[0]}): {w}" for w in m.warnings)

    run = IngestionRun(
        filename=filename[:255],
        sha256=hashlib.sha256(pdf_bytes).hexdigest(),
        page_count=extraction.page_count,
        modules_found=len(modules),
        warnings=warnings,
    )
    db.add(run)
    db.flush()

    created = updated = 0
    for m in modules:
        tid = topic_id(m)
        topic = db.get(SourceTopic, tid)
        data = {
            "id": tid,
            "name": m.name,
            "syllabus_code": m.code,
            "semester": m.semester,
            "description": m.description,
            "source_pages": m.pages,
            "extracted": m.to_dict(),
        }
        if topic is None:
            db.add(
                SourceTopic(
                    id=tid,
                    name=m.name or tid,
                    origin="pdf-ingestion",
                    status="pending_review",
                    review_note="Extracted automatically; review before linking to any public offering.",
                    ingestion_run_id=run.id,
                    data=data,
                )
            )
            created += 1
        else:
            # refresh extracted data but never change an editor's review decision
            topic.data = {**topic.data, "extracted": m.to_dict(), "source_pages": m.pages}
            topic.ingestion_run_id = run.id
            updated += 1
    db.commit()
    db.refresh(run)
    log.info("Ingested %s: %s pages, %s modules, %s warnings", run.filename, run.page_count, len(modules), len(warnings))
    return run, created, updated, modules
