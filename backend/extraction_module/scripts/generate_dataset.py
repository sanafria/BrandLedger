"""Generate the SYNTHETIC test dataset + placeholder logo library.

Everything created here is fake/placeholder: no real Inkloom brand assets or
policies are used.  Re-running overwrites the files and rewrites manifest.csv
with empty actual_result / pass_fail columns (run scripts/run_dataset_eval.py
afterwards to fill them in).

    python scripts/generate_dataset.py
"""
import csv
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
IMG, PDF, EDGE, LOGOS = (ROOT / "dataset" / d for d in ("images", "pdfs", "edge_cases", "logos"))
LIB = ROOT / "logo_library"

FONT_CANDIDATES = [
    "/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def font(size):
    for p in FONT_CANDIDATES:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default(size)


OFFER_LINES = ["SPRING SALE", "Get 20% OFF all Members plans", "Valid until 31 March 2026", "Use code SPRING20"]


def text_poster(size=(1200, 800), fg=(20, 20, 20), bg=(255, 255, 255), lines=OFFER_LINES):
    img = Image.new("RGB", size, bg)
    d = ImageDraw.Draw(img)
    y = int(size[1] * 0.12)
    for i, line in enumerate(lines):
        d.text((int(size[0] * 0.08), y), line, font=font(int(size[1] * (0.13 if i == 0 else 0.075))), fill=fg)
        y += int(size[1] * (0.22 if i == 0 else 0.15))
    return img


# ------------------------------------------------------------------ logos ----
def logo_canvas(kind, size=400):
    img = Image.new("RGB", (size, size), (255, 255, 255))
    d = ImageDraw.Draw(img)
    c, r = size / 2, size * 0.42
    hexagon = [(c + r * np.cos(np.radians(60 * k + 30)), c + r * np.sin(np.radians(60 * k + 30))) for k in range(6)]
    navy, orange = (31, 78, 156), (240, 140, 30)
    if kind == "primary":
        d.polygon(hexagon, fill=navy); d.ellipse([c - r * .35, c - r * .35, c + r * .35, c + r * .35], fill=orange)
    elif kind == "mono":
        d.polygon(hexagon, fill=(0, 0, 0)); d.ellipse([c - r * .35, c - r * .35, c + r * .35, c + r * .35], fill=(255, 255, 255))
    elif kind == "recoloured":
        d.polygon(hexagon, fill=(30, 150, 70)); d.ellipse([c - r * .35, c - r * .35, c + r * .35, c + r * .35], fill=orange)
    elif kind == "legacy":
        d.rectangle([c - r * .85, c - r * .85, c + r * .85, c + r * .85], fill=navy)
        d.polygon([(c, c - r * .55), (c + r * .55, c), (c, c + r * .55), (c - r * .55, c)], fill=orange)
    elif kind == "unrelated":
        star = [(c + (r if k % 2 == 0 else r * .4) * np.cos(np.radians(36 * k - 90)),
                 c + (r if k % 2 == 0 else r * .4) * np.sin(np.radians(36 * k - 90))) for k in range(10)]
        d.polygon(star, fill=(200, 30, 40))
    return img


def make_logos():
    for kind in ("primary", "mono", "legacy"):
        logo_canvas(kind).save(LIB / "approved" / f"placeholder_{kind}.png")
    manifest = {"_note": "PLACEHOLDER logos for testing only. Replace with the team's real approved logos.",
                "logos": [
                    {"name": "placeholder_primary", "file": "approved/placeholder_primary.png", "status": "approved",
                     "placeholder": True, "notes": "Synthetic navy hexagon + orange dot"},
                    {"name": "placeholder_mono", "file": "approved/placeholder_mono.png", "status": "approved",
                     "placeholder": True, "notes": "Synthetic black/white variant"},
                    {"name": "placeholder_legacy_2019", "file": "approved/placeholder_legacy.png", "status": "deprecated",
                     "placeholder": True, "notes": "Synthetic OLD logo - should be flagged as outdated"}]}
    (LIB / "manifest.json").write_text(json.dumps(manifest, indent=2))


def poster_with_logo(kind="primary", logo_px=170):
    img = text_poster(lines=["SPRING SALE", "Get 20% OFF all Members plans", "Valid until 31 March 2026"])
    logo = logo_canvas(kind).resize((logo_px, logo_px), Image.LANCZOS)
    img.paste(logo, (1200 - logo_px - 60, 50))
    return img


# -------------------------------------------------------------------- pdfs ----
def scanned_page(lines, size=(1240, 1754)):
    img = Image.new("RGB", size, (255, 255, 255))
    d = ImageDraw.Draw(img)
    y = 160
    for i, line in enumerate(lines):
        d.text((120, y), line, font=font(70 if i == 0 else 48), fill=(15, 15, 15))
        y += 150 if i == 0 else 100
    return img.filter(ImageFilter.GaussianBlur(0.6))


def make_pdfs():
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    def write_text_page(c, lines):
        y = 760
        for i, line in enumerate(lines):
            c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 28 if i == 0 else 18)
            c.drawString(60, y, line)
            y -= 50 if i == 0 else 36

    lines = ["SUMMER OFFER", "Get 25% OFF for all Members.", "Offer valid until 30 June 2026.", "Price: Rs. 1,499 per month"]
    c = canvas.Canvas(str(PDF / "pdf_selectable_text.pdf"), pagesize=A4)
    write_text_page(c, lines); c.save()

    scanned_page(lines).save(PDF / "pdf_scanned.pdf", resolution=150)

    # mixed: page 1 = text layer, page 2 = scanned image
    import io
    from reportlab.lib.utils import ImageReader
    c = canvas.Canvas(str(PDF / "pdf_mixed.pdf"), pagesize=A4)
    write_text_page(c, ["MEMBERS WEEK", "Free shipping on all orders.", "Valid until 15 July 2026."])
    c.showPage()
    buf = io.BytesIO(); scanned_page(["PARTNER OFFER", "Save Rs. 500 on annual plans.", "Offer ends 31 August 2026."]).save(buf, "PNG"); buf.seek(0)
    c.drawImage(ImageReader(buf), 0, 0, width=A4[0], height=A4[1]); c.save()


