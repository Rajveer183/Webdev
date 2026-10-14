"""Test fixtures: an isolated SQLite database seeded from the real curated content."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="statsphere-tests-"))
# Settings are read at import time, so configure the environment first.
os.environ.update(
    {
        "APP_ENV": "test",
        "DATABASE_URL": f"sqlite:///{(_TMP / 'test.db').as_posix()}",
        "AUTO_MIGRATE": "false",
        "SEED_ON_STARTUP": "false",
        "JWT_SECRET": "test-secret-test-secret-test-secret-123",
        "ADMIN_PASSWORD": "",
        "MIN_FORM_FILL_SECONDS": "3",
        "ENQUIRY_RATE_LIMIT": "1000",
        "SMTP_HOST": "",
    }
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.core.rate_limit import limiter  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import AdminUser  # noqa: E402
from app.services.catalogue import seed_catalogue  # noqa: E402

ADMIN_USER, ADMIN_PASS = "admin", "correct-horse-battery-staple"


@pytest.fixture(scope="session", autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_catalogue(db)
        db.add(AdminUser(username=ADMIN_USER, password_hash=hash_password(ADMIN_PASS)))
        db.commit()
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(create_app(run_startup=False))


@pytest.fixture()
def admin_headers(client: TestClient) -> dict[str, str]:
    r = client.post("/api/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def base_enquiry(**overrides) -> dict:
    data = {
        "name": "Test Person",
        "email": "person@example.com",
        "preferred_contact": "email",
        "consent": True,
        "website": "",
        "form_started_at": None,
    }
    data.update(overrides)
    return data
