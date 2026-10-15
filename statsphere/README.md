# Hexona Consultancy Services

The website of Hexona Consultancy Services, a statistics, mathematics and data-science consulting and
professional training service. The subject matter comes from a 114-page
B.Sc. (Hons) Statistics & Data Science syllabus.
It is organised into consulting services, certificate courses, corporate workshops,
knowledge articles and worked demonstration projects.

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4, React Router, Recharts, KaTeX, React Hook Form + Zod
- **Backend:** FastAPI, Pydantic 2, SQLAlchemy 2, Alembic, PostgreSQL (SQLite for local development)
- **Content pipeline:** pdfplumber-based PDF extraction → editorial review → curated JSON → database
- **SEO:** every public page is prerendered to static HTML at build time (React 19 `prerender`) and hydrated in the browser

```text
statsphere/
├── backend/                 FastAPI app, Alembic migrations, tests
│   ├── app/
│   │   ├── api/routes/      public.py · enquiries.py · admin.py
│   │   ├── core/            config, db, security (scrypt + JWT), rate limiting, logging
│   │   ├── models/          SQLAlchemy models
│   │   ├── schemas/         content, enquiry and admin schemas
│   │   ├── services/        catalogue, enquiries, notifications, pdf_ingestion, settings, media, snapshot
│   │   ├── cli.py           seed / check-content / ingest-pdf / create-admin / catalogue-report / export-api
│   │   └── main.py          app factory, error envelope, security headers
│   └── tests/               69 pytest tests
├── frontend/                React app (pages, components, hooks, admin UI)
│   ├── src/entry-server.tsx build-time renderer used by scripts/prerender.mjs
│   └── scripts/             generate-sitemap.mjs, prerender.mjs
├── data/
│   ├── content/             curated website content (JSON) + SCHEMA.md
│   ├── catalogue/           content-catalogue.md, the PDF analysis deliverable
│   ├── scripts/             build_projects.py (reproducible synthetic demo analyses)
│   ├── source/              place the syllabus PDF here (git-ignored)
│   └── extracted/           PDF pipeline output (git-ignored)
├── docker-compose.yml       PostgreSQL + API + nginx-served frontend
└── .env.example
```

## Ports used by this project

| Port | What |
|---|---|
| 8000 | FastAPI backend (`uvicorn`) |
| 5173 | Vite dev server (`npm run dev`, proxies `/api` to 8000) |
| 4173 | Production preview of the prerendered build (`npm run preview`, proxies `/api` to 8000) |
| 8090 | Docker Compose site (nginx → backend) |

## Quick start (local development)

Prerequisites: Python 3.12+ and Node 20+.

```bash
# 1. Backend: SQLite, auto-migrates and seeds curated content on first start
cd backend
python -m venv .venv
.venv/Scripts/activate            # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements-dev.txt
ADMIN_PASSWORD='choose-a-local-password' uvicorn app.main:app --reload --port 8000
#   API docs: http://127.0.0.1:8000/api/docs

# 2. Frontend (in another terminal)
cd frontend
npm install
npm run dev                       # http://localhost:5173  (proxies /api to :8000)
```

To preview the production build exactly as it will be served (prerendered pages, hydration,
the nginx security headers, `/admin` served from the app shell, and unknown URLs answering 404 with it):

```bash
cd frontend
npm run build      # type-check, client build, server build, prerender 73 pages
npm run preview    # http://localhost:4173
```

`npm run build` needs an API snapshot. It uses `data/api-snapshot.json`, and if that file is missing
it exports one automatically from `data/content` through the backend virtualenv. To prerender with
your admin edits (publishing, availability, edited text), export from the database first:
`cd backend && python -m app.cli export-api`. `npm run build:spa` skips prerendering.

The admin area is at **`/admin`**. On first start, `ADMIN_PASSWORD` creates the user
`ADMIN_USERNAME` (default `admin`). To create or reset an admin later, run
`python -m app.cli create-admin <username>`.

## Docker (production-like)

```bash
cp .env.example .env              # set POSTGRES_PASSWORD, JWT_SECRET, ADMIN_PASSWORD, SITE_URL, CORS_ORIGINS
docker compose up --build -d      # http://localhost:8090
```