# ---------------------------------------------------------------- manifest ----
def build_cases():
    S = " ; "
    return [
        ("TC01", "images/img_clear_offer.png", "image", "Clear text image extracts correctly",
         "SPRING SALE | 20% OFF | 31 March 2026",
         "none", S.join(["success=true", "text_contains=SPRING SALE", "text_contains=20% OFF", "date=2026-03-31",
                         "percent=20", "no_warning=LOW_RESOLUTION", "no_warning=POSSIBLE_BLUR",
                         "no_warning=POSSIBLE_LOW_CONTRAST"])),
        ("TC02", "images/img_blurry_offer.png", "image", "Heavily blurred image is flagged", "text may be unreliable",
         "POSSIBLE_BLUR", "success=true" + S + "warning=POSSIBLE_BLUR"),
        ("TC03", "images/img_lowres_offer.png", "image", "Tiny image is flagged as low resolution", "text may be unreliable",
         "LOW_RESOLUTION", "success=true" + S + "warning=LOW_RESOLUTION"),
        ("TC04", "images/img_lowcontrast_offer.png", "image", "Light-grey-on-white text flagged as possible contrast issue",
         "text readable, contrast estimated low", "POSSIBLE_LOW_CONTRAST",
         S.join(["success=true", "warning=POSSIBLE_LOW_CONTRAST", "contrast_not_verified=true"])),
        ("TC05", "images/img_blank.png", "image", "Blank image gives NO_TEXT warning, never 'clean'", "(no text)",
         "NO_TEXT_DETECTED", S.join(["success=true", "warning=NO_TEXT_DETECTED", "review_required=true"])),
        ("TC06", "images/img_ambiguous_date.png", "image", "Ambiguous numeric date is flagged, not guessed",
         "Offer ends 03/04/2026", "none", S.join(["success=true", "ambiguous_date=true"])),
        ("TC07", "pdfs/pdf_selectable_text.pdf", "pdf (text layer)", "Selectable PDF uses the text layer, no OCR",
         "SUMMER OFFER | 25% OFF | 30 June 2026 | Rs. 1,499", "none",
         S.join(["success=true", "method=text_layer", "text_contains=SUMMER OFFER", "date=2026-06-30",
                 "percent=25", "currency=1499"])),
        ("TC08", "pdfs/pdf_scanned.pdf", "pdf (scanned)", "Image-only PDF is OCR'd", "SUMMER OFFER | 25% OFF | 30 June 2026",
         "none", S.join(["success=true", "method=ocr", "text_contains=SUMMER OFFER", "date=2026-06-30"])),
        ("TC09", "pdfs/pdf_mixed.pdf", "pdf (mixed)", "Page 1 text layer + page 2 scanned both extracted",
         "MEMBERS WEEK | PARTNER OFFER | 31 August 2026", "none",
         S.join(["success=true", "method=mixed", "pages=2", "text_contains=MEMBERS WEEK",
                 "text_contains=PARTNER OFFER", "date=2026-08-31"])),
        ("TC10", "edge_cases/offer.txt", "txt", "Plain text file read directly", "Join our Customers club",
         "none", S.join(["success=true", "method=plain_text", "text_contains=Customers club", "percent=10"])),
        ("TC11", "edge_cases/empty.png", "image", "0-byte file gives EMPTY_FILE", "error", "n/a", "success=false" + S + "error=EMPTY_FILE"),
        ("TC12", "edge_cases/corrupt.png", "image", "Garbage bytes named .png give CORRUPT_FILE", "error", "n/a",
         "success=false" + S + "error=CORRUPT_FILE"),
        ("TC13", "edge_cases/unsupported.docx", "docx", "Unsupported format rejected clearly", "error", "n/a",
         "success=false" + S + "error=UNSUPPORTED_FORMAT"),
        ("TC14", "edge_cases/corrupt.pdf", "pdf", "Damaged PDF gives CORRUPT_FILE", "error", "n/a",
         "success=false" + S + "error=CORRUPT_FILE"),
        ("TC15", "images/poster_logo_correct.png", "image (logo in poster)", "Placeholder primary logo inside a poster is found",
         "possible_match with placeholder_primary", "none",
         S.join(["success=true", "logo_status=possible_match", "logo_ref=placeholder_primary", "logo_review=true"])),
        ("TC16", "logos/logo_standalone_correct.png", "image (standalone logo)", "Standalone correct logo",
         "possible_match with placeholder_primary", "none",
         S.join(["success=true", "logo_status=possible_match", "logo_ref=placeholder_primary"])),
        ("TC17", "logos/logo_recoloured.png", "image (standalone logo)", "Right shape, wrong colours",
         "possible_variant_mismatch", "none", S.join(["success=true", "logo_status=possible_variant_mismatch"])),
        ("TC18", "logos/logo_legacy.png", "image (standalone logo)", "Deprecated old logo flagged as outdated",
         "possible_outdated_logo", "none", S.join(["success=true", "logo_status=possible_outdated_logo"])),
        ("TC19", "logos/logo_unrelated.png", "image (standalone logo)", "Different logo does not match any reference",
         "no_match", "none", S.join(["success=true", "logo_status=no_match"])),
    ]


