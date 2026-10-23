"""Shared pytest fixtures for BrandLedger rules engine and evidence verifier."""

import pytest
from backend.app.schemas.policy import PolicyCard, normalize_policy_card


@pytest.fixture
def terminology_policy_dict() -> dict:
    """Fixture for approved terminology policy card dictionary."""
    return {
        "id": "pol_term_001",
        "version": "1.0",
        "title": "Brand Terminology Policy",
        "category": "terminology",
        "content": "The brand prohibits the term 'Customers' and requires the term 'Members'. Always refer to account holders as members.",
        "rules": [
            {
                "type": "terminology",
                "prohibited": "Customers",
                "replacement": "Members",
                "quote": "The brand prohibits the term 'Customers' and requires the term 'Members'."
            }
        ],
        "metadata": {"prohibited_terms": [{"term": "Customers", "replacement": "Members"}]}
    }


@pytest.fixture
def terminology_policy_card(terminology_policy_dict) -> PolicyCard:
    return normalize_policy_card(terminology_policy_dict)


@pytest.fixture
def offer_policy_dict() -> dict:
    """Fixture for approved offer validity policy card dictionary."""
    return {
        "id": "pol_offer_002",
        "version": "2.1",
        "title": "Summer Discount Promotion",
        "category": "offer_validity",
        "content": "Summer Discount promotion is valid through 2026-06-30. After this date, standard pricing applies.",
        "metadata": {
            "offer_name": "Summer Discount",
            "valid_until": "2026-06-30",
            "quote": "Summer Discount promotion is valid through 2026-06-30."
        }
    }


@pytest.fixture
def offer_policy_card(offer_policy_dict) -> PolicyCard:
    return normalize_policy_card(offer_policy_dict)


@pytest.fixture
def numerical_policy_dict() -> dict:
    """Fixture for approved numerical limit policy card dictionary."""
    return {
        "id": "pol_num_003",
        "version": "1.5",
        "title": "Rewards Program Limits",
        "category": "rewards",
        "content": "The maximum reward is 500 points for any individual transaction. Points cannot be transferred.",
        "rules": [
            {
                "type": "numerical",
                "metric": "reward",
                "value": 500,
                "unit": "points",
                "limit_type": "max",
                "quote": "The maximum reward is 500 points for any individual transaction."
            }
        ]
    }


@pytest.fixture
def numerical_policy_card(numerical_policy_dict) -> PolicyCard:
    return normalize_policy_card(numerical_policy_dict)


@pytest.fixture
def claims_policy_dict() -> dict:
    """Fixture for approved claim substantiation policy card dictionary."""
    return {
        "id": "pol_claim_004",
        "version": "3.0",
        "title": "Marketing Claim Substantiation",
        "category": "claims",
        "content": "All performance guarantees and promises of guaranteed results require prior approved evidence from legal compliance.",
        "rules": [
            {
                "type": "claim_verification",
                "requires_evidence": True,
                "quote": "All performance guarantees and promises of guaranteed results require prior approved evidence from legal compliance."
            }
        ]
    }


@pytest.fixture
def claims_policy_card(claims_policy_dict) -> PolicyCard:
    return normalize_policy_card(claims_policy_dict)


@pytest.fixture
def all_sample_policy_dicts(
    terminology_policy_dict,
    offer_policy_dict,
    numerical_policy_dict,
    claims_policy_dict
) -> list[dict]:
    return [
        terminology_policy_dict,
        offer_policy_dict,
        numerical_policy_dict,
        claims_policy_dict
    ]


@pytest.fixture
def all_sample_policy_cards(
    terminology_policy_card,
    offer_policy_card,
    numerical_policy_card,
    claims_policy_card
) -> list[PolicyCard]:
    return [
        terminology_policy_card,
        offer_policy_card,
        numerical_policy_card,
        claims_policy_card
    ]
