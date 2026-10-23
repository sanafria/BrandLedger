"""Content Draft and Scan Workflow Schemas."""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from backend.app.schemas.finding import Finding


class DraftStatus(str, Enum):
    """Lifecycle status of submitted content."""
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ScanStatus(str, Enum):
    """Status of an individual scan attempt."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class DraftCreate(BaseModel):
    """Creator draft submission."""
    title: str = Field(..., min_length=1, max_length=255, description="Campaign or post title")
    content_text: str = Field(..., min_length=1, description="Draft text to scan")


class DraftResponse(BaseModel):
    """Content draft representation."""
    id: UUID
    title: str
    content_text: str
    status: DraftStatus = Field(default=DraftStatus.DRAFT)
    created_at: datetime
    updated_at: datetime


class ScanCreate(BaseModel):
    """Initiate a new scan for a draft."""
    title: str = Field(..., min_length=1, max_length=255)
    content_text: str = Field(..., min_length=1)
    draft_id: Optional[UUID] = Field(None, description="Optional existing draft ID for rescan")


class ScanResponse(BaseModel):
    """Full scan result returned to Creator UI."""
    scan_id: UUID
    draft_id: UUID
    status: ScanStatus
    findings: List[Finding] = Field(default_factory=list)
    total_findings: int = Field(default=0)
    has_blockers: bool = Field(default=False)
    created_at: datetime
