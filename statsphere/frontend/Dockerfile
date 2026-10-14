# Build context: repository root (needs backend/ for the API snapshot and data/content/ for the sitemap).

# 1. Export the public API responses from the curated content (used to prerender every page).
FROM python:3.12-slim AS snapshot
WORKDIR /srv/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY data/content/ /srv/data/content/
ENV CONTENT_DIR=/srv/data/content AUTO_MIGRATE=false SEED_ON_STARTUP=false
RUN python -m app.cli export-api --from-content --out /srv/api-snapshot.json

# 2. Build the client bundle, the server renderer, and prerender all public routes.
FROM node:22-alpine AS build
WORKDIR /srv/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
COPY data/content/ /srv/data/content/
COPY --from=snapshot /srv/api-snapshot.json /srv/data/api-snapshot.json
ARG SITE_URL=""
ARG VITE_BOOKING_URL=""
ENV SITE_URL=$SITE_URL VITE_SITE_URL=$SITE_URL VITE_BOOKING_URL=$VITE_BOOKING_URL SNAPSHOT_PATH=/srv/data/api-snapshot.json
RUN npm run build

# 3. Serve with nginx.
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /srv/frontend/dist /usr/share/nginx/html
EXPOSE 80
