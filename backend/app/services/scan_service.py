"""Scan Orchestration Service for BrandLedger (Owned by Zoya).

Integrates:
- Content Draft persistence in PostgreSQL.
- Active policy card loading with immutable version snapshots.
- Zynab's real rule and evidence engine (scan_draft).
- Persistence of evidence-backed findings into PostgreSQL.
"""
from datetime import date, datetime
import json
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status

from backend.app.db import db_manager
from backend.app.schemas.finding import Finding
from backend.app.schemas.scan import ScanResponse, ScanStatus
from backend.app.services.policy_engine import scan_draft

logger = logging.getLogger(__name__)


async def load_active_policy_cards() -> tuple[List[Dict[str, Any]], Dict[str, UUID]]:
    """Load all active policy cards from the database.

    Returns:
        (cards, id_lookup) where cards is a list of normalized policy dicts
        for Zynab's engine, and id_lookup maps string IDs/keys to valid UUIDs.
    """
    query = """
        SELECT id, policy_key, version, title, card_type AS category,
               rule_text AS content, source_quote, approved_value,
               valid_from, valid_until, severity, rules, metadata
        FROM policy_cards
        WHERE status = 'active';
    """
    rows = await db_manager.fetch(query)

    cards: List[Dict[str, Any]] = []
    id_lookup: Dict[str, UUID] = {}

    for row in rows:
        row_id = row["id"]
        policy_key = row["policy_key"]

        id_lookup[str(row_id)] = row_id
        if policy_key:
            id_lookup[policy_key] = row_id

        # Parse JSONB fields if necessary
        rules = row["rules"]
        if isinstance(rules, str):
            try:
                rules = json.loads(rules)
            except Exception:
                rules = []

        metadata = row["metadata"]
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except Exception:
                metadata = {}

        card_dict = {
            "id": str(row_id),
            "version": str(row["version"]),
            "title": row["title"],
            "category": row["category"],
            "content": row["content"],
            "source_quote": row["source_quote"],
            "approved_value": row["approved_value"],
            "rules": rules if isinstance(rules, list) else [],
            "metadata": metadata if isinstance(metadata, dict) else {},
        }
        cards.append(card_dict)

    return cards, id_lookup


