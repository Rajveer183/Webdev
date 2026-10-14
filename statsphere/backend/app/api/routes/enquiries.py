"""Public enquiry and contact endpoints.

A 201 response is returned only after the enquiry has been committed to the
database. Spam (honeypot / too-fast submissions) receives a generic 202 and is
not stored, so bots learn nothing.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.rate_limit import enquiry_rate_limit
from app.schemas.enquiry import (
    ConsultingEnquiry,
    ContactMessage,
    CorporateTrainingEnquiry,
    CourseEnquiry,
    EnquiryBase,
    EnquiryReceipt,
)
from app.services.enquiries import UnknownReferenceError, create_enquiry, looks_like_spam, validate_references
from app.services.notifications import send_enquiry_notification

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["enquiries"], dependencies=[Depends(enquiry_rate_limit)])

_MESSAGES = {
    "consulting": "Thank you. Your consultation request has been received and we will reply using your preferred contact method.",
    "course": "Thank you for your interest. We will contact you with course details as they are confirmed.",
    "corporate": "Thank you. We will be in touch to discuss your training needs and prepare a proposal.",
    "contact": "Thank you for your message. We will get back to you soon.",
}


def _handle(enquiry_type: str, payload: EnquiryBase, background: BackgroundTasks, db: Session):
    reason = looks_like_spam(payload)
    if reason:
        log.info("Discarded %s submission (%s)", enquiry_type, reason)
        return JSONResponse(status_code=status.HTTP_202_ACCEPTED, content={"status": "accepted"})
    try:
        validate_references(db, enquiry_type, payload)
    except UnknownReferenceError as exc:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Some fields need attention",
                    "details": [{"field": exc.field, "message": str(exc)}],
                }
            },
        )
    enquiry = create_enquiry(db, enquiry_type, payload)
    background.add_task(send_enquiry_notification, enquiry.id)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=EnquiryReceipt(reference=enquiry.reference, message=_MESSAGES[enquiry_type]).model_dump(),
    )


@router.post("/enquiries/consulting", status_code=201, response_model=EnquiryReceipt)
def consulting(payload: ConsultingEnquiry, background: BackgroundTasks, db: Session = Depends(get_db)):
    return _handle("consulting", payload, background, db)


@router.post("/enquiries/courses", status_code=201, response_model=EnquiryReceipt)
def course(payload: CourseEnquiry, background: BackgroundTasks, db: Session = Depends(get_db)):
    return _handle("course", payload, background, db)


@router.post("/enquiries/corporate-training", status_code=201, response_model=EnquiryReceipt)
def corporate(payload: CorporateTrainingEnquiry, background: BackgroundTasks, db: Session = Depends(get_db)):
    return _handle("corporate", payload, background, db)


@router.post("/contact", status_code=201, response_model=EnquiryReceipt)
def contact(payload: ContactMessage, background: BackgroundTasks, db: Session = Depends(get_db)):
    return _handle("contact", payload, background, db)
