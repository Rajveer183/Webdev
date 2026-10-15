"""Command-line tools.

    python -m app.cli migrate                     # alembic upgrade head
    python -m app.cli seed [--overwrite]          # load data/content/*.json into the database
    python -m app.cli check-content               # validate content files and cross-references
    python -m app.cli ingest-pdf PATH [--no-db]   # run the PDF pipeline; writes data/extracted/*.json
    python -m app.cli create-admin USERNAME       # create/reset an admin user (prompts for password)
    python -m app.cli catalogue-report            # write data/catalogue/content-catalogue.md
    python -m app.cli test-email                  # check Gmail/SMTP settings with a test message
    python -m app.cli send-pending-emails         # e-mail enquiries saved while sending was off
    python -m app.cli export-api [--from-content] [--out PATH]
                                                  # public API snapshot for frontend prerendering
"""

from __future__ import annotations

import argparse
import getpass
import json
import sys
from collections import defaultdict
from pathlib import Path

from sqlalchemy import func, select

from app.core.config import REPO_DIR, get_settings
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models import AdminUser
from app.schemas.content import KIND_FILES


def cmd_migrate(_: argparse.Namespace) -> int:
    from app.main import run_migrations

    run_migrations()
    print("Database is up to date.")
    return 0


def cmd_seed(args: argparse.Namespace) -> int:
    from app.services.catalogue import seed_catalogue

    with SessionLocal() as db:
        counts = seed_catalogue(db, overwrite=args.overwrite)
    print("Created:", counts, "(existing records overwritten)" if args.overwrite else "(existing records kept)")
    return 0


def cmd_check_content(_: argparse.Namespace) -> int:
    from app.services.catalogue import ContentValidationError, check_cross_references, load_content_file, validate_content
    from app.schemas.content import TopicContent

    failures = 0
    for kind, filename in KIND_FILES.items():
        records = load_content_file(filename)
        slugs = [r.get("slug") for r in records]
        if len(slugs) != len(set(slugs)):
            print(f"{filename}: duplicate slugs")
            failures += 1
        for r in records:
            try:
                validate_content(kind, r)
            except ContentValidationError as exc:
                failures += 1
                print(f"{filename} [{r.get('slug')}]: {exc.errors}")
    for t in load_content_file("topics.json"):
        try:
            TopicContent.model_validate(t)
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"topics.json [{t.get('id')}]: {exc}")
    for problem in check_cross_references():
        failures += 1
        print(problem)
    print("Content OK" if not failures else f"{failures} problem(s) found")
    return 1 if failures else 0


def cmd_ingest_pdf(args: argparse.Namespace) -> int:
    from app.services.pdf_ingestion import extract_pages, ingest_pdf, parse_syllabus

    path = Path(args.path)
    data = path.read_bytes()
    out_dir = get_settings().extracted_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    if args.no_db:
        extraction = extract_pages(data)
        modules = parse_syllabus(extraction.pages, extraction.type_marks)
        warnings = [f"{m.name} (p{m.pages[0]}): {w}" for m in modules for w in m.warnings]
        if extraction.flagged_pages:
            warnings.insert(0, f"Pages with little or no text (blank, section-divider or image-only): {extraction.flagged_pages}")
        page_count = extraction.page_count
    else:
        with SessionLocal() as db:
            run, created, updated, modules = ingest_pdf(db, data, path.name)
        warnings, page_count = run.warnings, run.page_count
        print(f"Topics created: {created}, updated: {updated} (all new topics are pending review)")
    payload = {
        "source_file": path.name,
        "page_count": page_count,
        "module_count": len(modules),
        "warnings": warnings,
        "modules": [m.to_dict() for m in modules],
    }
    out = out_dir / "syllabus_extracted.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{page_count} pages, {len(modules)} modules, {len(warnings)} warning(s) -> {out}")
    for w in warnings:
        print("  !", w)
    return 0


def cmd_create_admin(args: argparse.Namespace) -> int:
    password = getpass.getpass("New password (min 12 characters): ")
    if len(password) < 12:
        print("Password too short.")
        return 1
    if password != getpass.getpass("Repeat password: "):
        print("Passwords do not match.")
        return 1
    with SessionLocal() as db:
        user = db.scalar(select(AdminUser).where(AdminUser.username == args.username))
        if user:
            user.password_hash = hash_password(password)
        else:
            db.add(AdminUser(username=args.username, password_hash=hash_password(password)))
        db.commit()
    print(f"Admin user '{args.username}' saved.")
    return 0


