import logging
import re
from typing import Any, Dict, List, Optional

import requests
from fastapi import FastAPI, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.anomaly_engine import AnomalyEngine
from ml.presets import get_preset_datasets
from services.csv_parser import DefensiveCSVParser
from services.instagram_api import get_90_days_reach

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("relvnt.api")

app = FastAPI(
    title="Relvnt Algorithmic Intelligence API",
    description="Enterprise Early-Warning Radar for Algorithmic Distribution Decoupling & Ad Fatigue.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Strict Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

engine = AnomalyEngine()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB limit


# --- Pydantic Data Contracts (backend-architect & fastapi-router-py standards) ---

class DataPoint(BaseModel):
    date: str
    value: float


class AnalyzePayload(BaseModel):
    account_name: Optional[str] = Field(default="Client Account", description="Account handle or campaign name")
    platform: Optional[str] = Field(default="instagram", description="Target platform (instagram, meta_ads, etc)")
    metric_type: Optional[str] = Field(default="reach", description="Target metric (reach, impressions, roas)")
    series: List[DataPoint] = Field(..., description="Array of chronologically ordered daily observations")


class CopilotQuery(BaseModel):
    question: str = Field(..., min_length=2, description="Inquiry for the Relvnt Growth Analyst")
    account_name: Optional[str] = "Target Account"
    platform: Optional[str] = "instagram"
    metric_type: Optional[str] = "reach"
    health_score: Optional[int] = 50
    metrics: Optional[Dict[str, Any]] = {}
    anomalies: Optional[List[Dict[str, Any]]] = []
    diagnosis: Optional[str] = ""


class HealthResponse(BaseModel):
    status: str
    system: str
    version: str
    data_governance: str


class ProtocolPhase(BaseModel):
    phase: str
    title: str
    action: str


class AnomalyPoint(BaseModel):
    date: str
    value: float
    deviation: float


class ReachPoint(BaseModel):
    date: str
    reach: float
    baseline: float
    is_anomaly: bool


class AnalysisResponse(BaseModel):
    account_name: str
    platform: str
    metric_type: str
    health_score: int
    alert_level: str
    severity: str
    prediction: str
    confidence: float
    recommended_action: str
    diagnosis: str
    protocol_phases: List[ProtocolPhase]
    ai_engine: str
    metrics_summary: Dict[str, Any]
    anomalies: List[AnomalyPoint]
    reach_data: List[ReachPoint]
    data_source: str
    username: str
    detected_columns: Optional[Dict[str, str]] = None


class CopilotResponse(BaseModel):
    answer: str
    engine: str
    governance: Optional[str] = "Zero-Data-Leak Enclave"


class GoogleSheetPayload(BaseModel):
    sheet_url: str = Field(..., description="Google Sheets share URL or publish link")
    metric_type: Optional[str] = "reach"
    account_name: Optional[str] = "Google Sheet Sync"


class InstagramConnectPayload(BaseModel):
    access_token: Optional[str] = None
    business_id: Optional[str] = None
    account_name: Optional[str] = "Connected Instagram Account"


class SlackAlertPayload(BaseModel):
    webhook_url: str = Field(..., description="Incoming Slack Webhook URL")
    account_name: str = "Client Account"
    health_score: int = 50
    alert_level: str = "yellow"
    diagnosis: str = "Performance shift detected."
    action_plan: str = "Review recent asset delivery."


# --- API Routes ---

@app.get("/health", response_model=HealthResponse, tags=["System Health"], status_code=status.HTTP_200_OK)
def health():
    return {
        "status": "nominal",
        "system": "Relvnt Algorithmic Intelligence Sentinel",
        "version": "1.2.0",
        "data_governance": "Compound AI: Local IsolationForest + Optional Zero-Retention Gemini Reasoning",
    }


@app.get("/presets", tags=["Benchmarks"], status_code=status.HTTP_200_OK)
def list_presets():
    presets = get_preset_datasets()
    return {
        key: {
            "name": val["name"],
            "account_name": val["account_name"],
            "platform": val["platform"],
            "metric_type": val["metric_type"],
            "count": len(val["values"]),
        }
        for key, val in presets.items()
    }


@app.get("/analyze", response_model=AnalysisResponse, tags=["Analytics Engine"], status_code=status.HTTP_200_OK)
def analyze(preset: Optional[str] = Query(default=None), source: Optional[str] = Query(default=None)):
    presets = get_preset_datasets()

    if source in ["live", "instagram"]:
        try:
            live_df = get_90_days_reach()
            if not live_df.empty and len(live_df) >= 7:
                dates = [d.strftime("%Y-%m-%d") for d in live_df["date"]]
                values = [float(v) for v in live_df["reach"]]
                res = engine.analyze_series(
                    dates=dates,
                    values=values,
                    metric_type="reach",
                    account_name="Connected Instagram Account",
                    platform="instagram",
                )
                res["username"] = "Instagram Live"
                res["data_source"] = "instagram"
                return res
        except Exception as exc:
            logger.warning("Live Instagram request failed: %s", exc)

    selected_key = preset if (preset and preset in presets) else "instagram_drop"
    selected = presets[selected_key]
    res = engine.analyze_series(
        dates=selected["dates"],
        values=selected["values"],
        metric_type=selected["metric_type"],
        account_name=selected["account_name"],
        platform=selected["platform"],
    )
    res["username"] = selected["account_name"]
    res["data_source"] = "demo" if selected_key == "instagram_drop" else f"preset_{selected_key}"
    return res


@app.post("/analyze", response_model=AnalysisResponse, tags=["Analytics Engine"], status_code=status.HTTP_200_OK)
def analyze_custom(payload: AnalyzePayload):
    if len(payload.series) < 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 7 daily data points are required for statistical performance evaluation.",
        )

    clean_account = re.sub(r"[^\w\s\-@.]", "", payload.account_name or "Custom Account").strip()
    dates = [p.date for p in payload.series]
    values = [p.value for p in payload.series]

    res = engine.analyze_series(
        dates=dates,
        values=values,
        metric_type=payload.metric_type or "reach",
        account_name=clean_account,
        platform=payload.platform or "custom",
    )
    res["username"] = clean_account
    res["data_source"] = "user_input"
    return res


