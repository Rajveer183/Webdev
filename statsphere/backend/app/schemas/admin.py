"""Schemas for the protected admin API."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.content import Availability, Status

EnquiryStatus = Literal["new", "in_progress", "responded", "closed", "spam"]


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class AdminMe(BaseModel):
    username: str


class EnquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    type: str
    status: str
    name: str
    email: str
    phone: str | None
    organisation: str | None
    preferred_contact: str
    subject: str | None
    message: str | None
    details: dict[str, Any]
    admin_notes: str | None
    notification_status: str
    created_at: datetime
    updated_at: datetime


class EnquiryPage(BaseModel):
    items: list[EnquiryOut]
    total: int
    page: int
    page_size: int


class EnquiryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: EnquiryStatus | None = None
    admin_notes: str | None = Field(default=None, max_length=5000)


class CatalogueRow(BaseModel):
    kind: str
    slug: str
    title: str
    category: str | None
    level: str | None
    status: str
    availability: str | None
    featured: bool
    order: int
    updated_at: datetime


class CatalogueUpdate(BaseModel):
    """Partial update. `data` replaces the full content record and is validated against its schema."""

    model_config = ConfigDict(extra="forbid")

    status: Status | None = None
    availability: Availability | None = None
    featured: bool | None = None
    order: int | None = None
    data: dict[str, Any] | None = None


class TopicOut(BaseModel):
    id: str
    name: str
    origin: str
    status: str
    review_note: str | None
    ingestion_run_id: int | None
    data: dict[str, Any]
    updated_at: datetime


class TopicUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["approved", "pending_review", "excluded"] | None = None
    review_note: str | None = Field(default=None, max_length=2000)


class ContactSettings(BaseModel):
    """Public business details. Empty values are hidden on the website."""

    model_config = ConfigDict(extra="forbid")

    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    whatsapp: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=300)
    hours: str | None = Field(default=None, max_length=120)
    booking_url: str | None = Field(default=None, max_length=300, pattern=r"^https://")
    linkedin_url: str | None = Field(default=None, max_length=300, pattern=r"^https://")


class BrandSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=120)
    tagline: str | None = Field(default=None, max_length=200)
    show_institution_logo: bool | None = None


class SettingsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contact: ContactSettings | None = None
    brand: BrandSettings | None = None


class IngestionRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    sha256: str
    page_count: int
    modules_found: int
    warnings: list[str]
    created_at: datetime


class IngestionResult(BaseModel):
    run: IngestionRunOut
    topics_created: int
    topics_updated: int


class DashboardStats(BaseModel):
    enquiries_by_status: dict[str, int]
    enquiries_by_type: dict[str, int]
    catalogue_by_kind: dict[str, dict[str, int]]
    topics_by_status: dict[str, int]
