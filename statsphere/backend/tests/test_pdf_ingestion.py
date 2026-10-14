from __future__ import annotations

from pathlib import Path

import pytest

from app.services.pdf_ingestion import parse_syllabus, topic_id

SOURCE_PDF = Path(__file__).resolve().parents[2] / "data" / "source" / "bsc-hons-statistics-data-science-syllabus.pdf"

# Two pages written in the same template as the source syllabus, including the
# awkward table wrapping seen in the real PDF ("2. Course Operations / L T P / Name Research").
SAMPLE_PAGES = [
    """Syllabus
B.Sc. (Hons) Statistics & Data Science""",
    """1. Course Name Descriptive L T P
Statistics
2. Course Code 17200102 4 0 0
3. Type of Course (use tick Core (✔) DSE () AEC () SEC OE ()
6. Total Number of Lectures, Tutorials, Practical
Lectures = 60 Tutorials = 0 Practical = 0
7. Course Description:
This course covers measures of central tendency and dispersion.
8. Course Objectives:
1. To summarise numerical data.
2. To use graphical techniques.
9. Course Outcomes (COs):
After completing the course, students are expected to be able to:
1. Describe key terminology
2. Conduct basic statistical analysis of data.
10. Unit wise detailed content
Unit – 1 Number of lectures = 15 Title of the unit: Introduction of data with graph
Variable and data, types of variables, Pie Charts and Bar Charts.
Unit – 2 Number of lectures = 15 Title of the unit: Measures of dispersion
Range, Quartile Deviation, Standard Deviation.
11. Brief Description of self-learning / E-learning component
https://example.org/course-a
12. Books Recommended
1. A Textbook of Statistics, Publisher, 2019.""",
    """Semester-II""",
    """1. Name of the Department: Mathematics
2. Course Operations
L T P
Name Research
3. Course 17200305
2 0 0
Code
4. Type of Course (use tick Core (✔) DSE () AE SEC () OE ()
7. Total Number of Lectures, Tutorials, Practical
Lectures = 30 Tutorials = 0 Practical = 0
8. Course Description:
Operations Research is a science of modelling and optimisation.
9. Course Objectives:
This module introduces quantitative methods for decision making.
11. Unit wise detailed content
Unit-1 Number of lectures =8 Title of the unit: Linear Programming
Formulation and Graphical Solution.
13. Books Recommended
1. Operations research - an introduction.""",
    """1. Name of the Department: Mathematics
2. Course Name Analytics using Excel L T P
3. Course Code 17200101 0 0 4
4. Type of Course (use tick mark) Core () DSE () AEC () SEC (✔) OE ()
7. Total Number of Lectures, Tutorials, Practical
Lectures = 0 Tutorials =0 Practical = 60
8. Course Description:
Tools to create and use spreadsheets.
11. Contents
1. Basic Functions: Sum / Average / Count
2. PivotTables: Creating and formatting""",
]


def test_parses_sample_modules():
    modules = parse_syllabus(SAMPLE_PAGES)
    assert [m.name for m in modules] == ["Descriptive Statistics", "Operations Research", "Analytics using Excel"]

    ds, opr, excel = modules
    assert ds.code == "17200102" and ds.ltp == [4, 0, 0] and ds.course_type == "Core"
    assert ds.semester == 1  # before the first "Semester-II" marker
    assert ds.pages == [2]
    assert ds.objectives == ["To summarise numerical data.", "To use graphical techniques."]
    assert ds.outcomes[0] == "Describe key terminology"
    assert [u.title for u in ds.units] == ["Introduction of data with graph", "Measures of dispersion"]
    assert ds.units[0].lectures == 15
    assert "Pie Charts" in ds.units[0].content
    assert ds.e_learning == ["https://example.org/course-a"]
    assert ds.books == ["A Textbook of Statistics, Publisher, 2019."]

    assert opr.code == "17200305" and opr.ltp == [2, 0, 0] and opr.semester == 2
    assert opr.units[0].title == "Linear Programming" and opr.units[0].lectures == 8

    assert excel.course_type == "SEC" and excel.is_lab is False
    assert excel.practicals == ["Basic Functions: Sum / Average / Count", "PivotTables: Creating and formatting"]


def test_topic_ids_are_stable():
    m = parse_syllabus(SAMPLE_PAGES)[0]
    assert topic_id(m) == "pdf-17200102-descriptive-statistics"


@pytest.mark.skipif(not SOURCE_PDF.exists(), reason="source PDF not present (it is not committed to git)")
def test_full_source_pdf():
    from app.services.pdf_ingestion import extract_pages

    extraction = extract_pages(SOURCE_PDF.read_bytes())
    assert extraction.page_count == 114
    modules = parse_syllabus(extraction.pages, extraction.type_marks)
    assert len(modules) == 51
    codes = {m.code for m in modules}
    assert {"17200102", "17200305", "17200602", "17200801", "17200805"} <= codes
    assert all(m.name for m in modules)
    assert {m.semester for m in modules} == set(range(1, 9))
    # Every module's course type is read, including the skill-enhancement courses whose tick
    # is wrapped below its label in the table (resolved from character positions).
    assert all(m.course_type for m in modules)
    assert not [w for m in modules for w in m.warnings]
    by_name = {m.name: m.course_type for m in modules}
    assert by_name["Analytics using Excel"] == "SEC"
    assert by_name["Research Methodology"] == "AECC"
    assert by_name["Hadoop Programming"] == "SEC"
    assert by_name["Descriptive Statistics"] == "Core"


@pytest.mark.skipif(not SOURCE_PDF.exists(), reason="source PDF not present")
def test_ingestion_creates_pending_topics(client, admin_headers):
    with SOURCE_PDF.open("rb") as fh:
        r = client.post(
            "/api/admin/pdf-ingestion",
            files={"file": (SOURCE_PDF.name, fh, "application/pdf")},
            headers=admin_headers,
        )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["run"]["modules_found"] == 51
    topics = client.get("/api/admin/topics", params={"origin": "pdf-ingestion"}, headers=admin_headers).json()
    assert len(topics) == 51
    assert all(t["status"] == "pending_review" for t in topics)
    # Never published automatically
    public_ids = {t["id"] for t in client.get("/api/topics").json()["items"]}
    assert not any(t["id"] in public_ids for t in topics)
