"""Guards on the curated content itself: schema validity, cross-references and integrity rules."""

from __future__ import annotations

import json
import re

import pytest

from app.core.config import get_settings
from app.schemas.content import KIND_FILES, TopicContent
from app.services.catalogue import check_cross_references, validate_content


def _load(name: str):
    return json.loads((get_settings().content_dir / name).read_text(encoding="utf-8"))


@pytest.mark.parametrize("kind,filename", list(KIND_FILES.items()))
def test_content_files_validate(kind, filename):
    records = _load(filename)
    assert records
    for r in records:
        validate_content(kind, r)
    slugs = [r["slug"] for r in records]
    assert len(slugs) == len(set(slugs))


def test_topics_validate():
    for t in _load("topics.json"):
        TopicContent.model_validate(t)


def test_no_broken_cross_references():
    assert check_cross_references() == []


def test_courses_make_no_unconfirmed_commercial_claims():
    for c in _load("courses.json"):
        assert c["fee"] is None
        assert c["availability"] == "proposed"
        assert c["delivery_modes"] == []
        assert c["certificate"]["type"] == "completion"


_FORBIDDEN = re.compile(
    r"\b(accredited|accreditation|government[- ]recognised|government[- ]recognized|ugc[- ]approved|"
    r"guaranteed|guarantee[sd]? (?:a )?(?:job|placement|results?)|100% placement|testimonial)\b",
    re.I,
)
_ALLOWED_CONTEXT = re.compile(r"\b(not|never|no|nor|cannot|do not|does not|isn't|aren't)\b[^.]{0,80}$", re.I)


@pytest.mark.parametrize("filename", ["services.json", "courses.json", "workshops.json", "site.json"])
def test_no_unsupported_claims(filename):
    text = (get_settings().content_dir / filename).read_text(encoding="utf-8")
    for m in _FORBIDDEN.finditer(text):
        before = text[max(0, m.start() - 120) : m.start()]
        after = text[m.end() : m.end() + 80]
        is_question = "?" in after.split('"')[0]  # e.g. the FAQ question "Are the courses accredited ...?"
        assert is_question or _ALLOWED_CONTEXT.search(before), (
            f"Possible unsupported claim in {filename}: ...{before[-60:]}{m.group(0)}..."
        )


def test_every_record_has_source_pages_within_pdf():
    for filename in list(KIND_FILES.values()) + ["topics.json"]:
        for r in _load(filename):
            assert r["source_pages"], f"{filename}: {r.get('slug') or r.get('id')} has no source pages"
            assert all(1 <= p <= 114 for p in r["source_pages"])


def test_projects_are_all_synthetic():
    assert all(p["is_synthetic"] for p in _load("projects.json"))
