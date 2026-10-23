"""Policy Card API Endpoints (Owned by Zoya for Backend, consumed by Nimra & Sana).

Implements:
- GET /api/policies: List active or filtered policy cards.
- POST /api/policies: Create a new policy card and initial immutable version.
- PATCH /api/policies/{policy_id}: Update policy card with immutable version bump.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.db import db_manager
from backend.app.schemas.policy import (
    CardType,
    PolicyCardCreate,
    PolicyCardResponse,
    PolicyCardUpdate,
    PolicyListResponse,
    PolicyStatus,
)

router = APIRouter(prefix="/policies", tags=["Policies"])


def _row_to_response(row) -> PolicyCardResponse:
    """Helper to convert asyncpg Record to PolicyCardResponse schema."""
    return PolicyCardResponse(
        id=row["id"],
        title=row["title"],
        card_type=row["card_type"],
        rule_text=row["rule_text"],
        approved_value=row["approved_value"],
        source_quote=row["source_quote"],
        valid_from=row["valid_from"],
        valid_until=row["valid_until"],
        severity=row["severity"],
        status=row["status"],
        version=row["version"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get(
    "",
    response_model=PolicyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Policy Cards",
    description="Retrieve all brand policy cards with optional category and status filters.",
)
async def list_policies(
    card_type: Optional[CardType] = Query(None, description="Filter by card category"),
    status_filter: Optional[PolicyStatus] = Query(
        PolicyStatus.ACTIVE,
        alias="status",
        description="Filter by status (default 'active')",
    ),
) -> PolicyListResponse:
    """List policy cards according to query filters."""
    conditions = []
    params = []

    if card_type:
        params.append(card_type.value)
        conditions.append(f"card_type = ${len(params)}")

    if status_filter:
        params.append(status_filter.value)
        conditions.append(f"status = ${len(params)}")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT id, title, card_type, rule_text, approved_value, source_quote,
               valid_from, valid_until, severity, status, version, created_at, updated_at
        FROM policy_cards
        {where_clause}
        ORDER BY created_at DESC;
    """

    try:
        rows = await db_manager.fetch(query, *params)
        items = [_row_to_response(row) for row in rows]
        return PolicyListResponse(items=items, total=len(items))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(exc)}",
        )


@router.post(
    "",
    response_model=PolicyCardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Policy Card",
    description="Create a new policy card and register its initial immutable version.",
)
async def create_policy(payload: PolicyCardCreate) -> PolicyCardResponse:
    """Create a new policy card and initial immutable version record."""
    insert_policy_query = """
        INSERT INTO policy_cards (
            title, card_type, rule_text, approved_value, source_quote,
            valid_from, valid_until, severity, status, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 1)
        RETURNING id, title, card_type, rule_text, approved_value, source_quote,
                  valid_from, valid_until, severity, status, version, created_at, updated_at;
    """

    insert_version_query = """
        INSERT INTO policy_card_versions (
            policy_card_id, version, title, card_type, rule_text,
            approved_value, source_quote, valid_from, valid_until, severity
        ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9);
    """

    try:
        row = await db_manager.fetchrow(
            insert_policy_query,
            payload.title,
            payload.card_type.value,
            payload.rule_text,
            payload.approved_value,
            payload.source_quote,
            payload.valid_from,
            payload.valid_until,
            payload.severity.value,
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create policy card record.",
            )

        # Snapshot version 1 in policy_card_versions
        await db_manager.execute(
            insert_version_query,
            row["id"],
            row["title"],
            row["card_type"],
            row["rule_text"],
            row["approved_value"],
            row["source_quote"],
            row["valid_from"],
            row["valid_until"],
            row["severity"],
        )

        return _row_to_response(row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insert failed: {str(exc)}",
        )


@router.patch(
    "/{policy_id}",
    response_model=PolicyCardResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Policy Card (Version Bump)",
    description="Update an existing policy card by bumping its version and preserving historical versions.",
)
async def update_policy(
    policy_id: UUID,
    payload: PolicyCardUpdate,
) -> PolicyCardResponse:
    """Update a policy card and save a new immutable version snapshot."""
    fetch_query = """
        SELECT id, title, card_type, rule_text, approved_value, source_quote,
               valid_from, valid_until, severity, status, version, created_at, updated_at
        FROM policy_cards
        WHERE id = $1;
    """

    existing = await db_manager.fetchrow(fetch_query, policy_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy card with ID '{policy_id}' not found.",
        )

    # Determine updated values
    new_title = payload.title if payload.title is not None else existing["title"]
    new_rule_text = payload.rule_text if payload.rule_text is not None else existing["rule_text"]
    new_approved_value = (
        payload.approved_value if payload.approved_value is not None else existing["approved_value"]
    )
    new_source_quote = (
        payload.source_quote if payload.source_quote is not None else existing["source_quote"]
    )
    new_valid_from = (
        payload.valid_from if payload.valid_from is not None else existing["valid_from"]
    )
    new_valid_until = (
        payload.valid_until if payload.valid_until is not None else existing["valid_until"]
    )
    new_severity = (
        payload.severity.value if payload.severity is not None else existing["severity"]
    )
    new_status = (
        payload.status.value if payload.status is not None else existing["status"]
    )

    # Check if content has changed (triggers version increment)
    content_changed = (
        new_title != existing["title"]
        or new_rule_text != existing["rule_text"]
        or new_approved_value != existing["approved_value"]
        or new_source_quote != existing["source_quote"]
        or new_valid_from != existing["valid_from"]
        or new_valid_until != existing["valid_until"]
        or new_severity != existing["severity"]
    )

    new_version = existing["version"] + 1 if content_changed else existing["version"]

    update_query = """
        UPDATE policy_cards
        SET title = $1,
            rule_text = $2,
            approved_value = $3,
            source_quote = $4,
            valid_from = $5,
            valid_until = $6,
            severity = $7,
            status = $8,
            version = $9,
            updated_at = NOW()
        WHERE id = $10
        RETURNING id, title, card_type, rule_text, approved_value, source_quote,
                  valid_from, valid_until, severity, status, version, created_at, updated_at;
    """

    insert_version_query = """
        INSERT INTO policy_card_versions (
            policy_card_id, version, title, card_type, rule_text,
            approved_value, source_quote, valid_from, valid_until, severity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (policy_card_id, version) DO NOTHING;
    """

    try:
        updated_row = await db_manager.fetchrow(
            update_query,
            new_title,
            new_rule_text,
            new_approved_value,
            new_source_quote,
            new_valid_from,
            new_valid_until,
            new_severity,
            new_status,
            new_version,
            policy_id,
        )

        if not updated_row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update policy card.",
            )

        # If content changed, persist the new version record
        if content_changed:
            await db_manager.execute(
                insert_version_query,
                policy_id,
                new_version,
                new_title,
                updated_row["card_type"],
                new_rule_text,
                new_approved_value,
                new_source_quote,
                new_valid_from,
                new_valid_until,
                new_severity,
            )

        return _row_to_response(updated_row)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update failed: {str(exc)}",
        )
