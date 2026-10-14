"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_access_token
from app.models import AdminUser

_bearer = HTTPBearer(auto_error=False)


def require_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> AdminUser:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None or creds.scheme.lower() != "bearer":
        raise unauthorized
    decoded = decode_access_token(creds.credentials)
    if not decoded:
        raise unauthorized
    username, version = decoded
    user = db.scalar(select(AdminUser).where(AdminUser.username == username))
    if user is None or (user.token_version or 0) != version:
        raise unauthorized  # deleted user, or password changed since this token was issued
    return user