def main():
    for d in (IMG, PDF, EDGE, LOGOS, LIB / "approved"):
        d.mkdir(parents=True, exist_ok=True)
    make_logos()

    base = text_poster()
    base.save(IMG / "img_clear_offer.png")
    base.filter(ImageFilter.GaussianBlur(7)).save(IMG / "img_blurry_offer.png")
    base.resize((300, 200), Image.LANCZOS).save(IMG / "img_lowres_offer.png")
    text_poster(fg=(175, 175, 175)).save(IMG / "img_lowcontrast_offer.png")
    Image.new("RGB", (1200, 800), (255, 255, 255)).save(IMG / "img_blank.png")
    text_poster(lines=["FLASH DEAL", "Offer ends 03/04/2026", "Members only"]).save(IMG / "img_ambiguous_date.png")
    poster_with_logo("primary").save(IMG / "poster_logo_correct.png")

    for kind, name in [("primary", "logo_standalone_correct"), ("recoloured", "logo_recoloured"),
                       ("legacy", "logo_legacy"), ("unrelated", "logo_unrelated")]:
        logo_canvas(kind, 320).save(LOGOS / f"{name}.png")

    make_pdfs()

    (EDGE / "empty.png").write_bytes(b"")
    (EDGE / "corrupt.png").write_bytes(b"this is definitely not a png file " * 20)
    (EDGE / "unsupported.docx").write_bytes(b"PK\x03\x04 fake docx content")
    (EDGE / "corrupt.pdf").write_bytes(b"%PDF-1.4\nthis pdf is damaged\n" * 5)
    (EDGE / "offer.txt").write_text("Join our Customers club today and save 10% on your first order.\n", encoding="utf-8")

    with open(ROOT / "dataset" / "manifest.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["test_case_id", "file_name", "input_type", "test_objective", "expected_result",
                    "expected_warning", "check_rules", "actual_result", "pass_fail"])
        for row in build_cases():
            w.writerow(list(row) + ["", ""])
    print("Dataset generated in", ROOT / "dataset")


if __name__ == "__main__":
    main()
