"""Uploaded brand images. Raster formats only: SVG can carry script and is rejected."""

from __future__ import annotations

import hashlib

from sqlalchemy.orm import Session

from app.models import MediaAsset

MEDIA_KEYS = {
    "brand-logo": "Business logo shown in the header and footer",
}
MAX_MEDIA_BYTES = 1024 * 1024  # 1 MB


class MediaError(ValueError):
    pass


def sniff_image_type(data: bytes) -> str | None:
    """Identify PNG, JPEG or WebP from the file signature (never trust the client's content type)."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def save_media(db: Session, key: str, data: bytes) -> MediaAsset:
    if key not in MEDIA_KEYS:
        raise MediaError("Unknown media slot")
    if len(data) > MAX_MEDIA_BYTES:
        raise MediaError("Image must be 1 MB or smaller")
    content_type = sniff_image_type(data)
    if content_type is None:
        raise MediaError("Upload a PNG, JPEG or WebP image")
    asset = db.get(MediaAsset, key) or MediaAsset(key=key)
    asset.content_type = content_type
    asset.data = data
    asset.sha256 = hashlib.sha256(data).hexdigest()
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def media_urls(db: Session) -> dict[str, str | None]:
    """Public URLs for uploaded media, versioned by content hash so browsers refresh after a change."""
    out: dict[str, str | None] = {}
    for key in MEDIA_KEYS:
        asset = db.get(MediaAsset, key)
        out[key.replace("-", "_")] = f"/api/media/{key}?v={asset.sha256[:12]}" if asset else None
    return out
