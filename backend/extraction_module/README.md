# BrandLedger: File Extraction & Visual Checks

Reads uploaded marketing files and turns them into text plus structured warnings that the
rest of BrandLedger can use. Owner: Mahadevi Sabarad.

**What it does**
- Extracts text from images (PNG, JPG, WEBP, BMP, TIFF), PDFs (selectable, scanned and mixed) and `.txt` files. Scanned pages are OCR'd with Tesseract.
- Finds *candidate* dates, prices, percentages, numbers and promo phrases.
- Flags low resolution, blur, missing text, low OCR confidence and *possible* low contrast.
- Compares images against a library of reference logos (approved and deprecated).

**What it does not do**
- It does **not** decide policy violations. It only extracts; the rules engine checks Policy Cards.
- Contrast is an **estimate** from OCR word boxes. It never says an image "passes WCAG".
- A logo result is a **similarity estimate** ("possible match"), never an approval. A human confirms.
- It cannot read text that OCR misses, and it only recognises logos in the reference library.

## How the backend uses it

```python
from backend.extraction_module.brandledger_extraction import extract_content

result = extract_content("/path/to/file.pdf", "application/pdf")
if not result["success"] or not result["extracted_text"].strip():
    ...  # return an error. NEVER treat this as "no violations".
text = result["extracted_text"]   # -> the same scan workflow as typed text
```

The API route `POST /api/scans/upload` (form field `file`, optional `title`, `draft_id`,
`scan_date`) does exactly this, then calls `execute_scan`. If extraction fails or finds no
text, it returns an error and creates no scan.

## Output (real example, `dataset/images/img_clear_offer.png`, shortened)

```json
{
  "file_name": "img_clear_offer.png",
  "success": true,
  "extraction_method": "ocr",
  "extracted_text": "SPRING SALE\nGet 20% OFF all Members plans\nValid until 31 March 2026\nUse code SPRING20",
  "ocr": { "used": true, "mean_confidence": 95.0 },
  "entities": {
    "dates": [{ "text": "31 March 2026", "normalized": "2026-03-31" }],
    "percentages": [{ "text": "20%", "value": 20.0 }],
    "promo_phrases": [{ "text": "20% OFF", "category": "discount" }]
  },
  "visual_warnings": [],
  "logo_matches": [{ "status": "not_found", "human_review_required": true }],
  "warnings": [],
  "errors": [],
  "human_review_required": true,
  "review_reasons": ["Logo results are similarity estimates and need human confirmation."]
}
```

| Field | Meaning |
|---|---|
| `success` / `errors` | `false` plus an error code (`EMPTY_FILE`, `CORRUPT_FILE`, `UNSUPPORTED_FORMAT`, `OCR_UNAVAILABLE`, ...) when the file could not be read |
| `extraction_method` | `text_layer`, `ocr`, `mixed` or `plain_text` |
| `entities` | Candidates only. Ambiguous dates like `03/04/2026` are flagged `ambiguous`, never guessed |
| `visual_warnings` | `LOW_RESOLUTION`, `POSSIBLE_BLUR`, `NO_TEXT_DETECTED`, `LOW_OCR_CONFIDENCE`, `POSSIBLE_LOW_CONTRAST` with severity and confidence |
| `logo_matches[].status` | `possible_match`, `possible_variant_mismatch`, `possible_outdated_logo`, `uncertain`, `no_match`, `not_found` |
| `human_review_required` | `true` whenever something is doubtful or failed |

## Setup (macOS)

```bash
brew install tesseract
cd backend/extraction_module
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests -v            # 8 tests
python scripts/run_dataset_eval.py   # 19 sample cases -> fills dataset/manifest.csv
```

## Logos

`logo_library/` holds **placeholder** logos (synthetic shapes, not real brand assets). To use
real ones: copy the files into `logo_library/approved/`, edit `logo_library/manifest.json`
(`status` is `approved` or `deprecated`; remove `"placeholder": true`), then re-run the eval.
A match to a `deprecated` logo is reported as a possible outdated logo.

## Test data

`dataset/` contains synthetic images and PDFs (clear, blurry, low-res, low-contrast, blank,
scanned, mixed, corrupt, unsupported) and `manifest.csv` listing each case, its expected
result, the actual result and PASS/FAIL. Real Inkloom samples are still needed.

## Settings

Thresholds and limits live in `brandledger_extraction/config.py` and were tuned on the
synthetic data only. Re-tune with real files. Optional environment variables:
`BL_MAX_FILE_MB` (20), `BL_MAX_PDF_PAGES` (15), `BL_OCR_LANG` (eng), `BL_LOGO_LIBRARY`, `TESSERACT_CMD`.

## Known limits

- Tesseract must be installed on any machine that runs the API.
- OCR on large pages is slow (seconds per page). The upload route runs it off the event loop.
- Extraction details (visual warnings, logo results) are returned in the response but not saved to the database.
