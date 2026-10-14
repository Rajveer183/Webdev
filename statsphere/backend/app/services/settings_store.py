"""Editable public site settings (contact details, brand overrides)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import SiteSetting

DEFAULTS: dict[str, dict[str, Any]] = {
    "contact": {
        "email": None,
        "phone": None,
        "whatsapp": None,
        "address": None,
        "hours": None,
        "booking_url": None,
        "linkedin_url": None,
    },
    "brand": {"name": None, "tagline": None, "show_institution_logo": None},
}


def get_setting(db: Session, key: str) -> dict[str, Any]:
    row = db.get(SiteSetting, key)
    base = dict(DEFAULTS.get(key, {}))
    if row and isinstance(row.value, dict):
        base.update(row.value)
    return base


def put_setting(db: Session, key: str, value: dict[str, Any]) -> dict[str, Any]:
    row = db.get(SiteSetting, key)
    if row is None:
        row = SiteSetting(key=key, value=value)
        db.add(row)
    else:
        row.value = value
    db.commit()
    return get_setting(db, key)


def site_content(db: Session) -> dict[str, Any]:
    row = db.get(SiteSetting, "site_content")
    return row.value if row else {}