@app.post("/analyze/upload", response_model=AnalysisResponse, tags=["Analytics Engine"], status_code=status.HTTP_200_OK)
async def analyze_csv(
    file: UploadFile = File(...),
    metric_type: Optional[str] = "reach",
    account_name: Optional[str] = None,
    platform: Optional[str] = "uploaded_csv",
):
    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds security limit ({MAX_UPLOAD_BYTES // (1024*1024)}MB).",
            )

        safe_filename = re.sub(r"[^\w\s\-_.]", "", file.filename or "upload.csv")

        clean_df, date_col, val_col = DefensiveCSVParser.parse(
            file_bytes=content,
            filename=safe_filename,
            preferred_metric=metric_type,
        )

        acc = account_name or safe_filename.replace(".csv", "").replace("_", " ").title()
        acc = re.sub(r"[^\w\s\-@.]", "", acc).strip()

        res = engine.analyze_series(
            dates=clean_df["date"].tolist(),
            values=clean_df["value"].tolist(),
            metric_type=metric_type or "reach",
            account_name=acc,
            platform=platform or "uploaded_csv",
        )
        res["username"] = acc
        res["data_source"] = "csv_upload"
        res["detected_columns"] = {"date": date_col, "metric": val_col}
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Internal processing error during CSV evaluation: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during dataset evaluation. Please verify file format.",
        )


@app.post("/copilot", response_model=CopilotResponse, tags=["Copilot"], status_code=status.HTTP_200_OK)
def copilot_query(payload: CopilotQuery):
    clean_question = re.sub(r"[^\w\s\-\?\.\,\'\"\/]", "", payload.question).strip()
    if not clean_question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question parameter is required.")

    res = engine.query_copilot(
        question=clean_question,
        account_name=payload.account_name or "Target Account",
        platform=payload.platform or "instagram",
        metric_type=payload.metric_type or "reach",
        health_score=payload.health_score or 50,
        metrics=payload.metrics or {},
        anomalies=payload.anomalies or [],
        diagnosis=payload.diagnosis or "",
    )
    return res


