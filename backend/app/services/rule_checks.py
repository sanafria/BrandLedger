"""Deterministic Rule Checking Service for BrandLedger.

Implements the four mandatory rule categories:
1. Terminology checks (prohibited terms, word boundaries, case-insensitive, approved replacements)
2. Expired offer checks (reference scan date, date boundaries, offer semantics)
3. Exact facts and numbers (contextual, entity and unit matched numerical contradictions)
4. Unsupported claims (identifying claims requiring evidence without asserting falsity)
"""

import re
from datetime import date, datetime
from typing import Any, Optional
from dateutil import parser as date_parser

from backend.app.schemas.finding import Finding, FindingCategory, FindingSeverity
from backend.app.schemas.policy import PolicyCard


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _normalize_whitespace(text: str) -> str:
    """Normalize internal and surrounding whitespace."""
    return re.sub(r"\s+", " ", text).strip()


def _extract_sentences(text: str) -> list[str]:
    """Split text into individual sentences for fine-grained quote extraction."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


# ---------------------------------------------------------------------------
# Rule 1: Terminology Checks
# ---------------------------------------------------------------------------

def _extract_terminology_rules(card: PolicyCard) -> list[dict[str, str]]:
    """Extract prohibited term rules from policy card structured data or content text."""
    rules: list[dict[str, str]] = []
    seen: set[str] = set()

    for rule in card.rules:
        if isinstance(rule, dict) and rule.get("type") in ("terminology", "term_prohibition"):
            proh = rule.get("prohibited") or rule.get("prohibited_term")
            rep = rule.get("replacement") or rule.get("required_term") or ""
            quote = rule.get("quote") or card.content
            if proh and str(proh).lower() not in seen:
                seen.add(str(proh).lower())
                rules.append({
                    "prohibited": str(proh).strip(),
                    "replacement": str(rep).strip(),
                    "quote": str(quote).strip()
                })

    meta_proh = card.metadata.get("prohibited_terms")
    if isinstance(meta_proh, list):
        for item in meta_proh:
            if isinstance(item, dict):
                p = item.get("prohibited") or item.get("term")
                r = item.get("replacement") or item.get("required") or ""
                q = item.get("quote") or card.content
                if p and str(p).lower() not in seen:
                    seen.add(str(p).lower())
                    rules.append({
                        "prohibited": str(p).strip(),
                        "replacement": str(r).strip(),
                        "quote": str(q).strip()
                    })

    patterns = [
        re.compile(
            r"(?:the brand\s+)?prohibits\s+(?:the term\s+)?['\"“]([^'\"”\n]+)['\"”]\s+and requires\s+(?:the term\s+)?['\"“]([^'\"”\n]+)['\"”]",
            re.IGNORECASE
        ),
        re.compile(
            r"do not use\s+['\"“]([^'\"”\n]+)['\"”],?\s+(?:always\s+)?use\s+['\"“]([^'\"”\n]+)['\"”]",
            re.IGNORECASE
        ),
        re.compile(
            r"use\s+['\"“]([^'\"”\n]+)['\"”]\s+instead of\s+['\"“]([^'\"”\n]+)['\"”]",
            re.IGNORECASE
        ),
        re.compile(
            r"(?:the brand\s+)?prohibits\s+(?:the term\s+)?['\"“]([^'\"”\n]+)['\"”]",
            re.IGNORECASE
        )
    ]

    for sentence in _extract_sentences(card.content):
        m = patterns[0].search(sentence)
        if m:
            p, r = m.group(1).strip(), m.group(2).strip()
            if p.lower() not in seen:
                seen.add(p.lower())
                rules.append({"prohibited": p, "replacement": r, "quote": sentence})
            continue

        m = patterns[1].search(sentence)
        if m:
            p, r = m.group(1).strip(), m.group(2).strip()
            if p.lower() not in seen:
                seen.add(p.lower())
                rules.append({"prohibited": p, "replacement": r, "quote": sentence})
            continue

        m = patterns[2].search(sentence)
        if m:
            p, r = m.group(2).strip(), m.group(1).strip()
            if p.lower() not in seen:
                seen.add(p.lower())
                rules.append({"prohibited": p, "replacement": r, "quote": sentence})
            continue

        m = patterns[3].search(sentence)
        if m and not re.search(r"requires|instead of|use", sentence, re.IGNORECASE):
            p = m.group(1).strip()
            if p.lower() not in seen:
                seen.add(p.lower())
                rules.append({"prohibited": p, "replacement": "", "quote": sentence})

    return rules


def check_terminology(
    content_text: str,
    policy_cards: list[PolicyCard]
) -> list[Finding]:
    """Execute deterministic terminology checks."""
    findings: list[Finding] = []
    seen_matches: set[tuple[str, int]] = set()

    if not content_text or not content_text.strip():
        return findings

    for card in policy_cards:
        rules = _extract_terminology_rules(card)
        for rule in rules:
            prohibited = rule["prohibited"]
            replacement = rule["replacement"]
            source_quote = rule["quote"]

            if not prohibited:
                continue

            pattern = re.compile(rf"\b{re.escape(prohibited)}\b", re.IGNORECASE)

            for match in pattern.finditer(content_text):
                matched_span = (prohibited.lower(), match.start())
                if matched_span in seen_matches:
                    continue
                seen_matches.add(matched_span)

                matched_exact = match.group(0)

                if replacement:
                    if matched_exact.istitle() and not replacement.istitle():
                        suggested_word = replacement.capitalize()
                    elif matched_exact.islower() and not replacement.islower():
                        suggested_word = replacement.lower()
                    else:
                        suggested_word = replacement

                    explanation = (
                        f"The term '{matched_exact}' is prohibited by brand guidelines. "
                        f"Approved terminology requires '{suggested_word}'."
                    )
                    suggested_fix = f"Replace '{matched_exact}' with '{suggested_word}'."
                else:
                    explanation = f"The term '{matched_exact}' is prohibited by brand guidelines."
                    suggested_fix = f"Remove or replace prohibited term '{matched_exact}'."

                findings.append(Finding(
                    policy_card_id=card.id,
                    policy_version=card.version,
                    category=FindingCategory.TERMINOLOGY.value,
                    severity=FindingSeverity.HIGH.value,
                    matched_text=matched_exact,
                    source_quote=source_quote,
                    explanation=explanation,
                    suggested_fix=suggested_fix,
                    confidence=1.0,
                    is_verified=True,
                ))

    return findings


# ---------------------------------------------------------------------------
# Rule 2: Expired Offers
# ---------------------------------------------------------------------------

def _parse_date_safe(date_str: Any) -> Optional[date]:
    """Safely parse a date string or object into a datetime.date instance."""
    if not date_str:
        return None
    if isinstance(date_str, date):
        return date_str
    if isinstance(date_str, datetime):
        return date_str.date()

    date_str_clean = str(date_str).strip()
    if not date_str_clean:
        return None

    try:
        dt = date_parser.parse(date_str_clean, fuzzy=False)
        return dt.date()
    except (ValueError, TypeError, OverflowError):
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"):
            try:
                return datetime.strptime(date_str_clean, fmt).date()
            except ValueError:
                continue
    return None


def _extract_offer_validity(card: PolicyCard) -> list[dict[str, Any]]:
    """Extract offer validity information from policy card without duplicating entries."""
    offers: list[dict[str, Any]] = []
    seen_names: set[str] = set()

    meta = card.metadata
    exp_raw = (
        meta.get("valid_until")
        or meta.get("expires_at")
        or meta.get("expiration_date")
        or meta.get("end_date")
    )
    if exp_raw:
        exp_dt = _parse_date_safe(exp_raw)
        if exp_dt:
            offer_name = str(meta.get("offer_name") or card.title or "").strip()
            quote = str(meta.get("quote") or card.content).strip()
            seen_names.add(offer_name.lower())
            offers.append({
                "offer_name": offer_name,
                "expiration_date": exp_dt,
                "semantics": "inclusive",
                "quote": quote
            })
            return offers

    patterns = [
        re.compile(
            r"([A-Za-z0-9\s%_-]+?)\s+(?:promotion\s+)?(?:is\s+)?valid through\s+([A-Za-z0-9,/\s-]+)",
            re.IGNORECASE
        ),
        re.compile(
            r"([A-Za-z0-9\s%_-]+?)\s+(?:expires|ends)\s+on\s+([A-Za-z0-9,/\s-]+)",
            re.IGNORECASE
        ),
        re.compile(
            r"valid through\s+([A-Za-z0-9,/\s-]+)",
            re.IGNORECASE
        ),
        re.compile(
            r"expires on\s+([A-Za-z0-9,/\s-]+)",
            re.IGNORECASE
        ),
    ]

    for sentence in _extract_sentences(card.content):
        for pattern in patterns:
            m = pattern.search(sentence)
            if m:
                if len(m.groups()) == 2:
                    raw_name = m.group(1).strip()
                    raw_date = m.group(2).strip()
                else:
                    raw_name = card.title or ""
                    raw_date = m.group(1).strip()

                parsed_dt = _parse_date_safe(raw_date)
                if parsed_dt:
                    clean_name = re.sub(
                        r"^(the|an?|this)\s+",
                        "",
                        raw_name,
                        flags=re.IGNORECASE
                    ).strip(".,;:\"' ")
                    resolved_name = clean_name or card.title or "Offer"
                    if resolved_name.lower() not in seen_names:
                        seen_names.add(resolved_name.lower())
                        offers.append({
                            "offer_name": resolved_name,
                            "expiration_date": parsed_dt,
                            "semantics": "inclusive",
                            "quote": sentence
                        })
                    break
        if offers:
            break

    return offers


def check_expired_offers(
    content_text: str,
    policy_cards: list[PolicyCard],
    scan_date_str: str
) -> list[Finding]:
    """Execute deterministic offer expiration checks against explicitly supplied scan_date."""
    findings: list[Finding] = []
    seen_offers: set[tuple[str, str]] = set()

    if not content_text or not content_text.strip():
        return findings

    ref_date = _parse_date_safe(scan_date_str)
    if not ref_date:
        return findings

    for card in policy_cards:
        offers = _extract_offer_validity(card)
        for offer in offers:
            offer_name = offer["offer_name"]
            exp_date = offer["expiration_date"]
            source_quote = offer["quote"]

            matched_text = None
            if offer_name and len(offer_name) >= 3:
                pattern = re.compile(rf"\b{re.escape(offer_name)}\b", re.IGNORECASE)
                m = pattern.search(content_text)
                if m:
                    matched_text = m.group(0)
            elif card.title and len(card.title) >= 3:
                pattern = re.compile(rf"\b{re.escape(card.title)}\b", re.IGNORECASE)
                m = pattern.search(content_text)
                if m:
                    matched_text = m.group(0)

            if not matched_text:
                continue

            offer_key = (card.id, matched_text.lower())
            if offer_key in seen_offers:
                continue

            if ref_date > exp_date:
                seen_offers.add(offer_key)
                exp_fmt = exp_date.isoformat()
                ref_fmt = ref_date.isoformat()
                explanation = (
                    f"Offer '{matched_text}' expired on {exp_fmt} according to policy evidence. "
                    f"It cannot be promoted on scan date {ref_fmt}."
                )
                suggested_fix = (
                    f"Remove reference to expired offer '{matched_text}' or update with an active offer."
                )
                findings.append(Finding(
                    policy_card_id=card.id,
                    policy_version=card.version,
                    category=FindingCategory.EXPIRED_OFFER.value,
                    severity=FindingSeverity.HIGH.value,
                    matched_text=matched_text,
                    source_quote=source_quote,
                    explanation=explanation,
                    suggested_fix=suggested_fix,
                    confidence=1.0,
                    is_verified=True,
                ))

    return findings


# ---------------------------------------------------------------------------
# Rule 3: Exact Facts and Numbers
# ---------------------------------------------------------------------------

REWARD_EARN_WORDS = {"reward", "rewards", "earn", "earning", "points", "bonus", "cashback", "credit"}
LOGISTICS_EXCLUDE_WORDS = {"distribution", "delivery", "shipping", "routing", "locations", "stores"}


def _extract_numerical_facts(card: PolicyCard) -> list[dict[str, Any]]:
    """Extract verifiable numerical facts with explicit metric, value, unit, and condition."""
    facts: list[dict[str, Any]] = []
    seen: set[tuple[str, float, str]] = set()

    for rule in card.rules:
        if isinstance(rule, dict) and rule.get("type") in ("numerical", "factual_limit", "fact"):
            metric = rule.get("metric")
            val = rule.get("value")
            unit = rule.get("unit") or ""
            limit_type = rule.get("limit_type") or "max"
            quote = rule.get("quote") or card.content
            if metric and val is not None:
                key = (str(metric).lower().strip(), float(val), str(unit).lower().strip())
                if key not in seen:
                    seen.add(key)
                    facts.append({
                        "metric": key[0],
                        "value": key[1],
                        "unit": key[2],
                        "limit_type": str(limit_type).lower().strip(),
                        "quote": str(quote).strip()
                    })

    if facts:
        return facts  # If structured facts exist, do not duplicate from text patterns

    patterns = [
        re.compile(
            r"(?:the\s+)?(maximum|minimum|standard|fixed)\s+([a-zA-Z\s]{3,25}?)\s+is\s+(\$?\d+(?:\.\d+)?)\s*([a-zA-Z%]+)?",
            re.IGNORECASE
        ),
        re.compile(
            r"([a-zA-Z\s]{3,25}?)\s+(?:cannot exceed|is capped at|up to)\s+(\$?\d+(?:\.\d+)?)\s*([a-zA-Z%]+)?",
            re.IGNORECASE
        ),
    ]

    for sentence in _extract_sentences(card.content):
        m = patterns[0].search(sentence)
        if m:
            limit_type = m.group(1).lower().strip()
            metric = m.group(2).lower().strip()
            raw_val = m.group(3).replace("$", "").strip()
            unit = (m.group(4) or ("$" if "$" in m.group(3) else "")).lower().strip()
            try:
                key = (metric, float(raw_val), unit)
                if key not in seen:
                    seen.add(key)
                    facts.append({
                        "metric": metric,
                        "value": key[1],
                        "unit": unit,
                        "limit_type": "max" if limit_type in ("maximum", "up to") else "exact",
                        "quote": sentence
                    })
            except ValueError:
                pass
            continue

        m = patterns[1].search(sentence)
        if m:
            metric = m.group(1).lower().strip()
            raw_val = m.group(2).replace("$", "").strip()
            unit = (m.group(3) or ("$" if "$" in m.group(2) else "")).lower().strip()
            try:
                key = (metric, float(raw_val), unit)
                if key not in seen:
                    seen.add(key)
                    facts.append({
                        "metric": metric,
                        "value": key[1],
                        "unit": unit,
                        "limit_type": "max",
                        "quote": sentence
                    })
            except ValueError:
                pass

    return facts


def check_factual_accuracy(
    content_text: str,
    policy_cards: list[PolicyCard]
) -> list[Finding]:
    """Execute deterministic numerical and factual checks."""
    findings: list[Finding] = []
    seen_matches: set[tuple[str, str, int]] = set()

    if not content_text or not content_text.strip():
        return findings

    for card in policy_cards:
        facts = _extract_numerical_facts(card)
        for fact in facts:
            metric = fact["metric"]
            policy_val = fact["value"]
            unit = fact["unit"]
            limit_type = fact["limit_type"]
            source_quote = fact["quote"]

            is_reward_metric = any(w in metric for w in ("reward", "point", "bonus", "cashback"))

            for sentence in _extract_sentences(content_text):
                sent_lower = sentence.lower()

                if is_reward_metric and any(ex in sent_lower for ex in LOGISTICS_EXCLUDE_WORDS):
                    continue

                metric_words = [w for w in metric.split() if len(w) > 3]
                metric_matched = any(
                    re.search(rf"\b{re.escape(w)}\b", sentence, re.IGNORECASE)
                    for w in metric_words
                )
                if not metric_matched and is_reward_metric:
                    metric_matched = any(
                        re.search(rf"\b{re.escape(w)}\b", sentence, re.IGNORECASE)
                        for w in ("earn", "earns", "earned", "reward", "rewards")
                    )

                if not metric_matched:
                    continue

                num_pattern = re.compile(
                    rf"(?:(up to|earn up to|maximum of|receive)\s+)?(\$?\d+(?:\.\d+)?)\s*({re.escape(unit) if unit else '[a-zA-Z%]+'})?\b",
                    re.IGNORECASE
                )

                for num_match in num_pattern.finditer(sentence):
                    raw_num = num_match.group(2).replace("$", "").strip()
                    matched_unit = (num_match.group(3) or ("$" if "$" in num_match.group(2) else "")).lower().strip()

                    if unit and matched_unit != unit:
                        continue

                    try:
                        draft_val = float(raw_num)
                    except ValueError:
                        continue

                    matched_snippet = num_match.group(0).strip()
                    match_key = (card.id, matched_snippet.lower(), num_match.start())
                    if match_key in seen_matches:
                        continue

                    is_contradiction = False
                    if limit_type == "max":
                        if draft_val > policy_val:
                            is_contradiction = True
                    elif limit_type in ("exact", "standard"):
                        if abs(draft_val - policy_val) > 1e-4:
                            is_contradiction = True

                    if is_contradiction:
                        seen_matches.add(match_key)
                        val_display = int(policy_val) if policy_val.is_integer() else policy_val
                        draft_display = int(draft_val) if draft_val.is_integer() else draft_val
                        unit_str = f" {unit}" if unit and unit != "%" else (unit or "")

                        explanation = (
                            f"Draft claims '{matched_snippet}' ({draft_display}{unit_str}), which contradicts "
                            f"the approved policy {fact['limit_type']} of {val_display}{unit_str} for {metric}."
                        )
                        suggested_fix = (
                            f"Update claim to comply with approved policy: maximum {val_display}{unit_str}."
                        )

                        findings.append(Finding(
                            policy_card_id=card.id,
                            policy_version=card.version,
                            category=FindingCategory.FACTUAL_ACCURACY.value,
                            severity=FindingSeverity.HIGH.value,
                            matched_text=matched_snippet,
                            source_quote=source_quote,
                            explanation=explanation,
                            suggested_fix=suggested_fix,
                            confidence=0.95,
                            is_verified=True,
                        ))

    return findings


# ---------------------------------------------------------------------------
# Rule 4: Unsupported Claims
# ---------------------------------------------------------------------------

def _extract_unsupported_claim_rules(card: PolicyCard) -> list[dict[str, Any]]:
    """Extract policy requirements for claim substantiation."""
    rules: list[dict[str, Any]] = []

    for rule in card.rules:
        if isinstance(rule, dict) and (
            rule.get("requires_evidence") is True
            or rule.get("type") in ("claim_verification", "claims", "unsupported_claims")
        ):
            quote = rule.get("quote") or card.content
            rules.append({
                "quote": str(quote).strip(),
                "requirement": "substantiation_required"
            })

    if rules:
        return rules

    for sentence in _extract_sentences(card.content):
        if re.search(r"(?:guarantee|claim|promise|statement)s?.*require(?:s)?.*(?:evidence|substantiation|documentation)", sentence, re.IGNORECASE):
            rules.append({
                "quote": sentence,
                "requirement": "substantiation_required"
            })
            break

    return rules


CLAIM_TRIGGERS = [
    r"guarantees?\s+(?:successful\s+)?results?(?:\s+for\s+every\s+member)?",
    r"guaranteed\s+(?:results|profit|satisfaction|success|returns)",
    r"100%\s+satisfaction\s+guarantee",
    r"#1\s+(?:rated|brand|service|provider)",
    r"world['’]s\s+best",
    r"clinically\s+proven",
    r"guarantees\s+success",
]


def check_unsupported_claims(
    content_text: str,
    policy_cards: list[PolicyCard]
) -> list[Finding]:
    """Execute unsupported claim checks."""
    findings: list[Finding] = []

    if not content_text or not content_text.strip():
        return findings

    applicable_substantiation_policies: list[tuple[PolicyCard, str]] = []
    for card in policy_cards:
        rules = _extract_unsupported_claim_rules(card)
        for r in rules:
            applicable_substantiation_policies.append((card, r["quote"]))

    if not applicable_substantiation_policies:
        return findings

    combined_trigger = re.compile(
        r"\b(" + "|".join(CLAIM_TRIGGERS) + r")\b",
        re.IGNORECASE
    )

    for match in combined_trigger.finditer(content_text):
        matched_claim = match.group(0)
        policy_card, source_quote = applicable_substantiation_policies[0]

        explanation = (
            f"The draft asserts an absolute guarantee or superlative claim ('{matched_claim}') "
            f"which requires approved substantiation under brand policy. "
            f"No qualifying evidence or approved substantiation was provided in the policy library. "
            f"This claim is unverified (not proven false)."
        )
        suggested_fix = (
            f"Provide approved legal substantiation for '{matched_claim}' or soften the claim "
            f"with appropriate qualification (e.g., 'results may vary')."
        )

        findings.append(Finding(
            policy_card_id=policy_card.id,
            policy_version=policy_card.version,
            category=FindingCategory.UNSUPPORTED_CLAIM.value,
            severity=FindingSeverity.MEDIUM.value,
            matched_text=matched_claim,
            source_quote=source_quote,
            explanation=explanation,
            suggested_fix=suggested_fix,
            confidence=0.70,
            is_verified=False,
        ))

    return findings
