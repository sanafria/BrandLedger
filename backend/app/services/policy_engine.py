"""Policy Engine Orchestrator for BrandLedger.

Exposes the mandatory public scan_draft entry point:
def scan_draft(
    content_text: str,
    policy_cards: list[dict],
    scan_date: str
) -> list[dict]:
    ...
"""

import logging
from typing import Any
from backend.app.schemas.finding import Finding
from backend.app.schemas.policy import PolicyCard, normalize_policy_card
from backend.app.services.rule_checks import (
    check_terminology,
    check_expired_offers,
    check_factual_accuracy,
    check_unsupported_claims,
    _parse_date_safe,
)
from backend.app.services.evidence_verifier import filter_and_verify_findings
from backend.app.services.ai_checks import run_optional_ai_checks

logger = logging.getLogger(__name__)


def scan_draft(
    content_text: str,
    policy_cards: list[dict],
    scan_date: str
) -> list[dict]:
    """Scan a draft text against approved policy cards and a reference scan date.

    Public service function contract:
    - content_text: The marketing or draft text to be scanned.
    - policy_cards: List of approved policy card dictionaries.
    - scan_date: Explicit reference scan date string (e.g. 'YYYY-MM-DD').

    Returns:
        List of validated, JSON-serializable finding dictionaries.
    """
    # 1. Validate input arguments
    if not isinstance(content_text, str) or not content_text.strip():
        logger.debug("Empty or non-string content_text provided to scan_draft.")
        return []

    if not isinstance(policy_cards, list) or not policy_cards:
        logger.debug("Empty or invalid policy_cards provided to scan_draft.")
        return []

    # 2. Validate scan_date format safely
    if not scan_date or not str(scan_date).strip():
        raise ValueError("scan_date must be a non-empty string.")

    parsed_scan_date = _parse_date_safe(scan_date)
    if parsed_scan_date is None:
        raise ValueError(
            f"Invalid scan_date format: '{scan_date}'. Expected parseable date (e.g., YYYY-MM-DD)."
        )

    scan_date_norm = parsed_scan_date.isoformat()

    # 3. Safely normalize and isolate valid policy cards
    valid_cards: list[PolicyCard] = []
    for idx, raw_card in enumerate(policy_cards):
        if not isinstance(raw_card, dict):
            logger.warning("Skipping non-dict policy card at index %d", idx)
            continue
        normalized = normalize_policy_card(raw_card)
        if normalized:
            valid_cards.append(normalized)
        else:
            logger.warning("Skipping malformed policy card at index %d: %s", idx, raw_card)

    if not valid_cards:
        logger.debug("No valid policy cards after normalization.")
        return []

    raw_findings: list[Finding] = []

    # 4. Deterministic Rule Checks
    # Rule 1: Terminology
    term_findings = check_terminology(content_text, valid_cards)
    raw_findings.extend(term_findings)

    # Rule 2: Expired Offers (respecting supplied scan_date)
    exp_findings = check_expired_offers(content_text, valid_cards, scan_date_norm)
    raw_findings.extend(exp_findings)

    # Rule 3: Exact facts and numerical checks
    fact_findings = check_factual_accuracy(content_text, valid_cards)
    raw_findings.extend(fact_findings)

    # Rule 4: Unsupported claims (flagging unverified assertions without falsely labeling them false)
    claim_findings = check_unsupported_claims(content_text, valid_cards)
    raw_findings.extend(claim_findings)

    # 5. Optional AI Analysis (isolated, only if configured)
    ai_findings = run_optional_ai_checks(content_text, valid_cards)
    if ai_findings:
        raw_findings.extend(ai_findings)

    # 6. Deduplicate overlapping findings
    # Priority is given to earlier deterministic findings over later/AI findings
    deduped_findings: list[Finding] = []
    seen_keys: set[tuple[str, str, str]] = set()

    for f in raw_findings:
        key = (f.category, f.matched_text.lower(), f.policy_card_id)
        if key not in seen_keys:
            seen_keys.add(key)
            deduped_findings.append(f)

    # 7. Evidence Verification against approved policy cards
    verified_findings = filter_and_verify_findings(deduped_findings, valid_cards)

    # 8. Pydantic Validation & JSON serialization
    results: list[dict[str, Any]] = []
    for vf in verified_findings:
        # Re-validate against Pydantic model to guarantee contract integrity
        validated = Finding.model_validate(vf)
        results.append(validated.model_dump())

    return results
