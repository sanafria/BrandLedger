"""Integration tests for BrandLedger policy engine (scan_draft).

Verifies Section 14.C specifications:
1. scan_draft uses the exact required signature (content_text, policy_cards, scan_date).
2. The return value is a list of dictionaries.
3. Returned findings conform to the agreed Pydantic schema.
4. Evidence-backed findings refer to actual policy records and versions.
5. Unsupported claims remain distinguishable from proven falsehoods.
6. The engine works without an LLM API key.
7. An AI failure does not erase deterministic findings.
8. Duplicate findings are handled consistently and deduplicated.
9. Output is completely JSON serializable.
"""

import json
from unittest.mock import patch
import pytest

from backend.app.services.policy_engine import scan_draft
from backend.app.schemas.finding import Finding


def test_scan_draft_signature_and_return_types(all_sample_policy_dicts):
    """Verify scan_draft signature, return type, and JSON serializability."""
    draft = "Our customers can earn up to 800 points and enjoy Summer Discount!"
    scan_date = "2026-07-01"

    # Call with exact required signature
    result = scan_draft(
        content_text=draft,
        policy_cards=all_sample_policy_dicts,
        scan_date=scan_date
    )

    # 1. Must return a list
    assert isinstance(result, list)
    assert len(result) > 0

    # 2. Every item must be a dictionary
    for item in result:
        assert isinstance(item, dict)
        # 3. Must strictly validate under Finding Pydantic schema
        finding = Finding(**item)
        assert finding.policy_card_id in ("pol_term_001", "pol_offer_002", "pol_num_003", "pol_claim_004")
        assert 0.0 <= finding.confidence <= 1.0

    # 4. Must be JSON serializable
    json_str = json.dumps(result)
    assert len(json_str) > 0


def test_scan_draft_detects_multiple_rules_and_preserves_versions(all_sample_policy_dicts):
    """Verify all deterministic rules run together and preserve card IDs and versions."""
    draft = (
        "Our customers can earn up to 800 points with our Summer Discount promotion. "
        "Our service guarantees successful results for every member."
    )
    scan_date = "2026-07-01"

    results = scan_draft(draft, all_sample_policy_dicts, scan_date)

    categories = {r["category"] for r in results}
    assert "terminology" in categories
    assert "expired_offer" in categories
    assert "factual_accuracy" in categories
    assert "unsupported_claim" in categories

    for r in results:
        if r["category"] == "terminology":
            assert r["policy_card_id"] == "pol_term_001"
            assert r["policy_version"] == "1.0"
        elif r["category"] == "expired_offer":
            assert r["policy_card_id"] == "pol_offer_002"
            assert r["policy_version"] == "2.1"
        elif r["category"] == "factual_accuracy":
            assert r["policy_card_id"] == "pol_num_003"
            assert r["policy_version"] == "1.5"
        elif r["category"] == "unsupported_claim":
            assert r["policy_card_id"] == "pol_claim_004"
            assert r["policy_version"] == "3.0"
            # Unsupported claim must remain distinguishable from proven falsehood
            assert r["is_verified"] is False
            assert "unverified (not proven false)" in r["explanation"]


def test_scan_draft_works_without_llm_api_key(all_sample_policy_dicts, monkeypatch):
    """Verify engine functions completely when no LLM API key is present."""
    monkeypatch.delenv("BRANDLEDGER_LLM_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    draft = "Our customers can access accounts."
    results = scan_draft(draft, all_sample_policy_dicts, "2026-06-01")

    assert len(results) == 1
    assert results[0]["category"] == "terminology"


def test_ai_failure_does_not_erase_deterministic_findings(all_sample_policy_dicts, monkeypatch):
    """Verify network error or AI failure does not discard deterministic findings."""
    monkeypatch.setenv("BRANDLEDGER_LLM_API_KEY", "mock-test-key")

    with patch("backend.app.services.ai_checks.httpx.Client") as mock_client:
        # Simulate network failure on LLM provider
        mock_instance = mock_client.return_value.__enter__.return_value
        mock_instance.post.side_effect = RuntimeError("Simulated LLM network timeout")

        draft = "Our customers can earn up to 800 points."
        results = scan_draft(draft, all_sample_policy_dicts, "2026-06-01")

        # Deterministic findings must remain fully intact
        assert len(results) >= 2
        categories = {r["category"] for r in results}
        assert "terminology" in categories
        assert "factual_accuracy" in categories


def test_scan_draft_deduplicates_findings(all_sample_policy_dicts):
    """Verify duplicate findings are handled consistently without repetition."""
    draft = "Our customers are great. All customers should know."
    results = scan_draft(draft, all_sample_policy_dicts, "2026-06-01")

    # Both occurrences of customers are consolidated or deduplicated
    assert len(results) == 1
    assert results[0]["category"] == "terminology"


def test_scan_draft_handles_invalid_date_gracefully(all_sample_policy_dicts):
    """Verify invalid scan date triggers ValueError according to contract."""
    with pytest.raises(ValueError, match="Invalid scan_date format"):
        scan_draft("Some draft text", all_sample_policy_dicts, "not-a-valid-date")

    with pytest.raises(ValueError, match="scan_date must be a non-empty string"):
        scan_draft("Some draft text", all_sample_policy_dicts, "")


def test_scan_draft_handles_empty_inputs(all_sample_policy_dicts):
    """Verify empty draft or empty policy list returns empty list."""
    assert scan_draft("", all_sample_policy_dicts, "2026-06-01") == []
    assert scan_draft("   ", all_sample_policy_dicts, "2026-06-01") == []
    assert scan_draft("Some valid text", [], "2026-06-01") == []
