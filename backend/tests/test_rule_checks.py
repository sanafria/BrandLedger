"""Unit tests for BrandLedger deterministic rule checks.

Covers all 17 mandatory test specifications from Section 14.A:
1. A prohibited term is detected.
2. The approved replacement is suggested.
3. An allowed term is not incorrectly flagged.
4. Case-insensitive matching works when applicable.
5. A word inside an unrelated word is not incorrectly matched.
6. A valid, unexpired offer is not flagged.
7. An expired offer is flagged when the policy and dates establish expiration.
8. Expiration-date boundary behavior follows the policy.
9. Missing validity information does not produce a false expiration violation.
10. Malformed dates are handled safely.
11. A clearly contradictory numerical claim is detected.
12. An unrelated number is not flagged.
13. An ambiguous numerical comparison is not classified as a definite violation.
14. A claim lacking required evidence is classified as unverified.
15. Missing evidence is not treated as proof of falsity.
16. Empty input is handled predictably.
17. Malformed policy records follow the defined error contract.
"""

import pytest
from backend.app.schemas.finding import FindingCategory, FindingSeverity
from backend.app.schemas.policy import PolicyCard, normalize_policy_card
from backend.app.services.rule_checks import (
    check_terminology,
    check_expired_offers,
    check_factual_accuracy,
    check_unsupported_claims,
)


# ---------------------------------------------------------------------------
# Tests for Rule 1: Terminology
# ---------------------------------------------------------------------------

def test_1_prohibited_term_detected(terminology_policy_card):
    """1. A prohibited term is detected."""
    draft = "Our customers can access their accounts online."
    findings = check_terminology(draft, [terminology_policy_card])
    assert len(findings) == 1
    assert findings[0].matched_text.lower() == "customers"
    assert findings[0].category == FindingCategory.TERMINOLOGY.value
    assert findings[0].policy_card_id == terminology_policy_card.id
    assert findings[0].policy_version == terminology_policy_card.version


def test_2_approved_replacement_suggested(terminology_policy_card):
    """2. The approved replacement is suggested."""
    draft = "Our Customers can access their accounts."
    findings = check_terminology(draft, [terminology_policy_card])
    assert len(findings) == 1
    assert "Members" in findings[0].suggested_fix or "members" in findings[0].suggested_fix.lower()
    assert findings[0].source_quote == "The brand prohibits the term 'Customers' and requires the term 'Members'."


def test_3_allowed_term_not_incorrectly_flagged(terminology_policy_card):
    """3. An allowed term is not incorrectly flagged."""
    draft = "Our members can access their accounts online with 24/7 support."
    findings = check_terminology(draft, [terminology_policy_card])
    assert len(findings) == 0


def test_4_case_insensitive_matching_works(terminology_policy_card):
    """4. Case-insensitive matching works when applicable."""
    draft1 = "All CUSTOMERS receive a monthly statement."
    draft2 = "All customers receive a monthly statement."
    draft3 = "All Customers receive a monthly statement."

    f1 = check_terminology(draft1, [terminology_policy_card])
    f2 = check_terminology(draft2, [terminology_policy_card])
    f3 = check_terminology(draft3, [terminology_policy_card])

    assert len(f1) == 1 and f1[0].matched_text == "CUSTOMERS"
    assert len(f2) == 1 and f2[0].matched_text == "customers"
    assert len(f3) == 1 and f3[0].matched_text == "Customers"


def test_5_word_inside_unrelated_word_not_matched(terminology_policy_card):
    """5. A word inside an unrelated word is not incorrectly matched."""
    # Policy prohibits "Customers", draft has "accustomed" or "customized" or "custom"
    draft = "Our customized portal ensures accustomed users enjoy a seamless experience."
    findings = check_terminology(draft, [terminology_policy_card])
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# Tests for Rule 2: Expired Offers
# ---------------------------------------------------------------------------

def test_6_valid_unexpired_offer_not_flagged(offer_policy_card):
    """6. A valid, unexpired offer is not flagged."""
    draft = "Take advantage of our Summer Discount today!"
    # Offer valid through 2026-06-30; scan on 2026-06-15 is before expiration
    findings = check_expired_offers(draft, [offer_policy_card], "2026-06-15")
    assert len(findings) == 0


def test_7_expired_offer_flagged_when_dates_establish_expiration(offer_policy_card):
    """7. An expired offer is flagged when the policy and dates establish expiration."""
    draft = "Don't miss our Summer Discount promotion!"
    # Scan on 2026-07-01 (one day after 2026-06-30 expiration)
    findings = check_expired_offers(draft, [offer_policy_card], "2026-07-01")
    assert len(findings) == 1
    assert findings[0].category == FindingCategory.EXPIRED_OFFER.value
    assert "Summer Discount" in findings[0].matched_text
    assert "expired on 2026-06-30" in findings[0].explanation
    assert findings[0].confidence == 1.0


def test_8_expiration_date_boundary_behavior(offer_policy_card):
    """8. Expiration-date boundary behavior follows the policy (inclusive of valid_through date)."""
    draft = "Get your Summer Discount right now!"
    # On the exact expiration date 2026-06-30, offer is still valid through end of day
    findings_on_date = check_expired_offers(draft, [offer_policy_card], "2026-06-30")
    assert len(findings_on_date) == 0

    # Day after expiration is expired
    findings_day_after = check_expired_offers(draft, [offer_policy_card], "2026-07-01")
    assert len(findings_day_after) == 1


