import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app

client = TestClient(app)


def test_v1_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "nominal"
    assert data["version"] == "2.0.0"


def test_v1_api_presets():
    res = client.get("/api/v1/presets")
    assert res.status_code == 200
    presets = res.json()
    assert "instagram_drop" in presets
    assert "meta_ads_fatigue" in presets


def test_v1_agency_profile_and_auth_guard():
    # Test POST /api/v1/agency/profile in sandbox mode
    payload = {
        "name": "Starlight Distribution Lab",
        "tagline": "Auditing algorithmic distribution drift",
        "auditor_name": "Chief Analyst",
        "auditor_role": "Managing Partner",
        "contact_email": "analyst@starlight.agency",
        "confidentiality": "CONFIDENTIAL · PREPARED FOR CLIENT",
        "monogram": "SL",
    }
    # With Authorization header
    res = client.post(
        "/api/v1/agency/profile",
        json=payload,
        headers={"Authorization": "Bearer demo-token-12345"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["agency"]["name"] == "Starlight Distribution Lab"

    # Verify retrieval
    res_get = client.get("/api/v1/agency/profile/default-agency")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Starlight Distribution Lab"


def test_v1_radar_scan_endpoint():
    payload = {
        "agency_name": "Starlight Distribution Lab",
        "threshold": "warning",
        "accounts": [
            {
                "account_name": "@brand_healthy",
                "health_score": 92,
                "diagnosis": "Stable distribution baseline.",
            },
            {
                "account_name": "@brand_slipping",
                "health_score": 38,
                "diagnosis": "Significant algorithmic drop.",
            },
        ],
    }
    res = client.post("/api/v1/radar/scan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_scanned"] == 2
    assert data["total_flagged"] == 1
    assert data["flagged_accounts"][0]["account_name"] == "@brand_slipping"


def test_security_headers_present():
    res = client.get("/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "Strict-Transport-Security" in res.headers
