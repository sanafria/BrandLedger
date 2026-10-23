"""Unit tests for BrandLedger Evidence Verification Service.

Covers all 12 mandatory evidence verification specifications from Section 14.B:
1. A valid source quotation is accepted.
2. A fabricated quotation is rejected.
3. A quote from the wrong policy card is rejected.
4. A quote from the wrong policy version is rejected.
5. A nonexistent policy ID is rejected.
6. A missing quotation is not treated as verified evidence.
7. A modified quotation cannot falsely pass verification.
8. The correct policy ID and version are preserved.
9. A failed evidence check cannot leave a finding marked as verified.
10. An AI-generated citation to a nonexistent policy is rejected.
11. A valid quote that does not support the claimed rule is not accepted as sufficient evidence.
12. Missing policy content is handled safely.
"""

import pytest
from backend.app.schemas.finding import Finding, FindingCategory, FindingSeverity
from backend.app.schemas.policy import PolicyCard
from backend.app.services.evidence_verifier import (
    verify_finding,
    verify_source_quotation,
    verify_policy_card_and_version,
    filter_and_verify_findings,
)


def _make_candidate_finding(
    policy_card_id: str = "pol_term_001",
    policy_version: str = "1.0",
    category: str = FindingCategory.TERMINOLOGY.value,
    severity: str = FindingSeverity.HIGH.value,
    matched_text: str = "customers",
    source_quote: str = "The brand prohibits the term 'Customers' and requires the term 'Members'.",
    explanation: str = "Prohibited term 'customers' detected.",
    suggested_fix: str = "Replace with 'Members'.",
    confidence: float = 1.0,
    is_verified: bool = True,
) -> Finding:
    """Helper to construct candidate findings for verification tests."""
    return Finding(
        policy_card_id=policy_card_id,
        policy_version=policy_version,
        category=category,
        severity=severity,
        matched_text=matched_text,
        source_quote=source_quote,
        explanation=explanation,
        suggested_fix=suggested_fix,
        confidence=confidence,
        is_verified=is_verified,
    )


# ---------------------------------------------------------------------------
# Test 1: Valid source quotation is accepted
# ---------------------------------------------------------------------------

def test_1_valid_source_quotation_accepted(terminology_policy_card):
    """1. A valid source quotation is accepted."""
    finding = _make_candidate_finding(
        policy_card_id=terminology_policy_card.id,
        policy_version=terminology_policy_card.version,
        source_quote="The brand prohibits the term 'Customers' and requires the term 'Members'."
    )
    cards_by_id = {terminology_policy_card.id: terminology_policy_card}
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is True
    assert err is None


# ---------------------------------------------------------------------------
# Test 2: Fabricated quotation is rejected
# ---------------------------------------------------------------------------

def test_2_fabricated_quotation_rejected(terminology_policy_card):
    """2. A fabricated quotation is rejected."""
    finding = _make_candidate_finding(
        policy_card_id=terminology_policy_card.id,
        policy_version=terminology_policy_card.version,
        source_quote="Fabricated text that does not exist anywhere in the policy card content."
    )
    cards_by_id = {terminology_policy_card.id: terminology_policy_card}
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "was not found in approved policy card" in err


# ---------------------------------------------------------------------------
# Test 3: Quote from wrong policy card is rejected
# ---------------------------------------------------------------------------

def test_3_quote_from_wrong_policy_card_rejected(terminology_policy_card, numerical_policy_card):
    """3. A quote from the wrong policy card is rejected."""
    # Finding claims card is terminology_policy_card, but quotes numerical_policy_card
    finding = _make_candidate_finding(
        policy_card_id=terminology_policy_card.id,
        policy_version=terminology_policy_card.version,
        source_quote="The maximum reward is 500 points for any individual transaction."
    )
    cards_by_id = {
        terminology_policy_card.id: terminology_policy_card,
        numerical_policy_card.id: numerical_policy_card
    }
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "was not found in approved policy card" in err


# ---------------------------------------------------------------------------
# Test 4: Quote from wrong policy version is rejected
# ---------------------------------------------------------------------------

def test_4_quote_from_wrong_policy_version_rejected(terminology_policy_card):
    """4. A quote from the wrong policy version is rejected."""
    # Actual version is 1.0, finding cites 2.0
    finding = _make_candidate_finding(
        policy_card_id=terminology_policy_card.id,
        policy_version="2.0",
        source_quote="The brand prohibits the term 'Customers' and requires the term 'Members'."
    )
    cards_by_id = {terminology_policy_card.id: terminology_policy_card}
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "Policy version mismatch" in err


# ---------------------------------------------------------------------------
# Test 5: Nonexistent policy ID is rejected
# ---------------------------------------------------------------------------

def test_5_nonexistent_policy_id_rejected(terminology_policy_card):
    """5. A nonexistent policy ID is rejected."""
    finding = _make_candidate_finding(
        policy_card_id="pol_nonexistent_999",
        policy_version="1.0",
        source_quote="The brand prohibits the term 'Customers' and requires the term 'Members'."
    )
    cards_by_id = {terminology_policy_card.id: terminology_policy_card}
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "does not exist in approved policy library" in err


