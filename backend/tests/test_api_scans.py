"""Integration tests for Scan Orchestration and PostgreSQL Persistence (Phase 4).

Tests execute against the live PostgreSQL database (brandledger_postgres:5433),
calling Zynab's real rule/evidence engine and asserting real database persistence and retrieval.
"""
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


def test_1_submit_draft_and_scan_with_real_violations(client: TestClient) -> None:
    """Verify POST /api/scans saves draft, executes engine, and persists findings in PostgreSQL."""
    payload = {
        "title": "Summer Campaign Post",
        "content_text": "Our customers can access the exclusive Summer Discount today!",
        "scan_date": "2026-07-01",  # Past the 2026-06-30 expiration date
    }

    response = client.post("/api/scans", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert "scan_id" in data
    assert "draft_id" in data
    assert data["status"] == "completed"
    assert data["total_findings"] >= 2
    assert data["has_blockers"] is True

    categories = {f["category"] for f in data["findings"]}
    assert "terminology" in categories
    assert "expired_offer" in categories

    for f in data["findings"]:
        assert f["source_quote"], "Each finding must have a cited source quote"
        assert f["policy_version"], "Each finding must cite exact policy version"
        assert f["is_verified"] is True


def test_2_retrieve_persisted_scan_from_database(client: TestClient) -> None:
    """Verify GET /api/scans/{scan_id} retrieves saved scan and findings from PostgreSQL."""
    # 1. Initiate scan
    submit_res = client.post(
        "/api/scans",
        json={
            "title": "Audit Retrieval Test",
            "content_text": "Hello customers, join our loyalty program.",
        },
    )
    assert submit_res.status_code == 201
    scan_id = submit_res.json()["scan_id"]
    original_total = submit_res.json()["total_findings"]

    # 2. Retrieve via separate GET request
    get_res = client.get(f"/api/scans/{scan_id}")
    assert get_res.status_code == 200

    retrieved = get_res.json()
    assert retrieved["scan_id"] == scan_id
    assert retrieved["status"] == "completed"
    assert retrieved["total_findings"] == original_total
    assert len(retrieved["findings"]) == original_total

    # Verify terminology finding persisted
    matched_texts = [f["matched_text"].lower() for f in retrieved["findings"]]
    assert any("customers" in m for m in matched_texts)


def test_3_clean_compliant_scan_produces_zero_findings(client: TestClient) -> None:
    """Verify compliant text produces zero findings and does NOT auto-approve content."""
    payload = {
        "title": "Clean Post",
        "content_text": "Welcome Members! Enjoy standard pricing on our store.",
        "scan_date": "2026-07-01",
    }

    response = client.post("/api/scans", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["status"] == "completed"
    assert data["total_findings"] == 0
    assert data["has_blockers"] is False


def test_4_rescan_existing_draft_creates_distinct_scan_record(client: TestClient) -> None:
    """Verify rescanning an existing draft preserves draft_id but creates a new scan attempt."""
    # 1. Initial scan with violation
    first_res = client.post(
        "/api/scans",
        json={
            "title": "Rescan Test Draft",
            "content_text": "Dear customers, check your email.",
        },
    )
    assert first_res.status_code == 201
    draft_id = first_res.json()["draft_id"]
    first_scan_id = first_res.json()["scan_id"]
    assert first_res.json()["total_findings"] >= 1

    # 2. Rescan with corrected text, passing existing draft_id
    rescan_res = client.post(
        "/api/scans",
        json={
            "title": "Rescan Test Draft",
            "content_text": "Dear Members, check your email.",
            "draft_id": draft_id,
        },
    )
    assert rescan_res.status_code == 201
    rescan_data = rescan_res.json()

    assert rescan_data["draft_id"] == draft_id, "Draft ID must be preserved"
    assert rescan_data["scan_id"] != first_scan_id, "Rescan must create a new distinct scan record"
    assert rescan_data["total_findings"] == 0, "Corrected text should have zero findings"


def test_5_reject_empty_content(client: TestClient) -> None:
    """Verify POST /api/scans rejects empty content."""
    response = client.post(
        "/api/scans",
        json={"title": "Empty", "content_text": "   "},
    )
    assert response.status_code == 422


def test_6_reject_invalid_scan_date(client: TestClient) -> None:
    """Verify POST /api/scans rejects malformed scan_date."""
    response = client.post(
        "/api/scans",
        json={
            "title": "Bad Date",
            "content_text": "Some text",
            "scan_date": "not-a-date",
        },
    )
    assert response.status_code == 400
    assert "Invalid scan_date format" in response.json()["detail"]


def test_7_get_nonexistent_scan_returns_404(client: TestClient) -> None:
    """Verify GET /api/scans/{fake_id} returns 404."""
    fake_id = str(uuid.uuid4())
    response = client.get(f"/api/scans/{fake_id}")
    assert response.status_code == 404
    assert f"'{fake_id}' not found" in response.json()["detail"]
