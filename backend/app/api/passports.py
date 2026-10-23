"""Content Passport API Router for BrandLedger (Owned by Zoya for Backend, consumed by Nimra).

Implements:
- GET /api/passports/{passport_id}: Retrieve immutable Content Passport audit record with hash verification.
"""
from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.passport import PassportResponse
from backend.app.services.review_service import get_passport

router = APIRouter(prefix="/passports", tags=["Passports"])


@router.get(
    "/{passport_id}",
    response_model=PassportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Content Passport",
    description="Retrieve an immutable Content Passport certificate and verify its SHA-256 cryptographic snapshot hash.",
)
async def get_passport_certificate(passport_id: UUID) -> PassportResponse:
    """Retrieve Content Passport certificate by ID with on-the-fly hash verification."""
    return await get_passport(passport_id)
