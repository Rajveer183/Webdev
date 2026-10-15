# Build context: repository root (needs backend/ and data/content/).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CONTENT_DIR=/srv/data/content \
    EXTRACTED_DIR=/srv/data/extracted

WORKDIR /srv/backend
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
COPY data/content/ /srv/data/content/

RUN useradd --create-home --uid 10001 app && mkdir -p /srv/data/extracted /srv/data/db && chown -R app /srv/data/extracted /srv/data/db
USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"

# One worker: the rate limiter is in-process (see README → Scaling).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
