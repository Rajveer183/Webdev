#!/usr/bin/env bash
# Vercel build (Root Directory: statsphere/frontend).
set -e

# 1. Export the API snapshot from data/content so every page is prerendered.
#    Uses a private virtualenv: the build image's system Python refuses global pip installs.
VENV=/tmp/snapshot-venv
if python3 -m venv "$VENV" && "$VENV/bin/pip" install -q -r ../backend/requirements.txt; then
  (cd ../backend && AUTO_MIGRATE=false SEED_ON_STARTUP=false "$VENV/bin/python" -m app.cli export-api --from-content --out ../data/api-snapshot.json)
else
  echo "[vercel] WARNING: Python setup failed; pages will not be prerendered" >&2
fi

# 2. Build, prerender, and serve the app shell for unknown URLs with a 404 status.
npm run build
cp dist/spa.html dist/404.html
