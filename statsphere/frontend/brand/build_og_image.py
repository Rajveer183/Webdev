"""Render frontend/public/og-image.png (1200x630 social share image) from the SGT seal.

Run after changing the business name or logo:  python frontend/brand/build_og_image.py
Requires PyMuPDF (pip install pymupdf); build-time only.
"""

from pathlib import Path

import fitz  # PyMuPDF

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent / "public"
SEAL = HERE / "sgt-university-logo-source.png"

NAVY = (15 / 255, 29 / 255, 69 / 255)
TEAL = (94 / 255, 234 / 255, 212 / 255)
WHITE = (1, 1, 1)
SLATE = (203 / 255, 213 / 255, 225 / 255)
MUTED = (148 / 255, 163 / 255, 184 / 255)


def main() -> None:
    doc = fitz.open()
    page = doc.new_page(width=1200, height=630)
    page.draw_rect(page.rect, color=None, fill=NAVY)
    for x in range(100, 1200, 100):  # faint grid
        page.draw_line((x, 0), (x, 630), color=WHITE, width=0.5, stroke_opacity=0.06)
    for y in range(90, 630, 90):
        page.draw_line((0, y), (1200, y), color=WHITE, width=0.5, stroke_opacity=0.06)

    # Seal on a white disc
    page.draw_circle((175, 175), 92, color=None, fill=WHITE)
    page.insert_image(fitz.Rect(97, 100, 253, 250), filename=str(SEAL))

    page.insert_text((90, 345), "SGT Consulting Services", fontsize=58, fontname="hebo", color=WHITE)
    page.insert_text((90, 400), "SGT University", fontsize=30, fontname="helv", color=SLATE)
    page.insert_text((90, 490), "From Statistical Insight to Data-Driven Impact.", fontsize=28, fontname="helv", color=TEAL)
    page.insert_text((90, 540), "Statistics, mathematics and data science consulting and certificate courses", fontsize=21, fontname="helv", color=MUTED)

    # Distribution curve accent
    import math

    pts = [fitz.Point(800 + i * 3.5, 470 - math.exp(-(((i - 50) / 16) ** 2) / 2) * 300) for i in range(101)]
    page.draw_polyline(pts, color=TEAL, width=6, stroke_opacity=0.85)
    page.draw_line((780, 470), (1170, 470), color=WHITE, width=2, stroke_opacity=0.25)

    pix = page.get_pixmap(dpi=72, alpha=False)
    pix.save(PUBLIC / "og-image.png")
    print(f"wrote {PUBLIC / 'og-image.png'} ({pix.width}x{pix.height})")


if __name__ == "__main__":
    main()
