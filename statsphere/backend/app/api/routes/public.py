"""Public, read-only catalogue endpoints. Only `published` records are ever returned."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.models import MediaAsset, SourceTopic
from app.schemas.content import Category, Level, ListResponse
from app.services import catalogue as cat
from app.services.media import MEDIA_KEYS, media_urls
from app.services.settings_store import get_setting, site_content

router = APIRouter(prefix="/api", tags=["public"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception:  # pragma: no cover - reported, not raised
        database = "unavailable"
    return {"status": "ok" if database == "ok" else "degraded", "database": database, "environment": get_settings().app_env}


@router.get("/site")
def site(db: Session = Depends(get_db)) -> dict:
    """Editable business details plus homepage content blocks (expertise, FAQ, ...)."""
    return {
        "contact": get_setting(db, "contact"),
        "brand": get_setting(db, "brand"),
        "content": site_content(db),
        "media": media_urls(db),
    }


@router.get("/media/{key}")
def media(key: str, db: Session = Depends(get_db)) -> Response:
    asset = db.get(MediaAsset, key) if key in MEDIA_KEYS else None
    if asset is None:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=asset.data,
        media_type=asset.content_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "ETag": f'"{asset.sha256[:32]}"',
            "Content-Security-Policy": "default-src 'none'",
        },
    )


def _detail(db: Session, kind: str, slug: str) -> dict:
    item = cat.get_published(db, kind, slug)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{kind.capitalize()} not found")
    out = cat.to_public(item)
    out["related"] = cat.related_for(db, item)
    return out


@router.get("/services", response_model=ListResponse)
def list_services(
    category: Category | None = None,
    featured: bool | None = None,
    q: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    items = cat.list_published(db, "service", category=category, featured=featured, q=q)
    return {"items": [cat.to_card(i) for i in items], "total": len(items)}


@router.get("/services/{slug}")
def get_service(slug: str, db: Session = Depends(get_db)) -> dict:
    return _detail(db, "service", slug)


@router.get("/courses", response_model=ListResponse)
def list_courses(
    category: Category | None = None,
    level: Level | None = None,
    format: Literal["short-course", "workshop", "extended"] | None = None,
    mode: Literal["online", "in-person", "hybrid"] | None = None,
    featured: bool | None = None,
    q: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    items = cat.list_published(db, "course", category=category, level=level, format=format, mode=mode, featured=featured, q=q)
    return {"items": [cat.to_card(i) for i in items], "total": len(items)}


@router.get("/courses/{slug}")
def get_course(slug: str, db: Session = Depends(get_db)) -> dict:
    return _detail(db, "course", slug)


@router.get("/articles", response_model=ListResponse)
def list_articles(
    category: Category | None = None,
    tag: str | None = Query(default=None, max_length=60),
    q: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    items = cat.list_published(db, "article", category=category, tag=tag, q=q)
    return {"items": [cat.to_card(i) for i in items], "total": len(items)}


@router.get("/articles/{slug}")
def get_article(slug: str, db: Session = Depends(get_db)) -> dict:
    return _detail(db, "article", slug)


@router.get("/projects", response_model=ListResponse)
def list_projects(featured: bool | None = None, db: Session = Depends(get_db)):
    items = cat.list_published(db, "project", featured=featured)
    return {"items": [cat.to_card(i) for i in items], "total": len(items)}


@router.get("/projects/{slug}")
def get_project(slug: str, db: Session = Depends(get_db)) -> dict:
    return _detail(db, "project", slug)


@router.get("/workshops", response_model=ListResponse)
def list_workshops(db: Session = Depends(get_db)):
    items = cat.list_published(db, "workshop")
    return {"items": [cat.to_public(i) for i in items], "total": len(items)}


@router.get("/topics", response_model=ListResponse)
def list_topics(db: Session = Depends(get_db)):
    """Approved subject areas from the PDF-derived catalogue (internal review fields omitted)."""
    rows = db.scalars(select(SourceTopic).where(SourceTopic.status == "approved").order_by(SourceTopic.name)).all()
    items = [
        {
            "id": t.id,
            "name": t.name,
            "description": t.data.get("description", ""),
            "semester": t.data.get("semester"),
            "source_pages": t.data.get("source_pages", []),
            "related_services": t.data.get("related_services", []),
            "related_courses": t.data.get("related_courses", []),
            "related_articles": t.data.get("related_articles", []),
            "website_section": t.data.get("website_section"),
        }
        for t in rows
    ]
    return {"items": items, "total": len(items)}
