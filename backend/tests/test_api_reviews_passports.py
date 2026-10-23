"""Integration tests for Human Reviews and Content Passport Generation (Phase 5).

Executed against the live PostgreSQL database (brandledger_postgres:5433).
Verifies:
- Authorized reviewer approval and Content Passport issuance.
- Cryptographic SHA-256 canonical snapshot hash verification.
- Rejection flow (no passport issued, draft marked rejected).
- Tamper detection (modified database row causes hash_verified=False).
- Authorization enforcement (403 on missing role or creator self-approval).
- Mismatched draft/scan, nonexistent IDs, and duplicate review rejections.
"""
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db import db_manager


@pytest.fixture(scope="module")
def client():
    """TestClient managing lifespan (DB connect and disconnect)."""
    with TestClient(app) as test_client:
        yield test_client


def test_1_authorized_approval_issues_valid_content_passport(client: TestClient) -> None:
    """Verify reviewer approval updates draft, saves review, and issues a valid Content Passport."""
    # 1. Create and scan a compliant draft
    scan_res = client.post(
        "/api/scans",
        json={
            "title": "Launch Banner Approved",
            "content_text": "Welcome Members! Enjoy standard pricing.",
        },
    )
    assert scan_res.status_code == 201
    scan_id = scan_res.json()["scan_id"]
    draft_id = scan_res.json()["draft_id"]

    # 2. Authorized Reviewer approves
    headers = {
        "X-User-Role": "reviewer",
        "X-User-Id": "rev-101",
        "X-User-Name": "Compliance Officer Sarah",
    }
    review_payload = {
        "draft_id": draft_id,
        "scan_id": scan_id,
        "decision": "approved",
        "comment": "All checks cleared. Copy conforms to brand standards.",
    }

    review_res = client.post("/api/reviews", json=review_payload, headers=headers)
    assert review_res.status_code == 201

    review_data = review_res.json()
    assert review_data["decision"] == "approved"
    assert review_data["reviewer_id"] == "rev-101"
    assert review_data["passport_id"] is not None
    passport_id = review_data["passport_id"]

    # 3. Retrieve Content Passport and verify cryptographic hash
    passport_res = client.get(f"/api/passports/{passport_id}")
    assert passport_res.status_code == 200

    passport_data = passport_res.json()
    assert passport_data["id"] == passport_id
    assert passport_data["status"] == "valid"
    assert len(passport_data["passport_hash"]) == 64
    assert passport_data["hash_verified"] is True
    assert passport_data["metadata_snapshot"]["decision"] == "approved"
    assert passport_data["metadata_snapshot"]["draft_title"] == "Launch Banner Approved"


def test_2_rejection_flow_does_not_issue_passport(client: TestClient) -> None:
    """Verify reviewer rejection updates draft status to 'rejected' and does NOT issue a passport."""
    # 1. Create and scan draft with violations
    scan_res = client.post(
        "/api/scans",
        json={
            "title": "Rejected Campaign",
            "content_text": "Hey customers, get expired offers now!",
            "scan_date": "2026-07-01",
        },
    )
    assert scan_res.status_code == 201
    scan_id = scan_res.json()["scan_id"]
    draft_id = scan_res.json()["draft_id"]

    # 2. Reviewer rejects
    headers = {"X-User-Role": "reviewer", "X-User-Id": "rev-102"}
    review_payload = {
        "draft_id": draft_id,
        "scan_id": scan_id,
        "decision": "rejected",
        "comment": "Violates terminology ('customers') and expired promotion.",
    }

    review_res = client.post("/api/reviews", json=review_payload, headers=headers)
    assert review_res.status_code == 201

    review_data = review_res.json()
    assert review_data["decision"] == "rejected"
    assert review_data["passport_id"] is None, "Rejections must never issue a valid Content Passport"


