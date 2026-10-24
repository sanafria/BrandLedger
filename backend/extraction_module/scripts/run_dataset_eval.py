"""Run every dataset case through extract_content and fill actual_result / pass_fail.

    python scripts/run_dataset_eval.py
"""
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from brandledger_extraction import extract_content  # noqa: E402


def norm(s):
    return re.sub(r"\s+", " ", s).lower()


def evaluate(result: dict, rules: str):
    failures = []
    codes = {w["code"] for w in result["visual_warnings"]}
    logo = result["logo_matches"][0] if result["logo_matches"] else {}
    ents = result.get("entities", {})
    for rule in [r.strip() for r in rules.split(" ; ") if r.strip()]:
        k, _, v = rule.partition("=")
        ok = {
            "success": lambda: str(result["success"]).lower() == v,
            "error": lambda: v in {e["code"] for e in result["errors"]},
            "text_contains": lambda: norm(v) in norm(result["extracted_text"]),
            "method": lambda: result["extraction_method"] == v,
            "pages": lambda: len(result["pages"]) == int(v),
            "warning": lambda: v in codes,
            "no_warning": lambda: v not in codes,
            "date": lambda: v in {d["normalized"] for d in ents.get("dates", [])},
            "ambiguous_date": lambda: any(d["ambiguous"] for d in ents.get("dates", [])),
            "percent": lambda: float(v) in {p["value"] for p in ents.get("percentages", [])},
            "currency": lambda: float(v) in {c["value"] for c in ents.get("currency", [])},
            "contrast_not_verified": lambda: result["visual_summary"].get("contrast", {}).get("wcag_verified") is False,
            "review_required": lambda: result["human_review_required"] is True,
            "logo_status": lambda: logo.get("status") == v,
            "logo_ref": lambda: logo.get("reference_name") == v,
            "logo_review": lambda: logo.get("human_review_required") is True,
        }.get(k, lambda: False)()
        if not ok:
            failures.append(rule)
    return failures


def summarise(result: dict) -> str:
    logo = result["logo_matches"][0] if result["logo_matches"] else None
    parts = [f"success={result['success']}", f"method={result['extraction_method']}",
             f"text={result['extracted_text'][:60]!r}",
             f"warnings={sorted({w['code'] for w in result['visual_warnings']})}",
             f"errors={[e['code'] for e in result['errors']]}"]
    if logo:
        parts.append(f"logo={logo['status']}:{logo['reference_name']}:{logo['similarity_score']}")
    return " | ".join(parts)


def main():
    path = ROOT / "dataset" / "manifest.csv"
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    passed = 0
    for row in rows:
        res = extract_content(str(ROOT / "dataset" / row["file_name"]))
        fails = evaluate(res, row["check_rules"])
        row["actual_result"] = summarise(res)
        row["pass_fail"] = "PASS" if not fails else "FAIL: " + "; ".join(fails)
        passed += not fails
        print(f"{row['test_case_id']} {row['pass_fail']}\n     {row['actual_result']}")
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f"\n{passed}/{len(rows)} passed")
    return 0 if passed == len(rows) else 1


if __name__ == "__main__":
    sys.exit(main())
