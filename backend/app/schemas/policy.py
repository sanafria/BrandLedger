"""Policy card schema and helper normalization functions for BrandLedger.

Supports robust extraction from various policy card representations
produced by Zoya's database model and Mahadevi's extraction pipeline.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


class PolicyCard(BaseModel):
    """Normalized policy card model for internal engine consumption."""
    id: str = Field(..., description="Unique policy card ID")
    version: str = Field(..., description="Policy version string")
    title: Optional[str] = Field(default="", description="Policy card title")
    category: Optional[str] = Field(default="", description="Policy category")
    content: str = Field(..., description="Full text/content of the approved policy")
    rules: Optional[list[dict[str, Any]]] = Field(default_factory=list, description="Structured rule definitions if available")
    metadata: Optional[dict[str, Any]] = Field(default_factory=dict, description="Metadata dictionary")


def normalize_policy_card(card_dict: dict[str, Any]) -> Optional[PolicyCard]:
    """Safely normalizes and validates a policy card dictionary.

    Returns None if essential fields (id, version, content) are missing or invalid,
    ensuring malformed records are handled gracefully without crashing the engine.
    """
    if not isinstance(card_dict, dict):
        return None

    card_id = (
        card_dict.get("id")
        or card_dict.get("policy_card_id")
        or card_dict.get("card_id")
    )
    version = (
        card_dict.get("version")
        or card_dict.get("policy_version")
        or card_dict.get("ver")
    )
    content = (
        card_dict.get("content")
        or card_dict.get("text")
        or card_dict.get("policy_text")
        or card_dict.get("description")
    )

    if not card_id or not version or content is None:
        return None

    card_id_str = str(card_id).strip()
    version_str = str(version).strip()
    content_str = str(content).strip()

    if not card_id_str or not version_str or not content_str:
        return None

    rules = card_dict.get("rules") or card_dict.get("rule_definitions") or []
    if not isinstance(rules, list):
        rules = []

    metadata = card_dict.get("metadata") or {}
    if not isinstance(metadata, dict):
        metadata = {}

    title = str(card_dict.get("title") or card_dict.get("name") or "").strip()
    category = str(card_dict.get("category") or card_dict.get("type") or "").strip()

    return PolicyCard(
        id=card_id_str,
        version=version_str,
        title=title,
        category=category,
        content=content_str,
        rules=rules,
        metadata=metadata,
    )
