#!/usr/bin/env bash
# Vercel build (Root Directory: statsphere/frontend).
set -e

# 1. Export the API snapshot from data/content so every page is prerendered.
#    Optional: if Python is unavailable the site still builds and renders in the browser.
(
  cd ../backend &&
  python3 -m pip install -q -r requirements.txt &&
  AUTO_MIGRATE=false SEED_ON_STARTUP=false python3 -m app.cli export-api --from-content --out ../data/api-snapshot.json
) || echo "[vercel] API snapshot skipped: pages will render client-side"

# 2. Build, prerender, and serve the app shell for unknown URLs with a 404 status.
npm run build
cp dist/spa.html dist/404.html
