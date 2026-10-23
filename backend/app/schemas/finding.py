"""Finding schema and category/severity definitions for BrandLedger.

This module defines the validated Pydantic model for findings returned by
the BrandLedger rules engine and evidence verifier.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class FindingCategory(str, Enum):
    """Agreed finding categories."""
    TERMINOLOGY = "terminology"
    EXPIRED_OFFER = "expired_offer"
    FACTUAL_ACCURACY = "factual_accuracy"
    UNSUPPORTED_CLAIM = "unsupported_claim"
    TONE = "tone"


class FindingSeverity(str, Enum):
    """Agreed finding severity levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Finding(BaseModel):
    """Validated, structured finding schema for BrandLedger scan workflow.

    Every finding returned by the policy engine must adhere to this model.
    """
    policy_card_id: str = Field(
        ...,
        description="The unique identifier of the referenced approved policy card."
    )
    policy_version: str = Field(
        ...,
        description="The exact version string of the referenced policy card."
    )
    category: str = Field(
        ...,
        description="Category of the finding (terminology, expired_offer, factual_accuracy, unsupported_claim, tone)."
    )
    severity: str = Field(
        ...,
        description="Severity level (high, medium, low, info)."
    )
    matched_text: str = Field(
        ...,
        description="The exact text snippet matched from the scanned draft."
    )
    source_quote: str = Field(
        ...,
        description="The exact quote from the approved policy text establishing the requirement."
    )
    explanation: str = Field(
        ...,
        description="Detailed explanation of the rule violation or discrepancy."
    )
    suggested_fix: str = Field(
        ...,
        description="Actionable suggested correction or guidance supported by policy."
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0."
    )
    is_verified: Optional[bool] = Field(
        default=True,
        description="Whether the finding has been verified against approved policy evidence."
    )

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError("confidence must be between 0.0 and 1.0")
        return round(float(v), 2)

    @field_validator("policy_card_id", "policy_version", "category", "severity")
    @classmethod
    def validate_non_empty_strings(cls, v: str, info) -> str:
        if not v or not str(v).strip():
            raise ValueError(f"{info.field_name} must not be empty")
        return str(v).strip()

    def to_dict(self) -> dict:
        """Return a JSON-serializable dictionary representation."""
        return self.model_dump()
