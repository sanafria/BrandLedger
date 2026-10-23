"""Scan API Router for BrandLedger (Owned by Zoya for Backend, consumed by Sana for Creator UI).

Implements:
- POST /api/scans: Submit content draft, invoke Zynab's real engine, persist findings in PostgreSQL.
- GET /api/scans/{scan_id}: Retrieve scan status, draft ID, and persisted findings.
"""
from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.scan import ScanCreate, ScanResponse
from backend.app.services.scan_service import execute_scan, get_persisted_scan

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post(
    "",
    response_model=ScanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Draft & Scan",
    description="Saves a content draft, runs the rule & evidence engine against active policies, and persists findings.",
)
async def submit_and_scan(payload: ScanCreate) -> ScanResponse:
    """Submit a draft for pre-publication scanning and evidence verification."""
    return await execute_scan(
        title=payload.title,
        content_text=payload.content_text,
        draft_id=payload.draft_id,
        scan_date_str=payload.scan_date,
    )


@router.get(
    "/{scan_id}",
    response_model=ScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Scan Results",
    description="Retrieve a saved scan attempt, including status and all evidence-backed findings.",
)
async def get_scan(scan_id: UUID) -> ScanResponse:
    """Retrieve scan status and findings by scan ID."""
    return await get_persisted_scan(scan_id)