- **Backend container:** runs `alembic upgrade head` and seeds the catalogue on startup (`AUTO_MIGRATE`, `SEED_ON_STARTUP`).
- **Frontend container:** a multi-stage build. A Python stage exports the API snapshot from `data/content`, the Node stage builds and prerenders every public page, and nginx serves `<route>/index.html` (serving the `noindex` app shell for `/admin`, and for unknown URLs with a 404 status), adds security headers (including a CSP and HSTS) and proxies `/api` to the backend.
- **Production mode (`APP_ENV=production`):** startup is refused without a strong `JWT_SECRET`, and the API docs are disabled.
- **After the first login:** remove `ADMIN_PASSWORD` from `.env`.
- **Before going live:** put a TLS-terminating proxy in front of port 8090, such as a cloud load balancer or Caddy.

## Tests and checks

```bash
cd backend  && .venv/Scripts/python -m pytest                  # 69 tests
cd backend  && .venv/Scripts/python -m app.cli check-content   # schema + cross-reference validation
cd frontend && npm test                                        # 30 tests (vitest)
cd frontend && npm run build                                   # type-check, build, prerender
cd frontend && npm run check:dist                              # prerendered pages: meta, data, JSON-LD, no inline scripts
```

The backend tests cover:
- public endpoints and filters;
- enquiry validation, honeypot, time-trap and rate limiting;
- admin authentication and workflows, admin-user management (sessions revoked on password change or deletion) and logo uploads;
- content integrity (schemas, cross-references, no fees, accreditation or guarantee claims);
- PDF parsing, both on a template sample and on the real 114-page PDF when it is present in `data/source/` (all 51 modules, including every course type);
- the prerender snapshot export.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness and database check |
| GET | `/api/site` | Contact details, brand overrides and homepage content blocks (FAQ, expertise, industries) |
| GET | `/api/services`, `/api/services/{slug}` | Consulting services (`category`, `featured`, `q`) |
| GET | `/api/courses`, `/api/courses/{slug}` | Certificate courses (`level`, `category`, `format`, `mode`, `featured`, `q`) |
| GET | `/api/articles`, `/api/articles/{slug}` | Knowledge-hub articles (`category`, `tag`, `q`) |
| GET | `/api/projects`, `/api/projects/{slug}` | Synthetic demonstration projects |
| GET | `/api/workshops` | Corporate workshop catalogue |
| GET | `/api/topics` | Approved subject areas from the PDF catalogue |
| POST | `/api/enquiries/consulting` · `/courses` · `/corporate-training`, `/api/contact` | Enquiry forms → `201 {reference}` |
| POST | `/api/admin/login` | Admin bearer token |
| GET/PATCH | `/api/admin/enquiries[/{id}]` | Enquiry inbox and status workflow |
| GET/PATCH | `/api/admin/catalogue/{kind}[/{slug}]` | Publish, unpublish, availability, featured, order, full validated edits |
| GET/PATCH | `/api/admin/topics[/{id}]` | Review PDF-derived topics |
| POST/GET | `/api/admin/pdf-ingestion[/runs]` | Upload a syllabus PDF and see ingestion history |
| GET/PUT | `/api/admin/settings` | Contact details, booking link, brand overrides |
| GET/POST/DELETE | `/api/admin/users[/{id}]`, PUT `/api/admin/users/{id}/password`, POST `/api/admin/me/password` | Admin accounts |
| GET/PUT/DELETE | `/api/admin/media[/{key}]` | Brand logo upload (PNG/JPEG/WebP ≤ 1 MB) |
| GET | `/api/media/{key}` | Serves uploaded logos |

**Response formats**
- **Lists:** `{ items, total }`.
- **Errors:** `{ error: { code, message, details? } }`. `details` lists field-level validation messages.

**Enquiry responses**
- **`201`:** the frontend shows success only for a `201` that carries a reference number.
- **`202`:** returned for spam (honeypot or too-fast submissions). Nothing is stored, and the UI does not claim success.

## Security and privacy

- **Admin passwords:** hashed with scrypt (stdlib).
- **Sessions:** short-lived HS256 JWTs, kept in `sessionStorage`. Each token carries the user's token version, so changing or resetting a password, or deleting an account, revokes existing sessions immediately.
- **Login protection:** login attempts are rate-limited, and unknown users take the same time to reject as known ones.
- **Form protection:** public forms have a per-IP rate limit, a hidden honeypot field, a minimum fill time, strict schemas (unknown fields are rejected) and server-side checks that referenced services and courses exist.
- **Logging:** personal data is never logged.
  - The request logger records method, path and status only.
  - uvicorn's access log is disabled because it would record query strings.
  - Email addresses are redacted from all log output.
