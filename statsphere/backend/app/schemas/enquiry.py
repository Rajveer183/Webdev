"""Request/response schemas for the public enquiry and contact forms."""

from __future__ import annotations

import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

PreferredContact = Literal["email", "phone", "video_call"]
Timeline = Literal["asap", "within_1_month", "1_3_months", "3_6_months", "flexible"]
_PHONE = re.compile(r"^\+?[0-9 ()\-]{7,20}$")


def _clean(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    return v or None


class EnquiryBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    organisation: str | None = Field(default=None, max_length=160)
    preferred_contact: PreferredContact = "email"
    consent: bool = Field(description="Visitor agrees that their details may be stored to answer the enquiry")
    # Spam protection: `website` is a hidden honeypot field humans never fill in;
    # `form_started_at` is the client timestamp (ms since epoch) when the form was rendered.
    website: str | None = Field(default=None, max_length=200)
    form_started_at: int | None = None

    @field_validator("phone", "organisation", "website", mode="before")
    @classmethod
    def _blank_to_none(cls, v):
        return _clean(v) if isinstance(v, str) else v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v is not None and not _PHONE.match(v):
            raise ValueError("Enter a valid phone number (digits, spaces, +, - and brackets only)")
        return v

    @field_validator("consent")
    @classmethod
    def _consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Please confirm that we may store your details to respond to this enquiry")
        return v

    @model_validator(mode="after")
    def _phone_needed_for_calls(self):
        if self.preferred_contact == "phone" and not self.phone:
            raise ValueError("Please add a phone number if you would like us to call you")
        return self


class ConsultingEnquiry(EnquiryBase):
    service_slug: str | None = Field(default=None, max_length=120)
    client_type: Literal["business", "researcher", "student", "public_sector", "other"] = "business"
    project_description: str = Field(min_length=20, max_length=5000)
    data_status: Literal["ready", "partial", "not_yet", "not_sure"] = "not_sure"
    timeline: Timeline = "flexible"
    budget_range: str | None = Field(default=None, max_length=80)
    preferred_date: date | None = None
    preferred_time: Literal["morning", "afternoon", "evening", "any"] | None = None


class CourseEnquiry(EnquiryBase):
    course_slug: str = Field(min_length=1, max_length=120)
    learner_type: Literal["student", "professional", "researcher", "educator", "other"] = "student"
    experience_level: Literal["none", "some", "confident"] = "some"
    preferred_mode: Literal["online", "in-person", "hybrid", "no_preference"] = "no_preference"
    message: str | None = Field(default=None, max_length=3000)


class CorporateTrainingEnquiry(EnquiryBase):
    organisation: str = Field(min_length=2, max_length=160)
    job_title: str | None = Field(default=None, max_length=120)
    team_size: int = Field(ge=1, le=5000)
    workshop_slugs: list[str] = Field(default_factory=list, max_length=12)
    preferred_format: Literal["half_day", "one_day", "two_three_days", "multi_week", "not_sure"] = "not_sure"
    preferred_mode: Literal["online", "in-person", "hybrid", "no_preference"] = "no_preference"
    timeline: Timeline = "flexible"
    objectives: str = Field(min_length=20, max_length=5000)


class ContactMessage(EnquiryBase):
    subject: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=10, max_length=5000)


class EnquiryReceipt(BaseModel):
    reference: str
    status: Literal["received"] = "received"
    message: str
