"""Application settings, loaded from environment variables (and an optional .env file)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_DIR = BACKEND_DIR.parent

_INSECURE_SECRET = "dev-insecure-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_DIR / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "production", "test"] = "development"
    app_name: str = "Hexona Consultancy Services API"
    log_level: str = "INFO"

    # Database: SQLite for local development, PostgreSQL in Docker/production.
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'statsphere.db').as_posix()}"
    auto_migrate: bool = True  # run `alembic upgrade head` on startup
    seed_on_startup: bool = True  # load curated content if the catalogue is empty

    content_dir: Path = REPO_DIR / "data" / "content"
    extracted_dir: Path = REPO_DIR / "data" / "extracted"

    # Comma-separated list of allowed browser origins.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Admin authentication
    jwt_secret: str = _INSECURE_SECRET
    jwt_expire_minutes: int = 120
    admin_username: str = "admin"
    admin_password: str | None = None  # bootstrap password; only used to create the first admin

    # Public form protection
    enquiry_rate_limit: int = 5  # submissions ...
    enquiry_rate_window_seconds: int = 600  # ... per window per client IP
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 900
    min_form_fill_seconds: float = 3.0  # submissions faster than this are treated as bots
    trust_proxy_headers: bool = False  # honour X-Forwarded-For (enable only behind a trusted proxy)

    # PDF ingestion
    max_upload_mb: int = 25

    # Optional e-mail notifications for new enquiries (SMTP). Leave host empty to disable.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_starttls: bool = True
    smtp_from: str | None = None
    # Brevo HTTP API key: sends over HTTPS instead of SMTP (hosts like Render's free tier block SMTP ports).
    brevo_api_key: str | None = None
    # Private inbox that receives every submitted enquiry. Never sent to the browser or shown on the site.
    notify_email: str | None = Field(default="rajveersinghrathorer584@gmail.com", description="Inbox that receives enquiry notifications")

    @field_validator("database_url", mode="before")
    @classmethod
    def _psycopg_driver(cls, v):
        # Hosted Postgres (Render, Neon, ...) hands out postgres:// URLs; we ship psycopg 3, not psycopg2.
        if isinstance(v, str):
            for prefix in ("postgres://", "postgresql://"):
                if v.startswith(prefix):
                    return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @field_validator("content_dir", "extracted_dir", mode="before")
    @classmethod
    def _resolve_relative(cls, v):
        p = Path(v)
        return p if p.is_absolute() else (REPO_DIR / p).resolve()

    @model_validator(mode="after")
    def _production_guards(self):
        if self.app_env == "production":
            if self.jwt_secret == _INSECURE_SECRET or len(self.jwt_secret) < 32:
                raise ValueError("JWT_SECRET must be set to a random value of at least 32 characters in production")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sender(self) -> str | None:
        """From address: SMTP_FROM, else the SMTP login (e.g. the Gmail account itself)."""
        return self.smtp_from or self.smtp_username

    @property
    def email_enabled(self) -> bool:
        if self.brevo_api_key:
            return bool(self.sender and self.notify_email)
        login_ok = not self.smtp_username or bool(self.smtp_password)
        return bool(self.smtp_host and self.sender and self.notify_email and login_ok)


@lru_cache
def get_settings() -> Settings:
    return Settings()
