"""BrandLedger FastAPI Application Entry Point.

Maintained as part of the shared API layer owned by Zoya, integrating
Zynab's scan_draft service into the FastAPI scan workflow.
"""

from typing import Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.policy_engine import scan_draft
from backend.app.schemas.finding import Finding

app = FastAPI(
    title="BrandLedger API",
    description="Compliance, Rules Engine, and Policy Verification API",
    version="1.0.0",
)


class ScanDraftRequest(BaseModel):
    """Scan request model matching the scan workflow contract."""
    content_text: str = Field(..., description="Draft marketing content to be scanned")
    policy_cards: list[dict[str, Any]] = Field(..., description="Approved policy cards")
    scan_date: str = Field(..., description="Reference scan date string (YYYY-MM-DD)")


class ScanDraftResponse(BaseModel):
    """Scan response model returning structured, validated findings."""
    total_findings: int
    findings: list[Finding]


@app.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "brandledger-api"}


@app.post("/api/scan", response_model=ScanDraftResponse)
def api_scan_draft(request: ScanDraftRequest) -> ScanDraftResponse:
    """Scan draft endpoint integrating Zynab's policy engine service."""
    try:
        findings = scan_draft(
            content_text=request.content_text,
            policy_cards=request.policy_cards,
            scan_date=request.scan_date,
        )
        return ScanDraftResponse(
            total_findings=len(findings),
            findings=[Finding(**f) for f in findings],
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scan error: {str(exc)}")
