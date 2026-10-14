"""A small in-memory sliding-window rate limiter.

Suitable for a single backend process. If you run several replicas, move this to a
shared store (e.g. Redis) or enforce limits at the reverse proxy.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import get_settings


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window: int) -> int | None:
        """Record a hit. Returns None if allowed, else seconds until the next slot frees up."""
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and q[0] <= now - window:
                q.popleft()
            if len(q) >= limit:
                return max(1, int(q[0] + window - now) + 1)
            q.append(now)
            return None

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()


def client_ip(request: Request) -> str:
    if get_settings().trust_proxy_headers:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce(request: Request, bucket: str, limit: int, window: int) -> None:
    retry = limiter.check(f"{bucket}:{client_ip(request)}", limit, window)
    if retry is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a few minutes and try again.",
            headers={"Retry-After": str(retry)},
        )


def enquiry_rate_limit(request: Request) -> None:
    s = get_settings()
    enforce(request, "enquiry", s.enquiry_rate_limit, s.enquiry_rate_window_seconds)


def login_rate_limit(request: Request) -> None:
    s = get_settings()
    enforce(request, "login", s.login_rate_limit, s.login_rate_window_seconds)
