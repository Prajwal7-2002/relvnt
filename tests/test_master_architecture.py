import io
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from services.csv_parser import DefensiveCSVParser

client = TestClient(app)


def test_v1_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "nominal"
    assert data["version"] == "2.1.0"


def test_v1_api_presets():
    res = client.get("/api/v1/presets")
    assert res.status_code == 200
    presets = res.json()
    assert "instagram_drop" in presets
    assert "meta_ads_fatigue" in presets


def test_v1_agency_profile_and_auth_guard():
    payload = {
        "name": "Starlight Distribution Lab",
        "tagline": "Auditing algorithmic distribution drift",
        "auditor_name": "Chief Analyst",
        "auditor_role": "Managing Partner",
        "contact_email": "analyst@starlight.agency",
        "confidentiality": "CONFIDENTIAL · PREPARED FOR CLIENT",
        "monogram": "SL",
    }
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
    assert "Content-Security-Policy" in res.headers


def test_rate_limit_headers():
    res = client.get("/health")
    assert "X-RateLimit-Limit" in res.headers
    assert "X-RateLimit-Remaining" in res.headers
    assert "X-RateLimit-Reset" in res.headers
    limit = int(res.headers["X-RateLimit-Limit"])
    assert limit in (45, 180)


def test_ssrf_protection_blocks_cloud_metadata():
    payload = {
        "webhook_url": "http://169.254.169.254/latest/meta-data",
        "agency_name": "Test Agency",
    }
    res = client.post("/alerts/test", json=payload)
    assert res.status_code == 400
    assert "forbidden" in res.json().get("detail", "").lower() or "restricted" in res.json().get("detail", "").lower()


def test_csv_formula_injection_sanitization():
    # Malicious CSV crafted with formula triggers (=CMD, @SUM, +calc)
    malicious_csv = b"""=SUM(A1:B1),+1234\n2026-08-01,1500\n2026-08-02,1600\n2026-08-03,1700\n2026-08-04,1800\n2026-08-05,1900\n2026-08-06,2000\n2026-08-07,2100"""
    df, date_col, val_col = DefensiveCSVParser.parse(malicious_csv, filename="exploit.csv")
    # Verify that dangerous formula injection prefixes on headers were stripped
    assert not date_col.startswith("=")
    assert not val_col.startswith("+")
    assert len(df) == 7


def test_cached_sample_reads_are_not_heavy_but_uploads_are():
    from core.rate_limiter import TieredRateLimiter

    limiter = TieredRateLimiter()
    assert limiter._get_tier("/api/v1/analyze", "GET", "preset=instagram_drop") == "standard"
    assert limiter._get_tier("/api/v1/analyze", "GET", "source=live") == "heavy"
    assert limiter._get_tier("/api/v1/analyze/upload", "POST", "") == "heavy"
    assert limiter._get_tier("/api/v1/copilot", "POST", "") == "heavy"
