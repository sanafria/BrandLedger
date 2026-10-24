"""Run with:  python -m pytest -v   (from the project root)."""
from pathlib import Path
from brandledger_extraction import extract_content
from brandledger_extraction.entity_extractor import extract_entities
from brandledger_extraction.image_checks import contrast_ratio

D = Path(__file__).resolve().parent.parent / "dataset"
codes = lambda r: {w["code"] for w in r["visual_warnings"]}


def test_clear_image_text_and_entities():
    r = extract_content(str(D / "images/img_clear_offer.png"))
    assert r["success"] and "SPRING SALE" in r["extracted_text"]
    assert "2026-03-31" in {d["normalized"] for d in r["entities"]["dates"]}
    assert not codes(r) & {"LOW_RESOLUTION", "POSSIBLE_BLUR"}


def test_blur_lowres_and_blank_flagged():
    assert "POSSIBLE_BLUR" in codes(extract_content(str(D / "images/img_blurry_offer.png")))
    assert "LOW_RESOLUTION" in codes(extract_content(str(D / "images/img_lowres_offer.png")))
    r = extract_content(str(D / "images/img_blank.png"))
    assert "NO_TEXT_DETECTED" in codes(r) and r["human_review_required"]


def test_contrast_never_claims_wcag_pass():
    r = extract_content(str(D / "images/img_lowcontrast_offer.png"))
    assert "POSSIBLE_LOW_CONTRAST" in codes(r)
    assert r["visual_summary"]["contrast"]["wcag_verified"] is False
    assert abs(contrast_ratio((0, 0, 0), (255, 255, 255)) - 21) < 0.01


def test_pdf_text_scanned_mixed():
    assert extract_content(str(D / "pdfs/pdf_selectable_text.pdf"))["extraction_method"] == "text_layer"
    assert extract_content(str(D / "pdfs/pdf_scanned.pdf"))["extraction_method"] == "ocr"
    m = extract_content(str(D / "pdfs/pdf_mixed.pdf"))
    assert m["extraction_method"] == "mixed" and len(m["pages"]) == 2


def test_bad_files_fail_gracefully():
    for name, code in [("empty.png", "EMPTY_FILE"), ("corrupt.png", "CORRUPT_FILE"),
                       ("unsupported.docx", "UNSUPPORTED_FORMAT"), ("corrupt.pdf", "CORRUPT_FILE")]:
        r = extract_content(str(D / "edge_cases" / name))
        assert not r["success"] and code in {e["code"] for e in r["errors"]}
    assert extract_content("/no/such/file.png")["errors"][0]["code"] == "FILE_NOT_FOUND"


def test_ambiguous_date_not_guessed():
    d = extract_entities("Offer ends 03/04/2026")["dates"][0]
    assert d["ambiguous"] and d["normalized"] is None and len(d["candidates"]) == 2


def test_currency_percent_promo():
    e = extract_entities("Flat Rs. 1,500 off, 20% OFF, use code SPRING20")
    assert e["currency"][0]["value"] == 1500 and e["percentages"][0]["value"] == 20
    assert any("SPRING20" in p["text"] for p in e["promo_phrases"])


def test_logo_statuses_and_human_review():
    st = lambda f: extract_content(str(D / f))["logo_matches"][0]
    assert st("logos/logo_standalone_correct.png")["status"] == "possible_match"
    assert st("logos/logo_recoloured.png")["status"] == "possible_variant_mismatch"
    assert st("logos/logo_legacy.png")["status"] == "possible_outdated_logo"
    assert st("logos/logo_unrelated.png")["status"] in ("no_match", "uncertain")
    assert all(st(f)["human_review_required"] for f in ("logos/logo_unrelated.png", "images/poster_logo_correct.png"))