async def execute_scan(
    title: str,
    content_text: str,
    draft_id: Optional[UUID] = None,
    scan_date_str: Optional[str] = None,
) -> ScanResponse:
    """Execute the end-to-end scan workflow with real PostgreSQL persistence."""
    cleaned_content = content_text.strip()
    if not cleaned_content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Draft content_text must not be empty.",
        )

    # Parse and validate scan_date
    if scan_date_str:
        from backend.app.services.rule_checks import _parse_date_safe
        parsed_dt = _parse_date_safe(scan_date_str)
        if not parsed_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid scan_date format: '{scan_date_str}'. Expected parseable date (e.g., YYYY-MM-DD).",
            )
        scan_date_obj = parsed_dt.date() if hasattr(parsed_dt, "date") else parsed_dt
    else:
        scan_date_obj = date.today()

    # 1. Ensure content_draft exists or create it
    if draft_id:
        draft_row = await db_manager.fetchrow(
            "SELECT id FROM content_drafts WHERE id = $1;",
            draft_id,
        )
        if not draft_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Draft with ID '{draft_id}' not found.",
            )
        # Update draft text and title if rescanned
        await db_manager.execute(
            """
            UPDATE content_drafts
            SET title = $1, content_text = $2, updated_at = NOW()
            WHERE id = $3;
            """,
            title,
            cleaned_content,
            draft_id,
        )
        saved_draft_id = draft_id
    else:
        new_draft = await db_manager.fetchrow(
            """
            INSERT INTO content_drafts (title, content_text, status)
            VALUES ($1, $2, 'draft')
            RETURNING id;
            """,
            title,
            cleaned_content,
        )
        if not new_draft:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist content draft.",
            )
        saved_draft_id = new_draft["id"]

    # 2. Create scan attempt record with 'pending' status
    scan_record = await db_manager.fetchrow(
        """
        INSERT INTO scans (draft_id, status, scan_date)
        VALUES ($1, 'pending', $2)
        RETURNING id, created_at;
        """,
        saved_draft_id,
        scan_date_obj,
    )
    if not scan_record:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize scan record.",
        )

    scan_id = scan_record["id"]
    created_at = scan_record["created_at"]

    # 3. Load active policy cards
    policies, id_lookup = await load_active_policy_cards()

    # 4. Invoke Zynab's real rule & evidence engine
    try:
        raw_findings = scan_draft(
            content_text=cleaned_content,
            policy_cards=policies,
            scan_date=scan_date_obj.isoformat(),
        )
    except ValueError as val_err:
        await db_manager.execute(
            "UPDATE scans SET status = 'failed', error_message = $1 WHERE id = $2;",
            str(val_err),
            scan_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scan parameters: {str(val_err)}",
        )
    except Exception as exc:
        await db_manager.execute(
            "UPDATE scans SET status = 'failed', error_message = $1 WHERE id = $2;",
            str(exc),
            scan_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scan engine error: {str(exc)}",
        )

    # 5. Persist each finding in PostgreSQL
    persisted_findings: List[Finding] = []
    has_blockers = False

    insert_finding_query = """
        INSERT INTO findings (
            scan_id, policy_card_id, policy_version, category,
            severity, matched_text, source_quote, explanation,
            suggested_fix, confidence, status, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open', $11)
        RETURNING id;
    """

    for f_dict in raw_findings:
        finding = Finding.model_validate(f_dict)
        persisted_findings.append(finding)

        if finding.severity in ("blocker", "high"):
            has_blockers = True

        # Resolve policy_card_id to valid UUID if known
        card_id_raw = finding.policy_card_id
        resolved_uuid = id_lookup.get(card_id_raw)
        if not resolved_uuid:
            try:
                resolved_uuid = UUID(card_id_raw)
            except (ValueError, TypeError):
                resolved_uuid = None

        await db_manager.execute(
            insert_finding_query,
            scan_id,
            resolved_uuid,
            str(finding.policy_version),
            finding.category,
            finding.severity,
            finding.matched_text,
            finding.source_quote,
            finding.explanation,
            finding.suggested_fix,
            float(finding.confidence),
            bool(finding.is_verified),
        )

    # 6. Mark scan completed
    await db_manager.execute(
        "UPDATE scans SET status = 'completed' WHERE id = $1;",
        scan_id,
    )

    return ScanResponse(
        scan_id=scan_id,
        draft_id=saved_draft_id,
        status=ScanStatus.COMPLETED,
        findings=persisted_findings,
        total_findings=len(persisted_findings),
        has_blockers=has_blockers,
        created_at=created_at,
    )


async def get_persisted_scan(scan_id: UUID) -> ScanResponse:
    """Retrieve an existing scan and all its persisted findings from PostgreSQL."""
    scan_row = await db_manager.fetchrow(
        """
        SELECT s.id AS scan_id, s.draft_id, s.status, s.created_at, s.error_message
        FROM scans s
        WHERE s.id = $1;
        """,
        scan_id,
    )

    if not scan_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID '{scan_id}' not found.",
        )

    findings_rows = await db_manager.fetch(
        """
        SELECT id, scan_id, policy_card_id, policy_version, category,
               severity, matched_text, source_quote, explanation,
               suggested_fix, confidence, status, is_verified
        FROM findings
        WHERE scan_id = $1
        ORDER BY created_at ASC;
        """,
        scan_id,
    )

    findings: List[Finding] = []
    has_blockers = False

    for row in findings_rows:
        finding = Finding(
            policy_card_id=str(row["policy_card_id"] or ""),
            policy_version=str(row["policy_version"]),
            category=row["category"],
            severity=row["severity"],
            matched_text=row["matched_text"],
            source_quote=row["source_quote"],
            explanation=row["explanation"],
            suggested_fix=row["suggested_fix"] or "",
            confidence=float(row["confidence"]),
            is_verified=row["is_verified"],
        )
        findings.append(finding)
        if finding.severity in ("blocker", "high"):
            has_blockers = True

    return ScanResponse(
        scan_id=scan_row["scan_id"],
        draft_id=scan_row["draft_id"],
        status=ScanStatus(scan_row["status"]),
        findings=findings,
        total_findings=len(findings),
        has_blockers=has_blockers,
        created_at=scan_row["created_at"],
    )
