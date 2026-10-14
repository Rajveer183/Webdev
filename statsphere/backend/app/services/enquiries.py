"""Enquiry intake: spam screening, persistence and reference numbers."""

from __future__ import annotations

import logging
import secrets
import time
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import CatalogueItem, Enquiry
from app.schemas.enquiry import (
    ConsultingEnquiry,
    ContactMessage,
    CorporateTrainingEnquiry,
    CourseEnquiry,
    EnquiryBase,
)

log = logging.getLogger(__name__)

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I to avoid confusion when read aloud

_BASE_FIELDS = {"name", "email", "phone", "organisation", "preferred_contact", "consent", "website", "form_started_at"}


class UnknownReferenceError(ValueError):
    def __init__(self, field: str, message: str):
        super().__init__(message)
        self.field = field


def new_reference(db: Session) -> str:
    year = datetime.now(UTC).year
    while True:
        ref = f"SSC-{year}-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))
        if not db.scalar(select(Enquiry.id).where(Enquiry.reference == ref)):
            return ref


def looks_like_spam(payload: EnquiryBase) -> str | None:
    """Return a reason string if the submission should be silently discarded."""
    if payload.website:
        return "honeypot"
    if payload.form_started_at:
        elapsed = time.time() - payload.form_started_at / 1000
        if 0 <= elapsed < get_settings().min_form_fill_seconds:
            return "too_fast"
    return None


def _published_slugs(db: Session, kind: str) -> set[str]:
    return set(
        db.scalars(select(CatalogueItem.slug).where(CatalogueItem.kind == kind, CatalogueItem.status == "published"))
    )


def validate_references(db: Session, enquiry_type: str, payload: EnquiryBase) -> None:
    if isinstance(payload, ConsultingEnquiry) and payload.service_slug:
        if payload.service_slug not in _published_slugs(db, "service"):
            raise UnknownReferenceError("service_slug", "Please choose a service from the list")
    if isinstance(payload, CourseEnquiry):
        if payload.course_slug not in _published_slugs(db, "course"):
            raise UnknownReferenceError("course_slug", "Please choose a course from the list")
    if isinstance(payload, CorporateTrainingEnquiry) and payload.workshop_slugs:
        unknown = set(payload.workshop_slugs) - _published_slugs(db, "workshop")
        if unknown:
            raise UnknownReferenceError("workshop_slugs", "Please choose workshops from the list")


def create_enquiry(db: Session, enquiry_type: str, payload: EnquiryBase) -> Enquiry:
    data = payload.model_dump(mode="json")
    details: dict[str, Any] = {k: v for k, v in data.items() if k not in _BASE_FIELDS and v not in (None, [], "")}

    message = None
    subject = None
    if isinstance(payload, ConsultingEnquiry):
        message = details.pop("project_description")
        subject = "Consultation request"
    elif isinstance(payload, CourseEnquiry):
        message = details.pop("message", None)
        subject = "Course enquiry"
    elif isinstance(payload, CorporateTrainingEnquiry):
        message = details.pop("objectives")
        subject = "Corporate training proposal request"
    elif isinstance(payload, ContactMessage):
        message = details.pop("message")
        subject = details.pop("subject")

    enquiry = Enquiry(
        reference=new_reference(db),
        type=enquiry_type,
        status="new",
        name=payload.name,
        email=str(payload.email).lower(),
        phone=payload.phone,
        organisation=payload.organisation,
        preferred_contact=payload.preferred_contact,
        subject=subject,
        message=message,
        details=details,
        notification_status="pending",
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    log.info("Stored %s enquiry %s", enquiry_type, enquiry.reference)
    return enquiry
