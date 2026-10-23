"""Review API Router for BrandLedger (Owned by Zoya for Backend & Governance).

Implements:
- POST /api/reviews: Record reviewer approval or rejection, enforce reviewer authorization,
  and trigger Content Passport generation on approval.
"""
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status

from backend.app.schemas.review import ReviewCreate, ReviewResponse
from backend.app.services.review_service import submit_review_decision

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Human Review Decision",
    description="Records an authorized reviewer's approval or rejection. If approved, issues a Content Passport.",
)
async def create_review(
    payload: ReviewCreate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="User role (required: 'reviewer' or 'admin')"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="Reviewer identifier"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name", description="Reviewer display name"),
) -> ReviewResponse:
    """Submit a review decision with explicit role enforcement."""
    # 1. Enforce Reviewer Authorization
    if not x_user_role or not x_user_role.strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Authentication required. Please provide X-User-Role header (e.g., 'reviewer' or 'admin').",
        )

    role_clean = x_user_role.strip().lower()

    if role_clean == "creator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Creators are not authorized to approve content (self-approval prohibited).",
        )

    if role_clean not in ("reviewer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: Role '{x_user_role}' is not authorized. Review actions require 'reviewer' or 'admin' role.",
        )

    reviewer_id = (x_user_id.strip() if x_user_id and x_user_id.strip() else "reviewer_default")
    reviewer_name = (x_user_name.strip() if x_user_name and x_user_name.strip() else "Brand Reviewer")

    return await submit_review_decision(
        payload=payload,
        reviewer_id=reviewer_id,
        reviewer_name=reviewer_name,
    )
