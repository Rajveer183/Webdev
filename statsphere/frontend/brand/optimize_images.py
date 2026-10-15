"""Write web-sized copies of the SGT seal and shrink the share and touch icons in frontend/public.

Run after replacing the seal or rebuilding the OG image:  python frontend/brand/optimize_images.py
Requires Pillow; build-time only.
"""

from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent / "public"
SEAL_SOURCE = HERE / "sgt-university-logo-source.png"

# The seal is shown at most 88 px wide (InstitutionReference), so 2x covers retina screens.
SEAL_MAX = 192


def seal() -> None:
    im = Image.open(SEAL_SOURCE).convert("RGBA")
    im.thumbnail((SEAL_MAX, SEAL_MAX), Image.LANCZOS)
    im.save(PUBLIC / "assets" / "sgt-university-logo.webp", "WEBP", quality=88, method=6)
    # PNG kept at the stable path for anything outside the app (JSON-LD, email, admin hint).
    im.save(PUBLIC / "assets" / "sgt-university-logo.png", "PNG", optimize=True)


def flatten(path: Path, size: tuple[int, int]) -> None:
    im = Image.open(path).convert("RGB")
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    # Adaptive palette keeps these flat-colour graphics sharp at a fraction of the size.
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, "PNG", optimize=True)


def main() -> None:
    seal()
    flatten(PUBLIC / "apple-touch-icon.png", (180, 180))
    flatten(PUBLIC / "og-image.png", (1200, 630))
    for p in sorted([*PUBLIC.glob("*.png"), *(PUBLIC / "assets").glob("sgt-university-logo.*")]):
        print(f"{p.relative_to(HERE.parent)}: {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
