# BrandLedger - File Extraction & Visual Checks (Mahadevi)

OCR, PDF text extraction, candidate date/number/offer extraction, image-quality and
contrast estimates, and logo similarity matching. Returns JSON-compatible dicts.
It does NOT create policy findings - that is Zynab's engine. Zoya calls:

    from brandledger_extraction import extract_content
    result = extract_content("/path/file.pdf", "application/pdf")
    text = result["extracted_text"]      # -> Zynab's scan_draft(...)
    # result["success"], result["errors"], result["warnings"], result["human_review_required"]

Output fields: file_name, file_type, content_type, extracted_text, pages[], ocr{}, entities{dates,
currency, percentages, numbers, promo_phrases}, visual_warnings[], visual_summary{}, logo_matches[],
warnings[], errors[], human_review_required, review_reasons[], schema_version.
If success is false or no text was extracted, the scan must NOT be treated as "clean".

## macOS setup
    brew install tesseract
    cd brandledger-extraction
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt -r requirements-dev.txt
    python -m pytest -v
    python scripts/run_dataset_eval.py      # fills dataset/manifest.csv
    python -c "import json;from brandledger_extraction import extract_content as e;print(json.dumps(e('dataset/images/img_clear_offer.png'),indent=2)[:1500])"

## Logos
Placeholders live in logo_library/ (manifest.json + approved/). Replace with the team's REAL logos
(status "approved" or "deprecated"; remove "placeholder": true). A match is "possible_match" only -
a human must confirm. Thresholds in brandledger_extraction/config.py were tuned on synthetic data only.

## Limits (be honest in the demo)
- Contrast is an ESTIMATE from OCR word boxes; never a WCAG pass/fail.
- Blur/resolution are heuristics. Logo matching only recognises known reference logos.
- Dataset is synthetic; real Inkloom assets/policies are still needed.

## Manual checklist
[ ] tesseract --version works  [ ] pytest passes  [ ] run_dataset_eval shows all PASS
[ ] try your own photo, scanned PDF, wrong-extension file  [ ] swap in real logos and re-run