- **Database access:** the SQLAlchemy ORM handles all queries (no string-built SQL).
- **Internal fields:** editorial notes such as `approval_note` are stripped from public responses.
- **Uploads:** logo files are identified by their file signature (never the client's content type); SVG is rejected because it can contain script; images are served with `Content-Security-Policy: default-src 'none'`.
- **Content Security Policy:** `frontend/security-headers.conf` allows scripts from the site itself only. Pages have no inline scripts: the theme bootstrap is `public/theme-init.js`, prerendered data is a non-executable JSON block, and `npm run check:dist` fails the build output if an inline script appears. Inline styles remain allowed (React `style` props, Recharts).
- **Scaling:** the rate limiter is in-process. With more than one backend replica, move limits to Redis or the reverse proxy.

## E-mail, booking and integrations

- **Enquiry e-mails:** every submitted form (consulting, course, corporate training, contact) is e-mailed, with all its fields, to the private inbox `NOTIFY_EMAIL` (default `rajveersinghrathorer584@gmail.com`). Replying to the e-mail answers the visitor directly (Reply-To is their address). The inbox is never shown on the website or returned by the public API. To send through Gmail, set `SMTP_HOST=smtp.gmail.com`, `SMTP_USERNAME` to the Gmail address and `SMTP_PASSWORD` to a Gmail App Password (requires 2-Step Verification); see `.env.example`. Without a password, enquiries are still stored and appear in Admin → Enquiries with notification status `skipped`. After adding the password, run `python -m app.cli test-email` to check the login, and `python -m app.cli send-pending-emails` (or the "Send e-mail now" button in Admin → Enquiries) to deliver enquiries that were saved earlier.
- **Booking (optional):** set a `https://` scheduling link in Admin → Settings, or `VITE_BOOKING_URL` at build time, to show "Schedule a call". Without it, the consulting form collects a preferred date and time of day as the fallback.
- **OCR for scanned PDFs (optional):** `pip install pytesseract pypdfium2` and install the Tesseract binary. The source PDF in this project has a full text layer, so OCR is not needed.

## Content and editorial workflow

See [data/README.md](data/README.md). In short:
1. The PDF pipeline extracts all 51 syllabus modules into topics marked **pending review**.
2. Curated services, courses, articles, workshops and projects live in `data/content/*.json`. They are validated against strict schemas, and every record carries `source_pages`.
3. Admins publish, unpublish, edit and change course availability in `/admin`. Every content type has a form editor (lists, repeatable steps and modules, cross-reference pickers, page ranges); an Advanced (JSON) tab covers article bodies and generated chart data. Every save is validated against the content schema.
4. Public pages are prerendered from an API snapshot at build time. After an admin change, browsers show the new content immediately (pages refresh their data from the live API after loading); rebuild the frontend to update the static HTML that search engines read.

## Items that need your confirmation before launch

The site is built so that nothing unverified is presented as fact. These items are deliberately
left as configurable placeholders or labelled "proposed":

1. **Business details.** Email, phone, address, opening hours and LinkedIn are empty until you enter them in Admin → Settings. Empty fields are hidden.
2. **Courses.**
   - All 22 are labelled **Proposed · accepting enquiries**.
   - Durations are proposals.
   - Delivery mode shows "To be confirmed" and fees show "To be announced".
   - Certificate eligibility criteria are marked "(proposed)".
   - Change availability per course in Admin → Catalogue.
3. **Services.**
   - All 14 are shown as accepting enquiries.
   - Three carry internal approval notes visible only in admin: machine learning / deep learning capacity, big-data infrastructure, and clinical ethics responsibilities.
   - Research support also has a note about publishing the academic-integrity policy.
4. **Team.** Profiles are hidden until you add verified entries to `frontend/src/config/brand.ts → team`.
5. **Branding.** The site has no bundled logo, favicon or social share image. The header and footer show the business name
   on its own until a logo is uploaded in Admin → Settings → Logos.
   - **Certificates** are described as certificates of completion issued by Hexona Consultancy Services, not university degrees or
     diplomas, and not externally accredited.
6. **Source PDF.** The syllabus is used as subject-matter reference. Website text is written in our own words, and the PDF and its raw extraction are git-ignored.
7. **Domain.** Set `SITE_URL` for canonical URLs, Open Graph URLs and `sitemap.xml`.
8. **Privacy notice.** `/privacy` is a factual starting point. Have it reviewed for your jurisdiction.

## Known limitations

- **Static HTML freshness:** prerendered HTML reflects the content at build time. Visitors always see current data (pages refresh from the API after loading), but search engines see the build-time version until the frontend is rebuilt.
- **Roles:** there is a single admin role; every admin can manage content, enquiries, settings and other admins.
- **Unpublished slugs:** URLs without a prerendered page return HTTP 404 with the app shell. A slug published after the last build also gets that 404 status until the frontend is rebuilt, although the app still renders the page.
