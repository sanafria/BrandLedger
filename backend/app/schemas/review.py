"""Review Workflow Schemas."""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ReviewDecision(str, Enum):
    """Human review decision."""
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewCreate(BaseModel):
    """Human reviewer decision payload."""
    draft_id: UUID = Field(..., description="UUID of draft being reviewed")
    scan_id: UUID = Field(..., description="UUID of completed scan evaluated")
    decision: ReviewDecision = Field(..., description="'approved' or 'rejected'")
    comment: str = Field(..., min_length=2, description="Reviewer explanation or verification note")


class ReviewResponse(BaseModel):
    """Review decision record."""
    id: UUID
    draft_id: UUID
    scan_id: UUID
    reviewer_id: str
    reviewer_name: str
    decision: ReviewDecision
    comment: str
    passport_id: Optional[UUID] = None
    created_at: datetime
