from __future__ import annotations

import pytest


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["database"] == "ok"


def test_site_content_has_faq_and_no_invented_contact_details(client):
    body = client.get("/api/site").json()
    assert len(body["content"]["faq"]) >= 5
    # No contact details are published until configured in the admin area.
    assert all(v is None for v in body["contact"].values())


def test_notification_inbox_is_never_public(client):
    from app.core.config import get_settings

    inbox = get_settings().notify_email
    assert inbox
    for path in ("/api/site", "/api/services", "/api/courses", "/api/health"):
        assert inbox not in client.get(path).text


@pytest.mark.parametrize(
    "path,expected",
    [("/api/services", 14), ("/api/courses", 22), ("/api/articles", 21), ("/api/projects", 7), ("/api/workshops", 9)],
)
def test_list_endpoints(client, path, expected):
    r = client.get(path)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == expected == len(body["items"])
    assert all(i["status"] == "published" for i in body["items"])


def test_course_filters(client):
    beginners = client.get("/api/courses", params={"level": "Beginner"}).json()["items"]
    assert beginners and all(c["level"] == "Beginner" for c in beginners)
    short = client.get("/api/courses", params={"format": "short-course"}).json()["items"]
    assert short and all(c["format"] == "short-course" for c in short)
    found = client.get("/api/courses", params={"q": "kaplan"}).json()["items"]
    assert any(c["slug"] == "survival-reliability-analysis" for c in found)
    # Delivery modes are unconfirmed, so a mode filter returns nothing rather than guessing.
    assert client.get("/api/courses", params={"mode": "online"}).json()["total"] == 0


def test_invalid_filter_value_is_rejected(client):
    r = client.get("/api/courses", params={"level": "Expert"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"


def test_course_detail_has_integrity_fields(client):
    c = client.get("/api/courses/statistics-for-data-analysis").json()
    assert c["certificate"]["type"] == "completion"
    assert c["fee"] is None
    assert c["availability"] == "proposed"
    assert c["delivery_modes"] == []
    assert c["source_pages"]
    assert {"services", "courses", "articles"} <= set(c["related"])


def test_cards_do_not_include_heavy_fields(client):
    item = client.get("/api/articles").json()["items"][0]
    assert "body" not in item
    proj = client.get("/api/projects").json()["items"][0]
    assert "charts" not in proj


def test_project_detail_is_marked_synthetic(client):
    p = client.get("/api/projects/process-control-xbar-r").json()
    assert p["is_synthetic"] is True
    assert p["charts"] and p["charts"][0]["data"]


def test_unknown_slug_returns_404_envelope(client):
    r = client.get("/api/services/not-a-service")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"


def test_topics_only_returns_approved(client):
    items = client.get("/api/topics").json()["items"]
    ids = {t["id"] for t in items}
    assert items
    assert "review_note" not in items[0]
    assert not any("operating-system" in i for i in ids)  # excluded in the catalogue


def test_security_headers(client):
    r = client.get("/api/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"


def test_internal_editorial_notes_are_not_public(client, admin_headers):
    assert "approval_note" not in client.get("/api/services/big-data-analytics").json()
    internal = client.get("/api/admin/catalogue/service/big-data-analytics", headers=admin_headers).json()
    assert internal["approval_note"]
