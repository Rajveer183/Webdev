"""Catalogue queries, validation and seeding from data/content/*.json."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import CatalogueItem, SiteSetting, SourceTopic
from app.schemas.content import CONTENT_MODELS, KIND_FILES, TopicContent

log = logging.getLogger(__name__)

# Fields mirrored into real columns for filtering; everything else stays in `data`.
_COLUMN_FIELDS = ("status", "availability", "featured", "order")


class ContentValidationError(ValueError):
    def __init__(self, errors: list[dict[str, Any]]):
        super().__init__("Content failed validation")
        self.errors = errors


def validate_content(kind: str, data: dict[str, Any]) -> dict[str, Any]:
    model = CONTENT_MODELS[kind]
    try:
        return model.model_validate(data).model_dump(mode="json")
    except ValidationError as exc:
        raise ContentValidationError(
            [{"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"]} for e in exc.errors()]
        ) from exc


def _apply(item: CatalogueItem, kind: str, data: dict[str, Any]) -> None:
    item.kind = kind
    item.slug = data["slug"]
    item.title = data["title"]
    item.category = data.get("category")
    item.level = data.get("level")
    item.status = data.get("status", "draft")
    item.availability = data.get("availability")
    item.featured = bool(data.get("featured", False))
    item.sort_order = int(data.get("order", 0))
    item.data = data


# Editorial fields that must never appear on the public website.
_INTERNAL_FIELDS = ("approval_note",)


def to_public(item: CatalogueItem, *, internal: bool = False) -> dict[str, Any]:
    """Merge column values (which admins may have changed) back into the content record."""
    out = dict(item.data)
    if not internal:
        for f in _INTERNAL_FIELDS:
            out.pop(f, None)
    out.update(
        {
            "status": item.status,
            "availability": item.availability,
            "featured": item.featured,
            "order": item.sort_order,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        }
    )
    if item.availability is None:
        out.pop("availability")
    return out


def to_card(item: CatalogueItem) -> dict[str, Any]:
    """Lightweight representation for listing pages (no long bodies or chart data)."""
    d = to_public(item)
    for heavy in ("body", "charts", "modules", "process", "overview", "description", "anova_table"):
        d.pop(heavy, None)
    if item.kind == "course":
        d["module_count"] = len(item.data.get("modules", []))
    return d


def list_published(db: Session, kind: str, **filters: Any) -> list[CatalogueItem]:
    stmt = select(CatalogueItem).where(CatalogueItem.kind == kind, CatalogueItem.status == "published")
    if filters.get("category"):
        stmt = stmt.where(CatalogueItem.category == filters["category"])
    if filters.get("level"):
        stmt = stmt.where(CatalogueItem.level == filters["level"])
    if filters.get("featured") is not None:
        stmt = stmt.where(CatalogueItem.featured == filters["featured"])
    items = list(db.scalars(stmt.order_by(CatalogueItem.sort_order, CatalogueItem.title)))

    if fmt := filters.get("format"):
        items = [i for i in items if i.data.get("format") == fmt]
    if mode := filters.get("mode"):
        items = [i for i in items if mode in i.data.get("delivery_modes", [])]
    if tag := filters.get("tag"):
        items = [i for i in items if tag.lower() in [t.lower() for t in i.data.get("tags", [])]]
    if q := (filters.get("q") or "").strip().lower():
        items = [i for i in items if q in _search_text(i)]
    return items


def _search_text(item: CatalogueItem) -> str:
    d = item.data
    parts = [d.get("title", ""), d.get("summary", ""), d.get("category", "") or ""]
    for key in ("tags", "methods", "tools", "learning_objectives", "topics"):
        parts.extend(str(x) for x in d.get(key, []))
    for m in d.get("modules", []):
        parts.append(m.get("title", ""))
        parts.extend(m.get("topics", []))
    return " ".join(parts).lower()


def get_published(db: Session, kind: str, slug: str) -> CatalogueItem | None:
    return db.scalar(
        select(CatalogueItem).where(
            CatalogueItem.kind == kind, CatalogueItem.slug == slug, CatalogueItem.status == "published"
        )
    )


def published_titles(db: Session, kind: str, slugs: list[str]) -> list[dict[str, str]]:
    if not slugs:
        return []
    rows = db.scalars(
        select(CatalogueItem).where(
            CatalogueItem.kind == kind, CatalogueItem.slug.in_(slugs), CatalogueItem.status == "published"
        )
    ).all()
    by_slug = {r.slug: r for r in rows}
    return [
        {"slug": s, "title": by_slug[s].title, "summary": by_slug[s].data.get("summary", "")}
        for s in slugs
        if s in by_slug
    ]


def related_for(db: Session, item: CatalogueItem) -> dict[str, list[dict[str, str]]]:
    d = item.data
    return {
        "services": published_titles(db, "service", d.get("related_services", [])),
        "courses": published_titles(db, "course", d.get("related_courses", [])),
        "articles": published_titles(db, "article", d.get("related_articles", [])),
    }


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------


def load_content_file(name: str, content_dir: Path | None = None) -> Any:
    path = (content_dir or get_settings().content_dir) / name
    return json.loads(path.read_text(encoding="utf-8"))


def check_cross_references(content_dir: Path | None = None) -> list[str]:
    """Return a list of broken related_* references across all content files."""
    slugs = {kind: {r["slug"] for r in load_content_file(f, content_dir)} for kind, f in KIND_FILES.items()}
    field_kind = {"related_services": "service", "related_courses": "course", "related_articles": "article"}
    problems = []
    for kind, f in KIND_FILES.items():
        for rec in load_content_file(f, content_dir):
            for field, target in field_kind.items():
                for s in rec.get(field, []):
                    if s not in slugs[target]:
                        problems.append(f"{kind}:{rec['slug']}.{field} -> unknown {target} '{s}'")
    for t in load_content_file("topics.json", content_dir):
        for field, target in field_kind.items():
            for s in t.get(field, []):
                if s not in slugs[target]:
                    problems.append(f"topic:{t['id']}.{field} -> unknown {target} '{s}'")
    return problems


def seed_catalogue(db: Session, *, overwrite: bool = False, content_dir: Path | None = None) -> dict[str, int]:
    """Load curated JSON into the database.

    Existing records are left untouched unless `overwrite` is True, so admin edits
    (status, availability, featured) survive restarts.
    """
    counts: dict[str, int] = {}
    for kind, filename in KIND_FILES.items():
        created = 0
        for raw in load_content_file(filename, content_dir):
            data = validate_content(kind, raw)
            item = db.scalar(select(CatalogueItem).where(CatalogueItem.kind == kind, CatalogueItem.slug == data["slug"]))
            if item is None:
                item = CatalogueItem()
                db.add(item)
                created += 1
            elif not overwrite:
                continue
            _apply(item, kind, data)
        counts[kind] = created

    topics_created = 0
    for raw in load_content_file("topics.json", content_dir):
        t = TopicContent.model_validate(raw).model_dump(mode="json")
        topic = db.get(SourceTopic, t["id"])
        if topic is None:
            topic = SourceTopic(id=t["id"], origin="curated")
            db.add(topic)
            topics_created += 1
        elif not overwrite:
            continue
        topic.name = t["name"]
        topic.status = t["status"]
        topic.review_note = t["review_note"]
        topic.data = t
    counts["topic"] = topics_created

    site = load_content_file("site.json", content_dir)
    setting = db.get(SiteSetting, "site_content")
    if setting is None:
        db.add(SiteSetting(key="site_content", value=site))
    elif overwrite:
        setting.value = site

    db.commit()
    log.info("Seeded catalogue: %s", counts)
    return counts


def catalogue_is_empty(db: Session) -> bool:
    return (db.scalar(select(func.count()).select_from(CatalogueItem)) or 0) == 0


def update_item(db: Session, item: CatalogueItem, changes: dict[str, Any]) -> CatalogueItem:
    if "data" in changes and changes["data"] is not None:
        data = dict(changes["data"])
        if data.get("slug") != item.slug:
            raise ContentValidationError([{"field": "slug", "message": "Slug cannot be changed"}])
        # column fields given explicitly win over the ones inside `data`
        for f in _COLUMN_FIELDS:
            if changes.get(f) is not None:
                data[f] = changes[f]
        data = validate_content(item.kind, data)
        _apply(item, item.kind, data)
    else:
        if changes.get("status") is not None:
            item.status = changes["status"]
        if changes.get("availability") is not None:
            if item.kind not in ("course", "service"):
                raise ContentValidationError([{"field": "availability", "message": "Only courses and services have availability"}])
            item.availability = changes["availability"]
        if changes.get("featured") is not None:
            item.featured = changes["featured"]
        if changes.get("order") is not None:
            item.sort_order = changes["order"]
        # keep the JSON copy in sync so exports stay consistent
        item.data = {
            **item.data,
            "status": item.status,
            "featured": item.featured,
            "order": item.sort_order,
            **({"availability": item.availability} if item.availability else {}),
        }
    db.commit()
    db.refresh(item)
    return item
