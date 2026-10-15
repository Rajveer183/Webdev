"""ORM models. Importing this package registers every table on Base.metadata."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Integer, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, JSONType


def utcnow() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class CatalogueItem(TimestampMixin, Base):
    """A publishable content record: service, course, article, project or workshop.

    Frequently filtered fields are real columns; the full structured content lives in `data`.
    """

    __tablename__ = "catalogue_items"
    __table_args__ = (UniqueConstraint("kind", "slug", name="uq_catalogue_kind_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(20), index=True)  # service | course | article | project | workshop
    slug: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)
    level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)  # published | draft | archived
    availability: Mapped[str | None] = mapped_column(String(30), nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[dict] = mapped_column(JSONType, default=dict)


class SourceTopic(TimestampMixin, Base):
    """A topic in the PDF-derived content catalogue, subject to editorial review."""

    __tablename__ = "source_topics"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    origin: Mapped[str] = mapped_column(String(20), default="curated")  # curated | pdf-ingestion
    status: Mapped[str] = mapped_column(String(20), default="pending_review", index=True)  # approved | pending_review | excluded
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingestion_run_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    data: Mapped[dict] = mapped_column(JSONType, default=dict)


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    sha256: Mapped[str] = mapped_column(String(64))
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    modules_found: Mapped[int] = mapped_column(Integer, default=0)
    warnings: Mapped[list] = mapped_column(JSONType, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Enquiry(TimestampMixin, Base):
    __tablename__ = "enquiries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reference: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(20), index=True)  # consulting | course | corporate | contact
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)  # new | in_progress | responded | closed | spam
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    organisation: Mapped[str | None] = mapped_column(String(160), nullable=True)
    preferred_contact: Mapped[str] = mapped_column(String(20), default="email")
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict] = mapped_column(JSONType, default=dict)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notification_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | sent | skipped | failed


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Incremented on password change; tokens carrying an older version are rejected.
    token_version: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)


class SiteSetting(Base):
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[dict] = mapped_column(JSONType, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class MediaAsset(Base):
    """Small uploaded images (brand logo) stored in the database so every replica can serve them."""

    __tablename__ = "media_assets"

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    content_type: Mapped[str] = mapped_column(String(40))
    data: Mapped[bytes] = mapped_column(LargeBinary)
    sha256: Mapped[str] = mapped_column(String(64))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