@app.post("/analyze/sheet", response_model=AnalysisResponse, tags=["Plug-and-Play Integrations"], status_code=status.HTTP_200_OK)
def analyze_google_sheet(payload: GoogleSheetPayload):
    """
    1-Click Google Sheets Auto-Sync:
    Normalizes any public or shared Google Sheets link to its live CSV export endpoint,
    parses time-series data without manual export, and executes anomaly evaluation.
    """
    raw_url = payload.sheet_url.strip()
    sheet_id_match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", raw_url)
    if not sheet_id_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google Sheet URL. Please provide a standard Google Sheets sharing link.",
        )

    sheet_id = sheet_id_match.group(1)
    # Extract optional gid (sheet tab) if present
    gid_match = re.search(r"[#&]gid=([0-9]+)", raw_url)
    gid = gid_match.group(1) if gid_match else "0"
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

    try:
        res = requests.get(export_url, timeout=15)
        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to fetch Google Sheet. Please ensure the link is set to 'Anyone with the link can view'.",
            )

        clean_df, date_col, val_col = DefensiveCSVParser.parse(
            file_bytes=res.content,
            filename="google_sheet.csv",
            preferred_metric=payload.metric_type or "reach",
        )

        acc = payload.account_name or "Google Sheet Roster"
        analysis = engine.analyze_series(
            dates=clean_df["date"].tolist(),
            values=clean_df["value"].tolist(),
            metric_type=payload.metric_type or "reach",
            account_name=acc,
            platform="google_sheets",
        )
        analysis["username"] = acc
        analysis["data_source"] = "google_sheets_live"
        analysis["detected_columns"] = {"date": date_col, "metric": val_col}
        return analysis
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error processing Google Sheet sync: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync Google Sheet: {str(exc)}",
        )


@app.post("/analyze/instagram", response_model=AnalysisResponse, tags=["Plug-and-Play Integrations"], status_code=status.HTTP_200_OK)
def analyze_instagram_live(payload: InstagramConnectPayload):
    """
    1-Click Instagram Insights Live Sync:
    Pulls the last 90 days of daily reach directly from Meta Graph API using the provided token or server credentials.
    """
    try:
        live_df = get_90_days_reach(access_token=payload.access_token, business_id=payload.business_id)
        if live_df.empty or len(live_df) < 7:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No reach insights returned from Meta Graph API. Please verify the account is an Instagram Business or Creator account.",
            )

        acc = payload.account_name or "Connected Instagram Account"
        analysis = engine.analyze_series(
            dates=[d.strftime("%Y-%m-%d") for d in live_df["date"]],
            values=[float(v) for v in live_df["reach"]],
            metric_type="reach",
            account_name=acc,
            platform="instagram",
        )
        analysis["username"] = acc
        analysis["data_source"] = "instagram_live_api"
        return analysis
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Meta Graph API error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Meta Graph API connection failed: {str(exc)}",
        )


@app.post("/alerts/slack", tags=["Plug-and-Play Integrations"], status_code=status.HTTP_200_OK)
def send_slack_alert(payload: SlackAlertPayload):
    """
    Dispatches a formatted executive alert card to a client or internal Slack channel via incoming webhook.
    """
    status_emoji = "🚨" if payload.health_score < 40 else "⚠️" if payload.health_score < 70 else "✅"
    color_hex = "#EF4444" if payload.health_score < 40 else "#F59E0B" if payload.health_score < 70 else "#10B981"

    slack_msg = {
        "attachments": [
            {
                "color": color_hex,
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": f"{status_emoji} Relvnt Sentinel Alert: {payload.account_name}",
                            "emoji": True,
                        },
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Health Index:*\n`{payload.health_score} / 100`"},
                            {"type": "mrkdwn", "text": f"*Status Level:*\n*{payload.alert_level.upper()}*"},
                        ],
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Diagnostic Summary:*\n{payload.diagnosis}"},
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Recommended Action:*\n{payload.action_plan}"},
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": "Generated automatically by Relvnt Early-Warning Sentinel · Local zero-retention analysis",
                            }
                        ],
                    },
                ],
            }
        ]
    }

    try:
        resp = requests.post(payload.webhook_url, json=slack_msg, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slack webhook rejected payload with status {resp.status_code}: {resp.text}",
            )
        return {"status": "dispatched", "message": "Alert dispatched to Slack successfully."}
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to communicate with Slack webhook: {str(exc)}",
        )
