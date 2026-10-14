"""Optional e-mail notification for new enquiries.

If SMTP is not configured, enquiries are still stored and visible in the admin
area; the notification is recorded as `skipped`. Nothing pretends to send mail.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models import Enquiry

log = logging.getLogger(__name__)

TYPE_LABELS = {
    "consulting": "Consulting enquiry",
    "course": "Course enquiry",
    "corporate": "Corporate training enquiry",
    "contact": "General contact message",
}


FIELD_LABELS = {
    "service_slug": "Service",
    "course_slug": "Course",
    "workshop_slugs": "Workshops",
    "client_type": "Enquiring as",
    "data_status": "Data ready?",
    "timeline": "Timeline",
    "budget_range": "Indicative budget",
    "preferred_date": "Preferred call date",
    "preferred_time": "Preferred time of day",
    "learner_type": "Learner type",
    "experience_level": "Experience with topic",
    "preferred_mode": "Preferred delivery",
    "job_title": "Job title",
    "team_size": "Participants",
    "preferred_format": "Preferred format",
}
MESSAGE_LABELS = {
    "consulting": "Project description",
    "course": "Message",
    "corporate": "Training goals",
    "contact": "Message",
}
_REF_KINDS = {"service_slug": "service", "course_slug": "course", "workshop_slugs": "workshop"}


def _titles(db, kind: str, slugs: list[str]) -> list[str]:
    from sqlalchemy import select

    from app.models import CatalogueItem

    rows = {r.slug: r.title for r in db.scalars(select(CatalogueItem).where(CatalogueItem.kind == kind, CatalogueItem.slug.in_(slugs)))}
    return [rows.get(s, s) for s in slugs]


def _readable(db, key: str, value) -> str:
    if key in _REF_KINDS:
        slugs = value if isinstance(value, list) else [value]
        return ", ".join(_titles(db, _REF_KINDS[key], slugs))
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    return str(value).replace("_", " ")


def _compose(enquiry: Enquiry, db=None) -> EmailMessage:
    """Plain-text e-mail containing every field the visitor submitted."""
    s = get_settings()
    kind = TYPE_LABELS.get(enquiry.type, "Enquiry")
    msg = EmailMessage()
    msg["Subject"] = f"[SGT Consulting] {kind} from {enquiry.name} ({enquiry.reference})"
    msg["From"] = s.sender
    msg["To"] = s.notify_email
    msg["Reply-To"] = enquiry.email  # replying goes straight to the visitor

    rows = [
        ("Reference", enquiry.reference),
        ("Type", kind),
        ("Received", enquiry.created_at.strftime("%d %b %Y, %H:%M UTC") if enquiry.created_at else "-"),
        ("Name", enquiry.name),
        ("Email", enquiry.email),
        ("Phone", enquiry.phone or "-"),
        ("Organisation", enquiry.organisation or "-"),
        ("Preferred contact", enquiry.preferred_contact.replace("_", " ")),
    ]
    if enquiry.subject and enquiry.type == "contact":
        rows.append(("Subject", enquiry.subject))
    for key, value in (enquiry.details or {}).items():
        label = FIELD_LABELS.get(key, key.replace("_", " ").capitalize())
        rows.append((label, _readable(db, key, value) if db is not None else str(value)))

    width = max(len(label) for label, _ in rows)
    lines = [f"New {kind.lower()} submitted on the SGT Consulting Services website.", ""]
    lines += [f"{label.ljust(width)} : {value}" for label, value in rows]
    if enquiry.message:
        lines += ["", f"{MESSAGE_LABELS.get(enquiry.type, 'Message')}:", "-" * 40, enquiry.message, "-" * 40]
    lines += ["", "Reply to this e-mail to answer the visitor directly.", "The enquiry is also stored in the admin area (Admin → Enquiries)."]
    msg.set_content("\n".join(lines))
    return msg


def send_enquiry_notification(enquiry_id: int) -> None:
    """Runs as a background task after the enquiry has been committed."""
    s = get_settings()
    with SessionLocal() as db:
        enquiry = db.get(Enquiry, enquiry_id)
        if enquiry is None:
            return
        if not s.email_enabled:
            enquiry.notification_status = "skipped"
            db.commit()
            log.info("Enquiry %s stored; e-mail notification skipped (SMTP not configured)", enquiry.reference)
            return
        try:
            with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as smtp:
                if s.smtp_starttls:
                    smtp.starttls(context=ssl.create_default_context())
                if s.smtp_username and s.smtp_password:
                    smtp.login(s.smtp_username, s.smtp_password)
                smtp.send_message(_compose(enquiry, db))
            enquiry.notification_status = "sent"
            log.info("Enquiry %s notification sent", enquiry.reference)
        except (OSError, smtplib.SMTPException) as exc:
            enquiry.notification_status = "failed"
            log.warning("Enquiry %s notification failed: %s", enquiry.reference, type(exc).__name__)
        db.commit()
