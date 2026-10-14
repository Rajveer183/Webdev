"""Export public API responses for build-time prerendering.

The frontend prerenderer renders every public page to static HTML using these
responses, so search engines and first paint get full content. Responses are
produced by the real API code (through FastAPI's TestClient), so the snapshot is
exactly what the browser would receive.
"""

from __future__ import annotations

import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.core.db import Base, get_db, make_engine

LIST_PATHS = [
    "/api/site",
    "/api/services",
    "/api/services?featured=true",
    "/api/courses",
    "/api/courses?featured=true",
    "/api/articles",
    "/api/projects",
    "/api/projects?featured=true",
    "/api/workshops",
    "/api/topics",
]
DETAIL_ROUTES = {
    "/api/services": "/api/services/{slug}",
    "/api/courses": "/api/courses/{slug}",
    "/api/articles": "/api/articles/{slug}",
    "/api/projects": "/api/projects/{slug}",
}


def _collect(client: TestClient) -> dict[str, Any]:
    snapshot: dict[str, Any] = {}
    for path in LIST_PATHS:
        r = client.get(path)
        r.raise_for_status()
        snapshot[path] = r.json()
    for list_path, pattern in DETAIL_ROUTES.items():
        for item in snapshot[list_path]["items"]:
            path = pattern.format(slug=item["slug"])
            r = client.get(path)
            r.raise_for_status()
            snapshot[path] = r.json()
    return snapshot


def export_snapshot(*, from_content: bool = False) -> dict[str, Any]:
    from app.main import create_app

    app = create_app(run_startup=False)
    if from_content:
        from app.services.catalogue import seed_catalogue

        tmp = Path(tempfile.mkdtemp(prefix="statsphere-snapshot-"))
        engine = make_engine(f"sqlite:///{(tmp / 'snapshot.db').as_posix()}")
        Base.metadata.create_all(engine)
        factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
        with factory() as db:
            seed_catalogue(db)

        def override() -> Iterator[Session]:
            with factory() as db:
                yield db

        app.dependency_overrides[get_db] = override
        try:
            with TestClient(app) as client:
                return _collect(client)
        finally:
            engine.dispose()
    with TestClient(app) as client:
        return _collect(client)
