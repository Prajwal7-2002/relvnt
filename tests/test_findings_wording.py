import json
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from services import ai_agent
from services.ai_agent import HybridAIAgent, extract_numbers, numbers_supported

client = TestClient(app)

FINDING = {
    "id": "format",
    "tone": "negative",
    "title": "Post more reels",
    "detail": "Reels got 2.8x the reach of photos (median 4,126 across 34 posts vs 1,484 across 7).",
    "action": "Make at least 5 of the next 7 posts reels.",
    "evidence": {"ratio": 2.8},
}


def test_extract_and_check_numbers():
    assert extract_numbers("3,680 to 1,867 (-49%), 2.8x") == [3680.0, 1867.0, 49.0, 2.8]
    assert numbers_supported("median 4,126 across 34 posts", "34 posts with a median of 4,126")
    assert not numbers_supported("median 4,126 across 34 posts", "about 4,100 across 34 posts")


def test_polish_without_key_keeps_template_wording():
    agent = HybridAIAgent()
    agent.api_key = None
    out = agent.polish_findings([FINDING], "@cafe", "instagram", "reach")
    assert out[0]["wording"] == "template" and out[0]["detail"] == FINDING["detail"]


class _FakeResponse:
    def __init__(self, payload):
        self.status_code = 200
        self._payload = payload

    def json(self):
        return {"candidates": [{"content": {"parts": [{"text": json.dumps(self._payload)}]}}]}


def _polish_with(monkeypatch, rewrite):
    monkeypatch.setattr(ai_agent.requests, "post", lambda *a, **k: _FakeResponse({"findings": [rewrite]}))
    agent = HybridAIAgent()
    agent.api_key = "test-key"
    return agent.polish_findings([FINDING], "@cafe", "instagram", "reach")[0]


def test_ai_rewrite_kept_when_numbers_check_out(monkeypatch):
    out = _polish_with(monkeypatch, {
        "id": "format",
        "title": "Reels are your strongest format",
        "detail": "Your reels reached 2.8x more people than photos: a median of 4,126 over 34 posts, against 1,484 over 7.",
        "action": "Make at least 5 of your next 7 posts reels.",
    })
    assert out["wording"] == "ai"
    assert out["title"] == "Reels are your strongest format"
    assert out["evidence"] == FINDING["evidence"] and out["tone"] == "negative"


def test_ai_rewrite_rejected_when_it_invents_a_number(monkeypatch):
    out = _polish_with(monkeypatch, {
        "id": "format",
        "title": "Reels are your strongest format",
        "detail": "Reels reached about 3x more people than photos.",  # 3 is not in the evidence
        "action": "Make at least 5 of your next 7 posts reels.",
    })
    assert out["wording"] == "template" and out["detail"] == FINDING["detail"]


def test_ai_rewrite_rejected_when_it_drops_the_evidence(monkeypatch):
    out = _polish_with(monkeypatch, {
        "id": "format",
        "title": "Reels work best",
        "detail": "Reels reach far more people than photos.",
        "action": "Post more reels.",
    })
    assert out["wording"] == "template"


def test_daily_data_gets_specific_findings_and_steps():
    data = client.get("/api/v1/analyze?preset=instagram_drop").json()
    ids = [f["id"] for f in data["findings"]]
    assert "daily_run" in ids
    run = next(f for f in data["findings"] if f["id"] == "daily_run")
    assert any(ch.isdigit() for ch in run["detail"]) and run["action"]
    # Steps come from the findings, not the generic fallback
    assert data["protocol_phases"][0]["title"] == data["findings"][0]["title"]


def test_filler_steps_never_contradict_findings():
    from services.ai_agent import LocalDiagnosticEngine

    finding = {"id": "daily_weekday", "title": "Mondays are your weakest day", "detail": "x", "action": "Move one post away from Monday."}
    steps = LocalDiagnosticEngine._build_steps("normal", False, "", 1000.0, "reach", [finding])
    titles = [s["title"] for s in steps]
    assert titles[0] == "Mondays are your weakest day"
    assert "Keep the current schedule" not in titles and len(steps) == 3


def test_uploaded_ads_export_is_analysed_as_roas_not_reach():
    from pathlib import Path

    ads = Path(__file__).resolve().parent.parent / "data" / "benchmarks" / "real_meta_ads_campaign.csv"
    with ads.open("rb") as f:
        data = client.post("/api/v1/analyze/upload", files={"file": ("ads.csv", f, "text/csv")}).json()
    assert data["metric_type"] == "roas"
    assert data["platform"] == "meta_ads"
    text = " ".join(f["title"] + " " + f["detail"] for f in data["findings"]).lower()
    assert "reach" not in text
