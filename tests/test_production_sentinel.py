import io
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from ml.anomaly_engine import AnomalyEngine
from ml.presets import get_preset_datasets
from services.ai_agent import LocalDiagnosticEngine
from services.csv_parser import DefensiveCSVParser

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "nominal"
    assert "Zero-Data-Leak" in data["data_governance"]


def test_security_headers():
    response = client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert "strict-origin-when-cross-origin" in response.headers.get("referrer-policy", "")


def test_presets_endpoint():
    response = client.get("/presets")
    assert response.status_code == 200
    presets = response.json()
    assert "instagram_drop" in presets
    assert "meta_ads_fatigue" in presets
    assert "healthy_growth" in presets


def test_analyze_preset_instagram_drop():
    response = client.get("/analyze?preset=instagram_drop")
    assert response.status_code == 200
    data = response.json()
    assert data["metric_type"] == "reach"
    assert data["health_score"] <= 40  # Suppression scenario
    assert data["severity"] in ["CRITICAL_DRIFT", "ELEVATED_RISK"]
    assert len(data["reach_data"]) >= 7
    assert len(data["protocol_phases"]) == 3
    assert "Zero-Data-Leak" in data["ai_engine"]


def test_analyze_preset_meta_ads_fatigue():
    response = client.get("/analyze?preset=meta_ads_fatigue")
    assert response.status_code == 200
    data = response.json()
    assert data["metric_type"] == "roas"
    assert data["health_score"] <= 50
    assert len(data["reach_data"]) >= 7
    assert "ad spend" in data["metrics_summary"]["projected_impact"].lower() or "deficit" in data["metrics_summary"]["projected_impact"].lower()


def test_csv_parser_clean_numeric():
    assert DefensiveCSVParser._clean_numeric_value("$1,234.50") == 1234.50
    assert DefensiveCSVParser._clean_numeric_value("3.4x") == 3.4
    assert DefensiveCSVParser._clean_numeric_value("12,450") == 12450.0
    assert DefensiveCSVParser._clean_numeric_value("--") is None
    assert DefensiveCSVParser._clean_numeric_value("N/A") is None


def test_csv_parser_real_datasets():
    ig_path = os.path.join(os.path.dirname(__file__), "..", "data", "benchmarks", "real_instagram_creator.csv")
    if os.path.exists(ig_path):
        with open(ig_path, "rb") as f:
            bytes_data = f.read()
        df, date_col, val_col = DefensiveCSVParser.parse(bytes_data, "real_instagram_creator.csv")
        assert len(df) >= 7
        assert "date" in df.columns
        assert "value" in df.columns
        assert val_col.lower() in ["reach", "impressions"]


def test_analyze_upload_endpoint():
    csv_content = """Date,Reach
2026-08-01,10200
2026-08-02,10400
2026-08-03,9800
2026-08-04,10100
2026-08-05,10300
2026-08-06,9900
2026-08-07,10050
2026-08-08,4200
2026-08-09,4100
2026-08-10,3900
"""
    files = {"file": ("test_upload.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/analyze/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["data_source"] == "csv_upload"
    assert data["metrics_summary"]["anomaly_count"] >= 1
    assert len(data["reach_data"]) == 10


def test_zero_data_leak_local_agent():
    briefing = LocalDiagnosticEngine.generate_briefing(
        account_name="@test_agency",
        platform="instagram",
        metric_type="reach",
        prediction="shock",
        health_score=15,
        metrics={
            "current_value": 4500.0,
            "baseline_avg": 12000.0,
            "change_pct": -62.5,
            "z_score_deviation": -3.8,
            "volatility_index": 5.2,
        },
        anomalies=[{"date": "2026-08-10", "value": 4500.0, "deviation": -62.5}],
    )
    assert briefing["severity"] == "CRITICAL_DRIFT"
    assert "contracted by 62.5%" in briefing["diagnosis"]
    assert len(briefing["phases"]) == 3
    assert "Zero-Data-Leak" in briefing["ai_engine"]