# ---------------------------------------------------------------------------
# Test 6: Missing quotation is not treated as verified evidence
# ---------------------------------------------------------------------------

def test_6_missing_quotation_not_treated_as_verified(terminology_policy_card):
    """6. A missing quotation is not treated as verified evidence."""
    is_valid, err = verify_source_quotation("", terminology_policy_card)
    assert is_valid is False
    assert "Source quotation is missing or empty" in err

    is_valid_space, err_space = verify_source_quotation("   ", terminology_policy_card)
    assert is_valid_space is False


# ---------------------------------------------------------------------------
# Test 7: Modified quotation cannot falsely pass verification
# ---------------------------------------------------------------------------

def test_7_modified_quotation_cannot_falsely_pass(terminology_policy_card):
    """7. A modified quotation cannot falsely pass verification."""
    # Original: "The brand prohibits the term 'Customers' and requires the term 'Members'."
    # Tampered quote altering meaning
    tampered_quote = "The brand permits the term 'Customers' and prohibits the term 'Members'."
    cards_by_id = {terminology_policy_card.id: terminology_policy_card}
    finding = _make_candidate_finding(
        policy_card_id=terminology_policy_card.id,
        policy_version=terminology_policy_card.version,
        source_quote=tampered_quote
    )
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "was not found in approved policy card" in err


# ---------------------------------------------------------------------------
# Test 8: Correct policy ID and version are preserved
# ---------------------------------------------------------------------------

def test_8_correct_policy_id_and_version_preserved(offer_policy_card):
    """8. The correct policy ID and version are preserved."""
    finding = _make_candidate_finding(
        policy_card_id=offer_policy_card.id,
        policy_version=offer_policy_card.version,
        category=FindingCategory.EXPIRED_OFFER.value,
        matched_text="Summer Discount",
        source_quote="Summer Discount promotion is valid through 2026-06-30."
    )
    verified = filter_and_verify_findings([finding], [offer_policy_card])
    assert len(verified) == 1
    assert verified[0].policy_card_id == "pol_offer_002"
    assert verified[0].policy_version == "2.1"


# ---------------------------------------------------------------------------
# Test 9: Failed evidence check cannot leave finding marked as verified
# ---------------------------------------------------------------------------

def test_9_failed_evidence_check_cannot_leave_finding_verified(terminology_policy_card):
    """9. A failed evidence check cannot leave a finding marked as verified."""
    fake_finding = _make_candidate_finding(
        policy_card_id=terminology_policy_card.id,
        policy_version=terminology_policy_card.version,
        source_quote="Completely fabricated quote.",
        is_verified=True,
    )
    # filter_and_verify_findings must reject fabricated evidence findings entirely
    result = filter_and_verify_findings([fake_finding], [terminology_policy_card])
    assert len(result) == 0


# ---------------------------------------------------------------------------
# Test 10: AI-generated citation to nonexistent policy is rejected
# ---------------------------------------------------------------------------

def test_10_ai_citation_to_nonexistent_policy_rejected(terminology_policy_card):
    """10. An AI-generated citation to a nonexistent policy is rejected."""
    ai_hallucinated_finding = _make_candidate_finding(
        policy_card_id="pol_ai_hallucination_007",
        policy_version="1.0",
        category=FindingCategory.TONE.value,
        matched_text="Act now before time runs out!",
        source_quote="Brand voice requires calm and non-urgent language.",
        explanation="Urgent sales language violates tone policy.",
        confidence=0.85
    )
    cards_by_id = {terminology_policy_card.id: terminology_policy_card}
    is_valid, err = verify_finding(ai_hallucinated_finding, cards_by_id)
    assert is_valid is False
    assert "does not exist in approved policy library" in err


# ---------------------------------------------------------------------------
# Test 11: Valid quote that does not support claimed rule is not accepted
# ---------------------------------------------------------------------------

def test_11_valid_quote_not_supporting_rule_rejected(numerical_policy_card):
    """11. A valid quote that does not support the claimed rule is not accepted as sufficient evidence."""
    # Quoting "Points cannot be transferred." to support a numerical reward limit violation
    finding = _make_candidate_finding(
        policy_card_id=numerical_policy_card.id,
        policy_version=numerical_policy_card.version,
        category=FindingCategory.FACTUAL_ACCURACY.value,
        matched_text="800 points",
        source_quote="Points cannot be transferred."
    )
    cards_by_id = {numerical_policy_card.id: numerical_policy_card}
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "does not contain approved numerical facts or limits" in err


# ---------------------------------------------------------------------------
# Test 12: Missing policy content is handled safely
# ---------------------------------------------------------------------------

def test_12_missing_policy_content_handled_safely():
    """12. Missing policy content is handled safely."""
    empty_card = PolicyCard(
        id="pol_empty_001",
        version="1.0",
        title="Empty Card",
        content=""
    )
    cards_by_id = {"pol_empty_001": empty_card}
    finding = _make_candidate_finding(
        policy_card_id="pol_empty_001",
        policy_version="1.0",
        source_quote="Some quote."
    )
    is_valid, err = verify_finding(finding, cards_by_id)
    assert is_valid is False
    assert "has no content" in err
