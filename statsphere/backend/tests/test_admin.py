from __future__ import annotations

import pytest

from tests.conftest import ADMIN_USER, base_enquiry


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/admin/me"),
        ("get", "/api/admin/enquiries"),
        ("get", "/api/admin/catalogue/course"),
        ("patch", "/api/admin/catalogue/course/excel-for-data-analytics"),
        ("get", "/api/admin/topics"),
        ("post", "/api/admin/pdf-ingestion"),
        ("get", "/api/admin/settings"),
    ],
)
def test_admin_endpoints_require_auth(client, method, path):
    r = getattr(client, method)(path)
    assert r.status_code == 401
    r = getattr(client, method)(path, headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401


def test_login_rejects_bad_password(client):
    r = client.post("/api/admin/login", json={"username": ADMIN_USER, "password": "wrong"})
    assert r.status_code == 401
    r = client.post("/api/admin/login", json={"username": "nobody", "password": "wrong"})
    assert r.status_code == 401


def test_me(client, admin_headers):
    assert client.get("/api/admin/me", headers=admin_headers).json() == {"username": ADMIN_USER}


def test_enquiry_workflow(client, admin_headers):
    ref = client.post("/api/contact", json=base_enquiry(subject="Workflow", message="Testing the admin workflow.")).json()["reference"]
    page = client.get("/api/admin/enquiries", params={"q": ref}, headers=admin_headers).json()
    assert page["total"] == 1
    enquiry = page["items"][0]
    assert enquiry["status"] == "new"

    r = client.patch(
        f"/api/admin/enquiries/{enquiry['id']}",
        json={"status": "responded", "admin_notes": "Replied by e-mail."},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "responded"

    bad = client.patch(f"/api/admin/enquiries/{enquiry['id']}", json={"status": "deleted"}, headers=admin_headers)
    assert bad.status_code == 422


def test_unpublishing_hides_course_from_public(client, admin_headers):
    slug = "financial-mathematics-economics"
    assert client.get(f"/api/courses/{slug}").status_code == 200
    r = client.patch(f"/api/admin/catalogue/course/{slug}", json={"status": "draft"}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["status"] == "draft"
    assert client.get(f"/api/courses/{slug}").status_code == 404
    client.patch(f"/api/admin/catalogue/course/{slug}", json={"status": "published"}, headers=admin_headers)
    assert client.get(f"/api/courses/{slug}").status_code == 200


def test_course_availability_update(client, admin_headers):
    slug = "excel-for-data-analytics"
    r = client.patch(f"/api/admin/catalogue/course/{slug}", json={"availability": "enquiries_open"}, headers=admin_headers)
    assert r.status_code == 200
    assert client.get(f"/api/courses/{slug}").json()["availability"] == "enquiries_open"
    client.patch(f"/api/admin/catalogue/course/{slug}", json={"availability": "proposed"}, headers=admin_headers)


def test_content_edit_is_validated(client, admin_headers):
    slug = "r-programming-for-statistics"
    data = client.get(f"/api/admin/catalogue/course/{slug}", headers=admin_headers).json()
    for k in ("updated_at",):
        data.pop(k, None)

    data["level"] = "Expert"  # not an allowed level
    r = client.patch(f"/api/admin/catalogue/course/{slug}", json={"data": data}, headers=admin_headers)
    assert r.status_code == 422

    data["level"] = "Beginner"
    data["summary"] = "Updated summary for testing."
    r = client.patch(f"/api/admin/catalogue/course/{slug}", json={"data": data}, headers=admin_headers)
    assert r.status_code == 200, r.text
    assert client.get(f"/api/courses/{slug}").json()["summary"] == "Updated summary for testing."


def test_topic_review(client, admin_headers):
    pending = client.get("/api/admin/topics", params={"status": "pending_review"}, headers=admin_headers).json()
    assert pending
    tid = pending[0]["id"]
    r = client.patch(f"/api/admin/topics/{tid}", json={"status": "approved", "review_note": "Reviewed"}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["status"] == "approved"
    assert any(t["id"] == tid for t in client.get("/api/topics").json()["items"])
    client.patch(f"/api/admin/topics/{tid}", json={"status": "pending_review"}, headers=admin_headers)


def test_settings_roundtrip_and_public_exposure(client, admin_headers):
    r = client.put(
        "/api/admin/settings",
        json={"contact": {"email": "hello@example.com", "booking_url": "https://cal.example.com/statsphere"}},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert client.get("/api/site").json()["contact"]["email"] == "hello@example.com"
    bad = client.put("/api/admin/settings", json={"contact": {"booking_url": "http://insecure"}}, headers=admin_headers)
    assert bad.status_code == 422
    client.put("/api/admin/settings", json={"contact": {}}, headers=admin_headers)


def test_pdf_upload_rejects_non_pdf(client, admin_headers):
    r = client.post(
        "/api/admin/pdf-ingestion",
        files={"file": ("notes.txt", b"hello", "text/plain")},
        headers=admin_headers,
    )
    assert r.status_code == 415
