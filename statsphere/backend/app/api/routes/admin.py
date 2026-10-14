"""Protected admin API: authentication, enquiries, catalogue review, PDF ingestion, settings."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.config import get_settings
from app.core.db import get_db
from app.core.rate_limit import login_rate_limit
from app.core.security import create_access_token, verify_password
from app.models import AdminUser, CatalogueItem, Enquiry, IngestionRun, SourceTopic
from app.schemas.admin import (
    AdminMe,
    CatalogueRow,
    CatalogueUpdate,
    DashboardStats,
    EnquiryOut,
    EnquiryPage,
    EnquiryUpdate,
    IngestionResult,
    IngestionRunOut,
    LoginRequest,
    SettingsPayload,
    TokenResponse,
    TopicOut,
    TopicUpdate,
)
from app.schemas.content import Kind
from app.services import catalogue as cat
from app.services.pdf_ingestion import ingest_pdf
from app.services.settings_store import get_setting, put_setting

router = APIRouter(prefix="/api/admin", tags=["admin"])
protected = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

# A dummy hash so failed logins for unknown users take as long as for known ones.
_DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_rate_limit)])
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(AdminUser).where(AdminUser.username == body.username))
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    user.last_login_at = datetime.now(UTC)
    db.commit()
    token, expires = create_access_token(user.username, user.token_version or 0)
    return TokenResponse(access_token=token, expires_in=expires)


@protected.get("/me", response_model=AdminMe)
def me(user: AdminUser = Depends(require_admin)):
    return AdminMe(username=user.username)


@protected.get("/stats", response_model=DashboardStats)
def stats(db: Session = Depends(get_db)):
    def grouped(col, model):
        return {k: v for k, v in db.execute(select(col, func.count()).select_from(model).group_by(col)).all()}

    by_kind: dict[str, dict[str, int]] = {}
    for kind, st, n in db.execute(
        select(CatalogueItem.kind, CatalogueItem.status, func.count()).group_by(CatalogueItem.kind, CatalogueItem.status)
    ).all():
        by_kind.setdefault(kind, {})[st] = n
    return DashboardStats(
        enquiries_by_status=grouped(Enquiry.status, Enquiry),
        enquiries_by_type=grouped(Enquiry.type, Enquiry),
        catalogue_by_kind=by_kind,
        topics_by_status=grouped(SourceTopic.status, SourceTopic),
    )


# ---------------- Enquiries ----------------


@protected.get("/enquiries", response_model=EnquiryPage)
def list_enquiries(
    type: Literal["consulting", "course", "corporate", "contact"] | None = None,
    status_: Literal["new", "in_progress", "responded", "closed", "spam"] | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Enquiry)
    if type:
        stmt = stmt.where(Enquiry.type == type)
    if status_:
        stmt = stmt.where(Enquiry.status == status_)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            func.lower(Enquiry.name).like(like) | func.lower(Enquiry.email).like(like) | func.lower(Enquiry.reference).like(like)
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.order_by(Enquiry.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return EnquiryPage(items=[EnquiryOut.model_validate(r) for r in rows], total=total, page=page, page_size=page_size)


def _get_enquiry(db: Session, enquiry_id: int) -> Enquiry:
    e = db.get(Enquiry, enquiry_id)
    if e is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return e


@protected.get("/enquiries/{enquiry_id}", response_model=EnquiryOut)
def get_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    return EnquiryOut.model_validate(_get_enquiry(db, enquiry_id))


@protected.patch("/enquiries/{enquiry_id}", response_model=EnquiryOut)
def update_enquiry(enquiry_id: int, body: EnquiryUpdate, db: Session = Depends(get_db)):
    e = _get_enquiry(db, enquiry_id)
    if body.status is not None:
        e.status = body.status
    if body.admin_notes is not None:
        e.admin_notes = body.admin_notes
    db.commit()
    db.refresh(e)
    return EnquiryOut.model_validate(e)


@protected.post("/enquiries/{enquiry_id}/notify", response_model=EnquiryOut)
def resend_notification(enquiry_id: int, db: Session = Depends(get_db)):
    """(Re)send the notification e-mail for one enquiry and return its updated status."""
    from app.services.notifications import send_enquiry_notification

    e = _get_enquiry(db, enquiry_id)
    if not get_settings().email_enabled:
        raise HTTPException(status_code=400, detail="E-mail sending is not configured (set SMTP_PASSWORD; see README)")
    send_enquiry_notification(e.id)
    db.expire_all()
    return EnquiryOut.model_validate(_get_enquiry(db, enquiry_id))


# ---------------- Catalogue ----------------


def _row(i: CatalogueItem) -> CatalogueRow:
    return CatalogueRow(
        kind=i.kind,
        slug=i.slug,
        title=i.title,
        category=i.category,
        level=i.level,
        status=i.status,
        availability=i.availability,
        featured=i.featured,
        order=i.sort_order,
        updated_at=i.updated_at,
    )


def _get_item(db: Session, kind: str, slug: str) -> CatalogueItem:
    item = db.scalar(select(CatalogueItem).where(CatalogueItem.kind == kind, CatalogueItem.slug == slug))
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@protected.get("/catalogue/{kind}", response_model=list[CatalogueRow])
def list_catalogue(kind: Kind, db: Session = Depends(get_db)):
    rows = db.scalars(select(CatalogueItem).where(CatalogueItem.kind == kind).order_by(CatalogueItem.sort_order)).all()
    return [_row(r) for r in rows]


@protected.get("/catalogue/{kind}/{slug}")
def get_catalogue_item(kind: Kind, slug: str, db: Session = Depends(get_db)) -> dict:
    return cat.to_public(_get_item(db, kind, slug), internal=True)


@protected.patch("/catalogue/{kind}/{slug}", response_model=CatalogueRow)
def update_catalogue_item(kind: Kind, slug: str, body: CatalogueUpdate, db: Session = Depends(get_db)):
    item = _get_item(db, kind, slug)
    try:
        item = cat.update_item(db, item, body.model_dump(exclude_unset=True))
    except cat.ContentValidationError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail={"message": "Content failed validation", "details": exc.errors}) from exc
    return _row(item)


# ---------------- PDF-derived topics ----------------


@protected.get("/topics", response_model=list[TopicOut])
def list_topics(
    status_: Literal["approved", "pending_review", "excluded"] | None = Query(default=None, alias="status"),
    origin: Literal["curated", "pdf-ingestion"] | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(SourceTopic)
    if status_:
        stmt = stmt.where(SourceTopic.status == status_)
    if origin:
        stmt = stmt.where(SourceTopic.origin == origin)
    rows = db.scalars(stmt.order_by(SourceTopic.origin, SourceTopic.name)).all()
    return [
        TopicOut(
            id=t.id,
            name=t.name,
            origin=t.origin,
            status=t.status,
            review_note=t.review_note,
            ingestion_run_id=t.ingestion_run_id,
            data=t.data,
            updated_at=t.updated_at,
        )
        for t in rows
    ]


@protected.patch("/topics/{topic_id}", response_model=TopicOut)
def update_topic(topic_id: str, body: TopicUpdate, db: Session = Depends(get_db)):
    t = db.get(SourceTopic, topic_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    if body.status is not None:
        t.status = body.status
    if body.review_note is not None:
        t.review_note = body.review_note
    db.commit()
    db.refresh(t)
    return TopicOut(
        id=t.id, name=t.name, origin=t.origin, status=t.status, review_note=t.review_note,
        ingestion_run_id=t.ingestion_run_id, data=t.data, updated_at=t.updated_at,
    )


@protected.post("/pdf-ingestion", response_model=IngestionResult, status_code=201)
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    limit = get_settings().max_upload_mb * 1024 * 1024
    content = await file.read(limit + 1)
    if len(content) > limit:
        raise HTTPException(status_code=413, detail=f"File larger than {get_settings().max_upload_mb} MB")
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=415, detail="Upload a PDF file")
    try:
        run, created, updated, _ = ingest_pdf(db, content, file.filename or "upload.pdf")
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail="The PDF could not be processed") from exc
    return IngestionResult(run=IngestionRunOut.model_validate(run), topics_created=created, topics_updated=updated)


@protected.get("/pdf-ingestion/runs", response_model=list[IngestionRunOut])
def list_runs(db: Session = Depends(get_db)):
    rows = db.scalars(select(IngestionRun).order_by(IngestionRun.created_at.desc()).limit(20)).all()
    return [IngestionRunOut.model_validate(r) for r in rows]


# ---------------- Settings ----------------


@protected.get("/settings")
def read_settings(db: Session = Depends(get_db)) -> dict:
    return {"contact": get_setting(db, "contact"), "brand": get_setting(db, "brand")}


@protected.put("/settings")
def write_settings(body: SettingsPayload, db: Session = Depends(get_db)) -> dict:
    if body.contact is not None:
        put_setting(db, "contact", body.contact.model_dump(mode="json"))
    if body.brand is not None:
        put_setting(db, "brand", body.brand.model_dump(mode="json"))
    return read_settings(db)
