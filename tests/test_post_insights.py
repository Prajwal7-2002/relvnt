import os
import sys
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from ml.post_insights import analyze_posts
from services.post_parser import PostExportParser

client = TestClient(app)
SAMPLE = Path(__file__).resolve().parent.parent / "frontend" / "public" / "samples" / "sample_instagram_posts.csv"
DAILY_SAMPLE = Path(__file__).resolve().parent.parent / "data" / "benchmarks" / "real_instagram_creator.csv"


def test_detects_post_export_but_not_daily_export():
    assert PostExportParser.looks_like_post_export(SAMPLE.read_bytes())
    assert not PostExportParser.looks_like_post_export(DAILY_SAMPLE.read_bytes())


def test_parser_normalises_meta_columns():
    posts = PostExportParser.parse(SAMPLE.read_bytes())
    assert set(posts["post_type"]) <= {"Reel", "Carousel", "Photo"}
    assert posts["published"].is_monotonic_increasing
    assert posts.attrs["account"] == "@cafe_bloom"
    assert posts.attrs["metric"] == "reach"


def test_findings_carry_evidence_and_actions():
    insights = analyze_posts(PostExportParser.parse(SAMPLE.read_bytes()))
    by_id = {f["id"]: f for f in insights["findings"]}

    assert by_id["trend"]["tone"] == "negative"
    assert by_id["format"]["evidence"]["best_format"] == "Reel"
    assert by_id["format"]["evidence"]["ratio"] >= 1.5
    assert "frequency" in by_id
    for finding in insights["findings"]:
        assert finding["evidence"], finding["id"]
        assert any(ch.isdigit() for ch in finding["detail"]), finding["id"]


def test_too_few_posts_per_format_reports_nothing_about_format():
    rows = [
        {"published": pd.Timestamp("2026-10-01") + pd.Timedelta(days=i * 3), "post_type": t, "reach": r, "caption": "", "permalink": ""}
        for i, (t, r) in enumerate([("Reel", 5000), ("Photo", 900), ("Reel", 5200), ("Photo", 1000), ("Carousel", 2000), ("Carousel", 2100)])
    ]
    insights = analyze_posts(pd.DataFrame(rows))
    assert "format" not in {f["id"] for f in insights["findings"]}


def test_upload_endpoint_routes_post_exports():
    with SAMPLE.open("rb") as f:
        res = client.post("/api/v1/analyze/upload", files={"file": ("export.csv", f, "text/csv")})
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "post_export"
    assert data["account_name"] == "@cafe_bloom"
    assert data["post_insights"]["post_count"] >= 40
    assert "posting days" in data["metrics_summary"]["recent_window_label"]
    assert len(data["protocol_phases"]) == 3


def test_flagged_days_are_always_below_their_usual_level():
    """'Usual' is weekday-aware, so a flagged day can never show as above usual."""
    for source in (SAMPLE, DAILY_SAMPLE):
        with source.open("rb") as f:
            data = client.post("/api/v1/analyze/upload", files={"file": ("e.csv", f, "text/csv")}).json()
        usual = {p["date"]: p["baseline"] for p in data["reach_data"]}
        for a in data["anomalies"]:
            assert a["value"] <= usual[a["date"]] * 0.85, (source.name, a)


def test_comparison_and_calendar_for_visuals():
    insights = analyze_posts(PostExportParser.parse(SAMPLE.read_bytes()))
    comp = insights["comparison"]
    assert comp["best_format"] == "Reel"
    assert comp["prior"]["posts_per_week"] > comp["recent"]["posts_per_week"]
    assert comp["prior"]["best_format_share"] > comp["recent"]["best_format_share"]

    cal = insights["calendar"]
    assert cal[0]["date"] == insights["period_start"] and cal[-1]["date"] == insights["period_end"]
    assert sum(d["posts"] for d in cal) == insights["post_count"]
    assert any(d["posts"] == 0 and d["reach"] is None for d in cal)  # gaps are kept