def cmd_catalogue_report(_: argparse.Namespace) -> int:
    """Render the internal content catalogue (topics.json) as Markdown for review."""
    from app.services.catalogue import load_content_file

    topics = load_content_file("topics.json")
    titles = {kind: {r["slug"]: r["title"] for r in load_content_file(f)} for kind, f in KIND_FILES.items()}
    by_sem: dict[int, list[dict]] = defaultdict(list)
    for t in topics:
        by_sem[t.get("semester") or 0].append(t)

    lines = [
        "# Hexona Consultancy Services content catalogue",
        "",
        "Generated from `data/content/topics.json` by `python -m app.cli catalogue-report`. "
        "Source: `data/source/bsc-hons-statistics-data-science-syllabus.pdf` (114 pages). "
        "Page numbers are 1-based PDF pages.",
        "",
        "| Status | Count |",
        "|---|---|",
    ]
    counts: dict[str, int] = defaultdict(int)
    for t in topics:
        counts[t["status"]] += 1
    lines += [f"| {k} | {v} |" for k, v in sorted(counts.items())]
    lines.append("")

    def names(kind: str, slugs: list[str]) -> str:
        return ", ".join(titles[kind].get(s, s) for s in slugs) or "—"

    for sem in sorted(by_sem):
        lines += [f"## Semester {sem}" if sem else "## Unassigned", ""]
        for t in sorted(by_sem[sem], key=lambda x: x["source_pages"][0] if x["source_pages"] else 0):
            pages = t["source_pages"]
            lines += [
                f"### {t['name']} ({t.get('syllabus_code') or 'no code'})",
                "",
                f"- **Status:** {t['status']}" + (f" — {t['review_note']}" if t.get("review_note") else ""),
                f"- **Description:** {t['description']}",
                f"- **Source pages:** {', '.join(map(str, pages))}",
                f"- **Opportunity types:** {', '.join(t.get('opportunity_types', [])) or '—'}",
                f"- **Related services:** {names('service', t.get('related_services', []))}",
                f"- **Related courses:** {names('course', t.get('related_courses', []))}",
                f"- **Related articles:** {names('article', t.get('related_articles', []))}",
                f"- **Audience:** {', '.join(t.get('audience', [])) or '—'}",
                f"- **Prerequisites:** {', '.join(t.get('prerequisites', [])) or '—'}",
                f"- **Applications:** {', '.join(t.get('applications', [])) or '—'}",
                f"- **Tools:** {', '.join(t.get('tools', [])) or '—'}",
                f"- **Website section:** {t.get('website_section') or '—'}",
                "",
            ]
    out = REPO_DIR / "data" / "catalogue" / "content-catalogue.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out}")
    return 0


def cmd_export_api(args: argparse.Namespace) -> int:
    from app.services.snapshot import export_snapshot

    snapshot = export_snapshot(from_content=args.from_content)
    out = Path(args.out) if args.out else REPO_DIR / "data" / "api-snapshot.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
    source = "content files" if args.from_content else "the configured database"
    print(f"Exported {len(snapshot)} API responses from {source} -> {out}")
    return 0


def cmd_test_email(_: argparse.Namespace) -> int:
    """Send a test message to NOTIFY_EMAIL and report the exact SMTP/Brevo error if it fails."""
    from email.message import EmailMessage

    from app.services.notifications import DeliveryError, deliver

    s = get_settings()
    if not s.email_enabled:
        missing = [n for n, v in [("SMTP_HOST", s.smtp_host), ("SMTP_USERNAME/SMTP_FROM", s.sender), ("NOTIFY_EMAIL", s.notify_email)] if not v]
        if s.smtp_username and not s.smtp_password:
            missing.append("SMTP_PASSWORD (Gmail App Password)")
        print("E-mail is not configured. Missing: " + ", ".join(missing))
        return 1
    msg = EmailMessage()
    msg["Subject"] = "[Hexona Consultancy] Test e-mail"
    msg["From"] = s.sender
    msg["To"] = s.notify_email
    msg.set_content("This is a test from the Hexona Consultancy Services website. Enquiry notifications will arrive at this address.")
    try:
        deliver(msg, timeout=20)
    except DeliveryError as exc:
        print(f"Sending failed: {exc}")
        return 1
    print(f"Test e-mail sent to {s.notify_email}. Check the inbox (and the spam folder).")
    return 0


def cmd_send_pending_emails(_: argparse.Namespace) -> int:
    """Send notifications for enquiries that were stored while e-mail was off or failing."""
    from app.models import Enquiry
    from app.services.notifications import send_enquiry_notification

    if not get_settings().email_enabled:
        print("E-mail is not configured yet; run `python -m app.cli test-email` for details.")
        return 1
    with SessionLocal() as db:
        ids = list(db.scalars(select(Enquiry.id).where(Enquiry.notification_status.in_(["skipped", "failed", "pending"])).order_by(Enquiry.id)))
    for eid in ids:
        send_enquiry_notification(eid)
    with SessionLocal() as db:
        sent = db.scalar(select(func.count()).select_from(Enquiry).where(Enquiry.id.in_(ids), Enquiry.notification_status == "sent")) if ids else 0
    print(f"Pending enquiries: {len(ids)}, e-mailed now: {sent}")
    return 0 if sent == len(ids) else 1


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("migrate").set_defaults(func=cmd_migrate)
    p = sub.add_parser("seed")
    p.add_argument("--overwrite", action="store_true", help="replace existing records with the JSON files")
    p.set_defaults(func=cmd_seed)
    sub.add_parser("check-content").set_defaults(func=cmd_check_content)
    p = sub.add_parser("ingest-pdf")
    p.add_argument("path")
    p.add_argument("--no-db", action="store_true", help="only write data/extracted/syllabus_extracted.json")
    p.set_defaults(func=cmd_ingest_pdf)
    p = sub.add_parser("create-admin")
    p.add_argument("username")
    p.set_defaults(func=cmd_create_admin)
    sub.add_parser("catalogue-report").set_defaults(func=cmd_catalogue_report)
    p = sub.add_parser("export-api")
    p.add_argument("--from-content", action="store_true", help="seed a temporary database from data/content instead of using DATABASE_URL")
    p.add_argument("--out", help="output file (default: data/api-snapshot.json)")
    p.set_defaults(func=cmd_export_api)
    sub.add_parser("test-email", help="send a test message to NOTIFY_EMAIL").set_defaults(func=cmd_test_email)
    sub.add_parser("send-pending-emails", help="e-mail enquiries stored while sending was off").set_defaults(func=cmd_send_pending_emails)
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
