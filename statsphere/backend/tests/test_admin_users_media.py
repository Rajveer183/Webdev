from __future__ import annotations

import pytest

from tests.conftest import ADMIN_PASS, ADMIN_USER

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'


def _login(client, username, password):
    r = client.post("/api/admin/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.mark.parametrize(
    "method,path",
    [("get", "/api/admin/users"), ("post", "/api/admin/users"), ("delete", "/api/admin/users/1"), ("get", "/api/admin/media"), ("put", "/api/admin/media/brand-logo")],
)
def test_user_and_media_endpoints_require_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_user_lifecycle(client, admin_headers):
    users = client.get("/api/admin/users", headers=admin_headers).json()
    assert any(u["username"] == ADMIN_USER and u["is_current"] for u in users)

    weak = client.post("/api/admin/users", json={"username": "editor", "password": "short"}, headers=admin_headers)
    assert weak.status_code == 422

    r = client.post("/api/admin/users", json={"username": "editor", "password": "editor-password-123"}, headers=admin_headers)
    assert r.status_code == 201
    uid = r.json()["id"]
    dup = client.post("/api/admin/users", json={"username": "EDITOR", "password": "editor-password-123"}, headers=admin_headers)
    assert dup.status_code == 409

    editor = _login(client, "editor", "editor-password-123")
    assert client.get("/api/admin/me", headers=editor).status_code == 200

    # Resetting the password signs the editor out of existing sessions.
    reset = client.put(f"/api/admin/users/{uid}/password", json={"password": "a-brand-new-password"}, headers=admin_headers)
    assert reset.status_code == 204
    assert client.get("/api/admin/me", headers=editor).status_code == 401
    editor = _login(client, "editor", "a-brand-new-password")

    # Cannot delete yourself; deleting another user revokes their access.
    me_id = next(u["id"] for u in client.get("/api/admin/users", headers=admin_headers).json() if u["is_current"])
    assert client.delete(f"/api/admin/users/{me_id}", headers=admin_headers).status_code == 400
    assert client.delete(f"/api/admin/users/{uid}", headers=admin_headers).status_code == 204
    assert client.get("/api/admin/me", headers=editor).status_code == 401


def test_change_own_password(client):
    client.post(
        "/api/admin/users",
        json={"username": "temp-admin", "password": "temp-password-1234"},
        headers=_login(client, ADMIN_USER, ADMIN_PASS),
    )
    old = _login(client, "temp-admin", "temp-password-1234")
    bad = client.post("/api/admin/me/password", json={"current_password": "wrong", "new_password": "next-password-1234"}, headers=old)
    assert bad.status_code == 400
    ok = client.post("/api/admin/me/password", json={"current_password": "temp-password-1234", "new_password": "next-password-1234"}, headers=old)
    assert ok.status_code == 200
    new_headers = {"Authorization": f"Bearer {ok.json()['access_token']}"}
    assert client.get("/api/admin/me", headers=old).status_code == 401  # old session revoked
    assert client.get("/api/admin/me", headers=new_headers).status_code == 200  # fresh token works


def test_media_upload_validation_and_serving(client, admin_headers):
    assert client.get("/api/site").json()["media"]["brand_logo"] is None

    svg = client.put("/api/admin/media/brand-logo", files={"file": ("logo.svg", SVG, "image/svg+xml")}, headers=admin_headers)
    assert svg.status_code == 415  # SVG rejected (can contain script)
    fake = client.put("/api/admin/media/brand-logo", files={"file": ("logo.png", b"not an image", "image/png")}, headers=admin_headers)
    assert fake.status_code == 415  # content type is sniffed, not trusted
    big = client.put("/api/admin/media/brand-logo", files={"file": ("big.png", PNG + b"\x00" * (1024 * 1024), "image/png")}, headers=admin_headers)
    assert big.status_code == 413
    unknown = client.put("/api/admin/media/favicon", files={"file": ("x.png", PNG, "image/png")}, headers=admin_headers)
    assert unknown.status_code == 404

    ok = client.put("/api/admin/media/brand-logo", files={"file": ("logo.png", PNG, "image/png")}, headers=admin_headers)
    assert ok.status_code == 200
    url = client.get("/api/site").json()["media"]["brand_logo"]
    assert url.startswith("/api/media/brand-logo?v=")
    served = client.get("/api/media/brand-logo")
    assert served.status_code == 200
    assert served.headers["content-type"] == "image/png"
    assert served.headers["content-security-policy"] == "default-src 'none'"
    assert served.content == PNG

    assert client.delete("/api/admin/media/brand-logo", headers=admin_headers).status_code == 204
    assert client.get("/api/media/brand-logo").status_code == 404


def test_snapshot_export_from_content():
    from app.services.snapshot import export_snapshot

    snap = export_snapshot(from_content=True)
    assert snap["/api/courses"]["total"] == 22
    assert "/api/courses/statistics-for-data-analysis" in snap
    assert "/api/knowledge" not in snap
    assert all("approval_note" not in v for k, v in snap.items() if k.startswith("/api/services/"))
