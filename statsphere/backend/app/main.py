"""FastAPI application factory."""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import admin, admin_users, enquiries, public
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.logging import configure_logging
from app.core.security import hash_password
from app.models import AdminUser

log = logging.getLogger("app")

_ERROR_CODES = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    413: "payload_too_large",
    415: "unsupported_media_type",
    422: "validation_error",
    429: "rate_limited",
}


def run_migrations() -> None:
    from alembic import command
    from alembic.config import Config

    from app.core.config import BACKEND_DIR

    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(cfg, "head")


def bootstrap(db) -> None:
    """Seed curated content and create the first admin user if configured."""
    from app.services.catalogue import catalogue_is_empty, seed_catalogue

    s = get_settings()
    if s.seed_on_startup and catalogue_is_empty(db):
        seed_catalogue(db)
    if s.admin_password and not db.scalar(select(AdminUser).where(AdminUser.username == s.admin_username)):
        db.add(AdminUser(username=s.admin_username, password_hash=hash_password(s.admin_password)))
        db.commit()
        log.info("Created admin user from ADMIN_USERNAME / ADMIN_PASSWORD")


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    # uvicorn configures its loggers after import; its access log includes query strings, which may
    # contain personal data (e.g. an admin search), so it stays off. Our middleware logs paths only.
    logging.getLogger("uvicorn.access").disabled = True
    if s.auto_migrate:
        run_migrations()
    with SessionLocal() as db:
        bootstrap(db)
    if not s.email_enabled:
        log.info("SMTP not configured: enquiries are stored in the database only")
    yield


def create_app(*, run_startup: bool = True) -> FastAPI:
    s = get_settings()
    configure_logging(s.log_level)
    app = FastAPI(
        title=s.app_name,
        version="1.0.0",
        lifespan=lifespan if run_startup else None,
        docs_url="/api/docs" if s.app_env != "production" else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if s.app_env != "production" else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def security_and_logging(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        if request.url.path.startswith("/api/admin"):
            response.headers["Cache-Control"] = "no-store"
        # Path only — never query strings or bodies, which may contain personal data.
        log.info("%s %s %s %.0fms", request.method, request.url.path, response.status_code, (time.perf_counter() - start) * 1000)
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException):
        detail = exc.detail
        body: dict = {"code": _ERROR_CODES.get(exc.status_code, "error")}
        if isinstance(detail, dict):
            body.update({"message": detail.get("message", "Request failed"), "details": detail.get("details")})
        else:
            body["message"] = str(detail)
        return JSONResponse(status_code=exc.status_code, content={"error": body}, headers=getattr(exc, "headers", None))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError):
        details = []
        for e in exc.errors():
            loc = [str(p) for p in e["loc"] if p not in ("body", "query", "path")]
            msg = e["msg"].removeprefix("Value error, ")
            details.append({"field": ".".join(loc) or "form", "message": msg})
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "validation_error", "message": "Some fields need attention", "details": details}},
        )

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):
        log.exception("Unhandled error: %s", type(exc).__name__)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "server_error", "message": "Something went wrong on our side. Please try again later."}},
        )

    app.include_router(public.router)
    app.include_router(enquiries.router)
    app.include_router(admin.router)
    app.include_router(admin.protected)
    app.include_router(admin_users.router)
    return app


app = create_app()

__all__ = ["app", "create_app", "HTTPException"]
