"""Pull out *candidate* dates, numbers, currency, percentages and promo phrases.

IMPORTANT: this module only finds things that look like facts or offers.  It does
NOT decide whether they violate a Policy Card - that is the rule engine's job.
Ambiguous values (e.g. 03/04/2026) are reported as ambiguous, never guessed.
"""
from __future__ import annotations
import re
from datetime import date

_MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9, "oct": 10,
    "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}
_MON = r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
_ORD = r"(?:st|nd|rd|th)?"

_CUE = re.compile(
    r"(valid\s+(?:until|till|through|thru|from|on|upto|up\s+to)|offer\s+(?:ends|expires|valid)|"
    r"expires?|ends?|until|till|through|thru|before|by|from|starts?|effective|sale\s+ends)\W*$", re.I)


def _iso(y, m, d):
    try:
        return date(y, m, d).isoformat()
    except ValueError:
        return None


def _context(text: str, start: int, end: int, pad: int = 30) -> str:
    return " ".join(text[max(0, start - pad): end + pad].split())


def _free(span, taken):
    return all(span[1] <= a or span[0] >= b for a, b in taken)


def extract_dates(text: str) -> tuple[list, list]:
    """Return (dates, occupied_spans)."""
    found, taken = [], []

    def add(m, normalized, kind, ambiguous=False, candidates=None, note=None):
        span = m.span()
        if not _free(span, taken):
            return
        taken.append(span)
        cue = _CUE.search(text[max(0, span[0] - 28): span[0]])
        found.append({
            "text": m.group(0), "normalized": normalized, "kind": kind,
            "ambiguous": ambiguous, "candidates": candidates or [],
            "context_cue": cue.group(1).lower() if cue else None,
            "note": note, "span": [span[0], span[1]], "context": _context(text, *span),
        })

    # 1. ISO 2026-03-31
    for m in re.finditer(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", text):
        iso = _iso(int(m[1]), int(m[2]), int(m[3]))
        add(m, iso, "iso", note=None if iso else "invalid calendar date")
    # 2. 31 March 2026 / 31st of March, 2026
    for m in re.finditer(rf"\b(\d{{1,2}}){_ORD}\s+(?:of\s+)?({_MON})\.?,?\s+(\d{{4}})\b", text, re.I):
        iso = _iso(int(m[3]), _MONTHS[m[2].lower()], int(m[1]))
        add(m, iso, "day_month_year", note=None if iso else "invalid calendar date")
    # 3. March 31, 2026
    for m in re.finditer(rf"\b({_MON})\.?\s+(\d{{1,2}}){_ORD},?\s+(\d{{4}})\b", text, re.I):
        iso = _iso(int(m[3]), _MONTHS[m[1].lower()], int(m[2]))
        add(m, iso, "month_day_year", note=None if iso else "invalid calendar date")
    # 4. numeric 31/03/2026, 03-31-26
    for m in re.finditer(r"\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})\b", text):
        a, b, y = int(m[1]), int(m[2]), int(m[3])
        y = y + 2000 if y < 100 else y
        dmy, mdy = _iso(y, b, a), _iso(y, a, b)
        if a > 12 and dmy:
            add(m, dmy, "numeric_dmy")
        elif b > 12 and mdy:
            add(m, mdy, "numeric_mdy")
        elif a == b and dmy:
            add(m, dmy, "numeric")
        elif dmy and mdy:
            add(m, None, "numeric", True, [dmy, mdy], "Day/month order is ambiguous; needs human confirmation.")
        else:
            add(m, None, "numeric", note="invalid calendar date")
    # 5. no year: 31 March / March 31
    for m in re.finditer(rf"\b(\d{{1,2}}){_ORD}\s+({_MON})\b(?!\.?,?\s+\d{{4}})", text, re.I):
        add(m, None, "day_month", note="Year missing; cannot normalise.")
    for m in re.finditer(rf"\b({_MON})\.?\s+(\d{{1,2}}){_ORD}\b(?!,?\s+\d{{4}})", text, re.I):
        add(m, None, "month_day", note="Year missing; cannot normalise.")

    found.sort(key=lambda d: d["span"][0])
    return found, taken


_CURRENCY_CODES = {"₹": "INR", "rs": "INR", "inr": "INR", "rupees": "INR", "$": "USD", "usd": "USD",
                   "dollars": "USD", "€": "EUR", "eur": "EUR", "£": "GBP", "gbp": "GBP"}
_MULT = {"k": 1e3, "lakh": 1e5, "lakhs": 1e5, "crore": 1e7, "crores": 1e7, "m": 1e6, "million": 1e6, "bn": 1e9}


def _to_float(s: str) -> float:
    return float(s.replace(",", ""))


def extract_currency(text: str, taken: list) -> list:
    out = []
    pre = re.compile(r"(?P<cur>₹|Rs\.?|INR|\$|USD|€|EUR|£|GBP)\s?(?P<amt>\d[\d,]*(?:\.\d+)?)"
                     r"(?:\s?(?P<mult>lakhs?|crores?|million|bn|[kKM])\b)?", re.I)
    post = re.compile(r"(?P<amt>\d[\d,]*(?:\.\d+)?)\s?(?P<cur>rupees|dollars|USD|INR|EUR|GBP)\b", re.I)
    for rx in (pre, post):
        for m in rx.finditer(text):
            if not _free(m.span(), taken):
                continue
            try:
                value = _to_float(m["amt"])
            except ValueError:
                continue
            mult = (m.groupdict().get("mult") or "")
            if mult:
                value *= _MULT.get(mult.lower(), 1)
            taken.append(m.span())
            out.append({"text": m.group(0).strip(), "value": value,
                        "currency": _CURRENCY_CODES.get(m["cur"].lower().rstrip("."), m["cur"].upper()),
                        "span": list(m.span()), "context": _context(text, *m.span())})
    out.sort(key=lambda d: d["span"][0])
    return out


def extract_percentages(text: str, taken: list) -> list:
    out = []
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s?(?:%|percent\b|per\s?cent\b)", text, re.I):
        if _free(m.span(), taken):
            taken.append(m.span())
            out.append({"text": m.group(0), "value": float(m[1]), "span": list(m.span()),
                        "context": _context(text, *m.span())})
    return out


def extract_numbers(text: str, taken: list) -> list:
    out = []
    for m in re.finditer(r"(?<![\w.#])\d[\d,]*(?:\.\d+)?(?![\w])", text):
        if not _free(m.span(), taken):
            continue
        try:
            value = _to_float(m.group(0).rstrip(","))
        except ValueError:
            continue
        out.append({"text": m.group(0), "value": value, "span": list(m.span()),
                    "context": _context(text, *m.span())})
    return out


_PROMO = [
    ("discount", r"\b(?:flat\s+)?\d+(?:\.\d+)?\s?%\s*(?:off|discount)\b"),
    ("discount", r"\bup\s*to\s+\d+(?:\.\d+)?\s?%(?:\s*off)?"),
    ("discount", r"\b(?:save|get|extra|flat)\s+(?:up\s+to\s+)?(?:[₹$€£]|rs\.?)\s?\d[\d,]*(?:\.\d+)?(?:\s*off)?"),
    ("discount", r"\bbuy\s+(?:one|\d+)\s*,?\s*get\s+(?:one|\d+)(?:\s+free)?\b|\bbogo\b"),
    ("discount", r"\b(?:cash\s?back|no[-\s]cost\s+emi)\b"),
    ("offer", r"\bfree\s+(?:shipping|delivery|gift|trial|returns?)\b"),
    ("offer", r"\b(?:exclusive|special|limited)\s+offer\b"),
    ("offer", r"\b(?:mega|flash|big|clearance|spring|summer|winter|festive|season)?\s*sale\b"),
    ("offer", r"\b(?:promo|coupon|discount|voucher)\s+code\b|\buse\s+code\s+[A-Z0-9]{3,}\b"),
    ("urgency", r"\b(?:limited[-\s]time|limited\s+period|today\s+only|last\s+chance|hurry|"
                r"while\s+(?:stocks?|supplies)\s+last|ends\s+(?:soon|today|tonight))\b"),
    ("claim_language", r"\b(?:guaranteed|clinically\s+proven|risk[-\s]free|100\s?%\s+(?:safe|natural|effective)|"
                       r"number\s+one|world'?s\s+best|best\s+in\s+(?:class|india|the\s+world))\b|#\s?1\b|\bno\.?\s?1\b"),
]


def extract_promo_phrases(text: str) -> list:
    out, seen = [], []
    for category, rx in _PROMO:
        for m in re.finditer(rx, text, re.I):
            span = (m.start(), m.end())
            if span in seen:
                continue
            seen.append(span)
            out.append({"text": m.group(0).strip(), "category": category,
                        "span": list(span), "context": _context(text, *span)})
    out.sort(key=lambda d: d["span"][0])
    return out


def extract_entities(text: str) -> dict:
    """Run every extractor over ``text`` and return one JSON-compatible dict."""
    text = text or ""
    dates, taken = extract_dates(text)
    currency = extract_currency(text, taken)
    percentages = extract_percentages(text, taken)
    numbers = extract_numbers(text, taken)
    return {
        "dates": dates,
        "currency": currency,
        "percentages": percentages,
        "numbers": numbers,
        "promo_phrases": extract_promo_phrases(text),
        "note": ("Candidates only. These are NOT policy findings; the rules engine must "
                 "validate them against Policy Cards."),
    }
