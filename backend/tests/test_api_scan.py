"""Integration tests for FastAPI /api/scan endpoint."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def api_client():
    return TestClient(app)


def test_health_endpoint(api_client):
    response = api_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "brandledger-api"}


def test_api_scan_endpoint_success(api_client, all_sample_policy_dicts):
    payload = {
        "content_text": "Our customers can earn up to 800 points with Summer Discount!",
        "policy_cards": all_sample_policy_dicts,
        "scan_date": "2026-07-01",
    }
    response = api_client.post("/api/scan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "total_findings" in data
    assert data["total_findings"] >= 3
    assert len(data["findings"]) == data["total_findings"]

    categories = {f["category"] for f in data["findings"]}
    assert "terminology" in categories
    assert "expired_offer" in categories
    assert "factual_accuracy" in categories


def test_api_scan_endpoint_invalid_date(api_client, all_sample_policy_dicts):
    payload = {
        "content_text": "Our customers can access accounts.",
        "policy_cards": all_sample_policy_dicts,
        "scan_date": "invalid-date",
    }
    response = api_client.post("/api/scan", json=payload)
    assert response.status_code == 400
    assert "Invalid scan_date format" in response.json()["detail"]
