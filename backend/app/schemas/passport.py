"""Content Passport Schemas."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict
from uuid import UUID
from pydantic import BaseModel, Field


class PassportStatus(str, Enum):
    """Status of an issued Content Passport."""
    VALID = "valid"
    REVOKED = "revoked"


class PassportResponse(BaseModel):
    """Immutable Content Passport digital certificate."""
    id: UUID
    draft_id: UUID
    scan_id: UUID
    review_id: UUID
    passport_hash: str = Field(..., description="SHA-256 hash computed over canonical snapshot")
    status: PassportStatus = Field(default=PassportStatus.VALID)
    metadata_snapshot: Dict[str, Any] = Field(
        ...,
        description="Frozen snapshot of draft, reviewer, policy versions, and findings"
    )
    hash_verified: bool = Field(
        default=True,
        description="True if stored hash matches recomputed canonical hash"
    )
    created_at: datetime
