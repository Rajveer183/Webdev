"""Admin account management and media uploads (protected)."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import AdminUser, MediaAsset
from app.services.media import MEDIA_KEYS, MediaError, media_urls, save_media

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

Username = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
Password = Field(min_length=12, max_length=200)


class AdminUserOut(BaseModel):
    id: int
    username: str
    created_at: datetime
    last_login_at: datetime | None
    is_current: bool


class CreateAdmin(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str = Username
    password: str = Password


class ResetPassword(BaseModel):
    model_config = ConfigDict(extra="forbid")
    password: str = Password


class ChangeOwnPassword(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Password


def _out(u: AdminUser, me: AdminUser) -> AdminUserOut:
    return AdminUserOut(id=u.id, username=u.username, created_at=u.created_at, last_login_at=u.last_login_at, is_current=u.id == me.id)


@router.get("/users", response_model=list[AdminUserOut])
def list_users(me: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return [_out(u, me) for u in db.scalars(select(AdminUser).order_by(AdminUser.username))]


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(body: CreateAdmin, me: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    if db.scalar(select(AdminUser).where(func.lower(AdminUser.username) == body.username.lower())):
        raise HTTPException(status_code=409, detail="That username is already in use")
    user = AdminUser(username=body.username, password_hash=hash_password(body.password), token_version=0)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _out(user, me)


def _get_user(db: Session, user_id: int) -> AdminUser:
    user = db.get(AdminUser, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}/password", status_code=204)
def reset_password(user_id: int, body: ResetPassword, me: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    user = _get_user(db, user_id)
    if user.id == me.id:
        raise HTTPException(status_code=400, detail="Use “Change my password” for your own account")
    user.password_hash = hash_password(body.password)
    user.token_version = (user.token_version or 0) + 1  # signs the user out everywhere
    db.commit()
    return Response(status_code=204)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, me: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    user = _get_user(db, user_id)
    if user.id == me.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if (db.scalar(select(func.count()).select_from(AdminUser)) or 0) <= 1:
        raise HTTPException(status_code=400, detail="At least one admin account must remain")
    db.delete(user)
    db.commit()
    return Response(status_code=204)


@router.post("/me/password")
def change_own_password(body: ChangeOwnPassword, me: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    if not verify_password(body.current_password, me.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    me.password_hash = hash_password(body.new_password)
    me.token_version = (me.token_version or 0) + 1  # other sessions are signed out
    db.commit()
    token, expires = create_access_token(me.username, me.token_version)
    return {"access_token": token, "token_type": "bearer", "expires_in": expires}


# ---------------- Media ----------------


@router.get("/media")
def list_media(db: Session = Depends(get_db)) -> dict:
    urls = media_urls(db)
    return {key: {"description": desc, "url": urls[key.replace("-", "_")]} for key, desc in MEDIA_KEYS.items()}


@router.put("/media/{key}")
async def upload_media(key: str, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    data = await file.read(1024 * 1024 + 1)
    try:
        asset = save_media(db, key, data)
    except MediaError as exc:
        code = status.HTTP_404_NOT_FOUND if "Unknown" in str(exc) else status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        if "1 MB" in str(exc):
            code = 413
        raise HTTPException(status_code=code, detail=str(exc)) from exc
    return {"key": asset.key, "content_type": asset.content_type, "url": f"/api/media/{asset.key}?v={asset.sha256[:12]}"}


@router.delete("/media/{key}", status_code=204)
def delete_media(key: str, db: Session = Depends(get_db)):
    asset = db.get(MediaAsset, key)
    if asset is None:
        raise HTTPException(status_code=404, detail="Nothing uploaded for this slot")
    db.delete(asset)
    db.commit()
    return Response(status_code=204)
