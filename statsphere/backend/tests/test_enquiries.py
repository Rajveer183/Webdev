from __future__ import annotations

import time

from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models import Enquiry
from tests.conftest import base_enquiry


def _count(email: str) -> int:
    with SessionLocal() as db:
        return len(db.scalars(select(Enquiry).where(Enquiry.email == email)).all())


def test_consulting_enquiry_is_stored(client):
    payload = base_enquiry(
        email="consult@example.com",
        service_slug="time-series-forecasting",
        project_description="We need a twelve-month demand forecast for 40 product lines.",
        timeline="1_3_months",
        data_status="ready",
        preferred_date="2026-11-02",
        preferred_time="morning",
    )
    r = client.post("/api/enquiries/consulting", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "received"
    assert body["reference"].startswith("SSC-")
    with SessionLocal() as db:
        e = db.scalar(select(Enquiry).where(Enquiry.reference == body["reference"]))
        assert e.type == "consulting"
        assert e.message.startswith("We need")
        assert e.details["service_slug"] == "time-series-forecasting"
        assert e.notification_status in ("skipped", "pending")


def test_course_enquiry_requires_known_course(client):
    r = client.post("/api/enquiries/courses", json=base_enquiry(course_slug="not-a-course"))
    assert r.status_code == 422
    assert r.json()["error"]["details"][0]["field"] == "course_slug"

    ok = client.post("/api/enquiries/courses", json=base_enquiry(course_slug="excel-for-data-analytics"))
    assert ok.status_code == 201


def test_corporate_enquiry(client):
    r = client.post(
        "/api/enquiries/corporate-training",
        json=base_enquiry(
            organisation="Example Manufacturing Ltd",
            team_size=15,
            workshop_slugs=["quality-control-for-operations"],
            objectives="Train our quality team to set up and read control charts.",
        ),
    )
    assert r.status_code == 201, r.text


def test_contact_message(client):
    r = client.post("/api/contact", json=base_enquiry(subject="Question", message="Do you work with SPSS output?"))
    assert r.status_code == 201


def test_validation_errors_are_field_level(client):
    r = client.post(
        "/api/contact",
        json=base_enquiry(email="not-an-email", subject="Hi", message="short", consent=False),
    )
    assert r.status_code == 422
    fields = {d["field"] for d in r.json()["error"]["details"]}
    assert {"email", "subject", "message", "consent"} <= fields


def test_phone_required_when_phone_preferred(client):
    r = client.post(
        "/api/contact",
        json=base_enquiry(preferred_contact="phone", subject="Call me", message="Please call me back about a project."),
    )
    assert r.status_code == 422


def test_unknown_fields_are_rejected(client):
    r = client.post("/api/contact", json=base_enquiry(subject="Hello", message="A normal message here.", admin=True))
    assert r.status_code == 422


def test_honeypot_submission_is_not_stored(client):
    r = client.post(
        "/api/contact",
        json=base_enquiry(email="bot@example.com", website="http://spam.example", subject="Buy", message="Cheap things for sale!!"),
    )
    assert r.status_code == 202
    assert _count("bot@example.com") == 0


def test_too_fast_submission_is_not_stored(client):
    r = client.post(
        "/api/contact",
        json=base_enquiry(
            email="fast@example.com",
            subject="Hello",
            message="Submitted instantly by a script.",
            form_started_at=int(time.time() * 1000),
        ),
    )
    assert r.status_code == 202
    assert _count("fast@example.com") == 0


def test_rate_limit(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "enquiry_rate_limit", 2)
    payload = base_enquiry(subject="Hello", message="Rate limit test message.")
    assert client.post("/api/contact", json=payload).status_code == 201
    assert client.post("/api/contact", json=payload).status_code == 201
    r = client.post("/api/contact", json=payload)
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "rate_limited"
    assert int(r.headers["retry-after"]) > 0


def test_enquiry_is_emailed_to_private_inbox_with_all_fields(client, monkeypatch):
    """Every submitted field reaches the notification inbox; nothing is sent when SMTP is off."""
    import app.services.notifications as notifications

    sent = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            self.host = host

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def starttls(self, context=None):
            pass

        def login(self, user, password):
            assert password == "app-password"

        def send_message(self, msg):
            sent.append(msg)

    s = get_settings()
    for k, v in {"smtp_host": "smtp.gmail.com", "smtp_username": "rajveersinghrathorer584@gmail.com", "smtp_password": "app-password", "smtp_from": None}.items():
        monkeypatch.setattr(s, k, v)
    monkeypatch.setattr(notifications.smtplib, "SMTP", FakeSMTP)

    r = client.post(
        "/api/enquiries/corporate-training",
        json=base_enquiry(
            name="Meera Shah",
            email="meera@example.com",
            phone="+91 98765 43210",
            organisation="Example Pharma",
            team_size=12,
            workshop_slugs=["quality-control-for-operations"],
            preferred_format="one_day",
            objectives="Train our QA team on control charts and acceptance sampling.",
        ),
    )
    assert r.status_code == 201
    assert len(sent) == 1
    msg = sent[0]
    body = msg.get_content()
    assert msg["To"] == "rajveersinghrathorer584@gmail.com"
    assert msg["From"] == "rajveersinghrathorer584@gmail.com"
    assert msg["Reply-To"] == "meera@example.com"
    assert "Meera Shah" in msg["Subject"] and r.json()["reference"] in msg["Subject"]
    for expected in ["meera@example.com", "+91 98765 43210", "Example Pharma", "12", "Quality Control", "one day", "control charts and acceptance sampling"]:
        assert expected in body, expected

    with SessionLocal() as db:
        e = db.scalar(select(Enquiry).where(Enquiry.reference == r.json()["reference"]))
        assert e.notification_status == "sent"


def test_no_email_without_smtp_password(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "smtp_host", "smtp.gmail.com")
    monkeypatch.setattr(s, "smtp_username", "rajveersinghrathorer584@gmail.com")
    monkeypatch.setattr(s, "smtp_password", None)
    assert s.email_enabled is False


def test_admin_resend_requires_email_configured(client, admin_headers):
    ref = client.post("/api/contact", json=base_enquiry(subject="Resend", message="Please resend this enquiry.")).json()["reference"]
    eid = client.get("/api/admin/enquiries", params={"q": ref}, headers=admin_headers).json()["items"][0]["id"]
    r = client.post(f"/api/admin/enquiries/{eid}/notify", headers=admin_headers)
    assert r.status_code == 400


def test_enquiry_is_emailed_via_brevo_when_api_key_set(client, monkeypatch):
    """With BREVO_API_KEY the notification goes over HTTPS (no SMTP), keeping Reply-To."""
    import httpx

    calls = []

    def fake_post(url, json, headers, timeout):
        calls.append((url, json, headers))
        return httpx.Response(201, json={"messageId": "x"})

    s = get_settings()
    for k, v in {"brevo_api_key": "test-key", "smtp_host": None, "smtp_username": None, "smtp_from": "sender@example.com"}.items():
        monkeypatch.setattr(s, k, v)
    monkeypatch.setattr(httpx, "post", fake_post)

    r = client.post("/api/contact", json=base_enquiry(email="asha@example.com", subject="Brevo", message="Please send this over HTTPS."))
    assert r.status_code == 201
    assert len(calls) == 1
    url, payload, headers = calls[0]
    assert url.startswith("https://api.brevo.com/")
    assert headers["api-key"] == "test-key"
    assert payload["sender"] == {"email": "sender@example.com"}
    assert payload["to"] == [{"email": s.notify_email}]
    assert payload["replyTo"] == {"email": "asha@example.com"}
    assert "Please send this over HTTPS." in payload["textContent"]
    with SessionLocal() as db:
        assert db.scalar(select(Enquiry).where(Enquiry.reference == r.json()["reference"])).notification_status == "sent"
