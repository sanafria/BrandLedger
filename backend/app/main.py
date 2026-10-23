"""BrandLedger FastAPI Application Entry Point.

Maintained as part of the shared API layer owned by Zoya, integrating
CORS, configuration, shared schemas, and Zynab's scan_draft service.
"""

from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.app.config import settings
from backend.app.schemas.finding import Finding
from backend.app.services.policy_engine import scan_draft

app = FastAPI(
    title="BrandLedger API",
    description="Compliance, Rules Engine, and Policy Verification API",
    version="1.0.0",
)

# Configure CORS for Next.js frontend (Sana and Nimra)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"status": "ok", "service": "brandledger-api"}


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