def test_3_authorization_blocks_unauthorized_users(client: TestClient) -> None:
    """Verify missing role or creator role is rejected with 403 Forbidden."""
    # 1. Create scan
    scan_res = client.post(
        "/api/scans",
        json={"title": "RBAC Test", "content_text": "Sample text for testing."},
    )
    assert scan_res.status_code == 201
    scan_id = scan_res.json()["scan_id"]
    draft_id = scan_res.json()["draft_id"]

    review_payload = {
        "draft_id": draft_id,
        "scan_id": scan_id,
        "decision": "approved",
    }

    # Case A: Missing X-User-Role header
    res_no_role = client.post("/api/reviews", json=review_payload)
    assert res_no_role.status_code == 403
    assert "Authentication required" in res_no_role.json()["detail"]

    # Case B: Creator attempts self-approval
    res_creator = client.post(
        "/api/reviews",
        json=review_payload,
        headers={"X-User-Role": "creator"},
    )
    assert res_creator.status_code == 403
    assert "Creators are not authorized" in res_creator.json()["detail"]

    # Case C: Unknown role
    res_unknown = client.post(
        "/api/reviews",
        json=review_payload,
        headers={"X-User-Role": "guest"},
    )
    assert res_unknown.status_code == 403


def test_4_mismatched_draft_and_scan_rejected(client: TestClient) -> None:
    """Verify review is rejected if scan does not belong to specified draft."""
    # Create two separate scans
    res1 = client.post("/api/scans", json={"title": "Draft 1", "content_text": "Text 1"})
    res2 = client.post("/api/scans", json={"title": "Draft 2", "content_text": "Text 2"})

    draft_id_1 = res1.json()["draft_id"]
    scan_id_2 = res2.json()["scan_id"]

    # Attempt to pair Draft 1 with Scan 2
    res = client.post(
        "/api/reviews",
        json={
            "draft_id": draft_id_1,
            "scan_id": scan_id_2,
            "decision": "approved",
        },
        headers={"X-User-Role": "reviewer"},
    )
    assert res.status_code == 400
    assert "does not belong to Draft" in res.json()["detail"]


def test_5_duplicate_review_rejected_with_409(client: TestClient) -> None:
    """Verify duplicate reviews on the same scan return 409 Conflict."""
    scan_res = client.post("/api/scans", json={"title": "Dup Test", "content_text": "Text"})
    scan_id = scan_res.json()["scan_id"]
    draft_id = scan_res.json()["draft_id"]

    headers = {"X-User-Role": "reviewer"}
    payload = {"draft_id": draft_id, "scan_id": scan_id, "decision": "approved"}

    # First review
    first_res = client.post("/api/reviews", json=payload, headers=headers)
    assert first_res.status_code == 201

    # Second review on same scan
    second_res = client.post("/api/reviews", json=payload, headers=headers)
    assert second_res.status_code == 409
    assert "already been reviewed" in second_res.json()["detail"]


def test_6_passport_tampering_detected(client: TestClient) -> None:
    """Verify that manually tampering with database snapshot causes hash_verified=False."""
    # 1. Create approved passport
    scan_res = client.post("/api/scans", json={"title": "Tamper Test", "content_text": "Text"})
    scan_id = scan_res.json()["scan_id"]
    draft_id = scan_res.json()["draft_id"]

    review_res = client.post(
        "/api/reviews",
        json={"draft_id": draft_id, "scan_id": scan_id, "decision": "approved"},
        headers={"X-User-Role": "reviewer"},
    )
    passport_id = review_res.json()["passport_id"]

    # 2. Check initial valid state
    initial_res = client.get(f"/api/passports/{passport_id}")
    assert initial_res.status_code == 200
    assert initial_res.json()["hash_verified"] is True

    # 3. Simulate database tampering: alter snapshot title without updating passport_hash
    import asyncio
    import asyncpg
    from backend.app.config import settings

    async def tamper():
        conn = await asyncpg.connect(settings.DATABASE_URL)
        try:
            tampered_snapshot = dict(initial_res.json()["metadata_snapshot"])
            tampered_snapshot["draft_title"] = "TAMPERED HACKED TITLE"
            await conn.execute(
                "UPDATE passports SET metadata_snapshot = $1::jsonb WHERE id = $2;",
                json.dumps(tampered_snapshot),
                uuid.UUID(passport_id),
            )
        finally:
            await conn.close()

    asyncio.run(tamper())

    # 4. Verify detection on retrieval
    tampered_res = client.get(f"/api/passports/{passport_id}")
    assert tampered_res.status_code == 200
    assert tampered_res.json()["hash_verified"] is False, "Tampering must trigger hash_verified=False"


def test_7_get_nonexistent_passport_returns_404(client: TestClient) -> None:
    """Verify GET /api/passports/{fake_id} returns 404."""
    fake_id = str(uuid.uuid4())
    res = client.get(f"/api/passports/{fake_id}")
    assert res.status_code == 404
    assert f"'{fake_id}' not found" in res.json()["detail"]