def test_9_missing_validity_info_does_not_produce_false_expiration():
    """9. Missing validity information does not produce a false expiration violation."""
    card = PolicyCard(
        id="pol_no_date_001",
        version="1.0",
        title="General Promotion Guidelines",
        content="Promotions must follow all brand standard formatting and colors."
    )
    draft = "Check out our special promotion for all new users!"
    findings = check_expired_offers(draft, [card], "2026-08-01")
    assert len(findings) == 0


def test_10_malformed_dates_handled_safely(offer_policy_card):
    """10. Malformed dates are handled safely."""
    draft = "Enjoy our Summer Discount offer!"
    # Malformed scan date
    findings_malformed_scan = check_expired_offers(draft, [offer_policy_card], "invalid-not-a-date")
    assert len(findings_malformed_scan) == 0

    # Policy with malformed date in metadata
    card_bad_date = PolicyCard(
        id="pol_bad_date",
        version="1.0",
        title="Spring Offer",
        content="Spring Offer valid through unknown-date.",
        metadata={"valid_until": "bad-date-format"}
    )
    findings_bad_policy = check_expired_offers(draft, [card_bad_date], "2026-07-01")
    assert len(findings_bad_policy) == 0


# ---------------------------------------------------------------------------
# Tests for Rule 3: Exact Facts and Numbers
# ---------------------------------------------------------------------------

def test_11_clearly_contradictory_numerical_claim_detected(numerical_policy_card):
    """11. A clearly contradictory numerical claim is detected."""
    draft = "Members can earn up to 800 points on every purchase this weekend."
    findings = check_factual_accuracy(draft, [numerical_policy_card])
    assert len(findings) == 1
    f = findings[0]
    assert f.category == FindingCategory.FACTUAL_ACCURACY.value
    assert "800 points" in f.matched_text
    assert "500" in f.explanation
    assert f.policy_card_id == numerical_policy_card.id
    assert f.source_quote == "The maximum reward is 500 points for any individual transaction."


def test_12_unrelated_number_not_flagged(numerical_policy_card):
    """12. An unrelated number is not flagged."""
    # Draft mentions 800 retail stores / 800 locations, completely unrelated to rewards points
    draft = "We now operate 800 store locations across the continental United States."
    findings = check_factual_accuracy(draft, [numerical_policy_card])
    assert len(findings) == 0


def test_13_ambiguous_numerical_comparison_not_classified_as_violation(numerical_policy_card):
    """13. An ambiguous numerical comparison is not classified as a definite violation."""
    # Draft mentions points in an ambiguous distribution context without rewards metric
    draft = "Our logistical routing features 600 delivery distribution points across the network."
    findings = check_factual_accuracy(draft, [numerical_policy_card])
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# Tests for Rule 4: Unsupported Claims
# ---------------------------------------------------------------------------

def test_14_claim_lacking_required_evidence_classified_as_unverified(claims_policy_card):
    """14. A claim lacking required evidence is classified as unverified."""
    draft = "Our service guarantees successful results for every member who enrolls."
    findings = check_unsupported_claims(draft, [claims_policy_card])
    assert len(findings) == 1
    f = findings[0]
    assert f.category == FindingCategory.UNSUPPORTED_CLAIM.value
    assert "guarantees successful results" in f.matched_text.lower()
    assert f.is_verified is False  # Must be distinguished as unverified claim


def test_15_missing_evidence_not_treated_as_proof_of_falsity(claims_policy_card):
    """15. Missing evidence is not treated as proof of falsity."""
    draft = "We provide a 100% satisfaction guarantee to all users."
    findings = check_unsupported_claims(draft, [claims_policy_card])
    assert len(findings) == 1
    f = findings[0]
    # Explanation explicitly confirms unverified status, not false
    assert "unverified (not proven false)" in f.explanation
    # Confidence represents uncertainty (e.g. 0.7), not 1.0 false
    assert 0.0 < f.confidence < 1.0


# ---------------------------------------------------------------------------
# Tests for Edge Cases & Error Contracts
# ---------------------------------------------------------------------------

def test_16_empty_input_handled_predictably(all_sample_policy_cards):
    """16. Empty input is handled predictably."""
    assert check_terminology("", all_sample_policy_cards) == []
    assert check_terminology("   ", all_sample_policy_cards) == []
    assert check_expired_offers("", all_sample_policy_cards, "2026-07-01") == []
    assert check_factual_accuracy("", all_sample_policy_cards) == []
    assert check_unsupported_claims("", all_sample_policy_cards) == []


def test_17_malformed_policy_records_follow_error_contract():
    """17. Malformed policy records follow the defined error contract."""
    # Non-dict policy cards or cards with missing id/version/content
    assert normalize_policy_card({"foo": "bar"}) is None
    assert normalize_policy_card({"id": "p1"}) is None
    assert normalize_policy_card("not a dict") is None

    # Partial card with empty content
    assert normalize_policy_card({"id": "p1", "version": "1.0", "content": ""}) is None
