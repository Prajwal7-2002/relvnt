import logging
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
import requests

from ml.anomaly_engine import AnomalyEngine
from ml.presets import get_preset_datasets
from services.csv_parser import DefensiveCSVParser
from services.instagram_api import get_90_days_reach
from services.supabase_service import supabase_service

logger = logging.getLogger("relvnt.routers.analytics")

router = APIRouter(tags=["Analytics Engine"])
engine = AnomalyEngine()

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB limit
PRESET_CACHE: Dict[str, Dict] = {}


# --- Pydantic Data Contracts ---

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


def record_analysis_telemetry(res: Dict[str, Any], agency_id: str = "default-agency"):
    """Zero-crash telemetry logging into Supabase / local DAO."""
    try:
        supabase_service.save_client(
            agency_id=agency_id,
            client_data={
                "account_handle": res.get("account_name", "Target Account"),
                "platform": res.get("platform", "instagram"),
                "metric_type": res.get("metric_type", "reach"),
                "health_score": res.get("health_score", 50),
                "status": res.get("severity", "nominal"),
            },
        )
        if res.get("health_score", 100) < 50 or res.get("severity") in ["CRITICAL_DRIFT", "ELEVATED_RISK"]:
            reach_data = res.get("reach_data") or []
            last_date = reach_data[-1].get("date") if reach_data else "today"
            supabase_service.log_incident(
                {
                    "client_id": agency_id,
                    "incident_date": last_date,
                    "severity": res.get("severity", "critical"),
                    "classification": res.get("prediction", "Algorithmic Decoupling"),
                    "variance_percentage": res.get("metrics_summary", {}).get("change_pct", -50.0),
                    "root_cause_diagnosis": res.get("diagnosis", ""),
                }
            )
    except Exception as exc:
        logger.warning("Telemetry auto-record error (non-fatal): %s", exc)


# --- Router Endpoints ---

@router.get("/presets", status_code=status.HTTP_200_OK)
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


@router.get("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
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
    if selected_key in PRESET_CACHE:
        return PRESET_CACHE[selected_key]

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
    PRESET_CACHE[selected_key] = res
    record_analysis_telemetry(res)
    return res


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
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
    record_analysis_telemetry(res)
    return res


@router.post("/analyze/upload", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
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
        record_analysis_telemetry(res)
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


@router.post("/copilot", response_model=CopilotResponse, status_code=status.HTTP_200_OK)
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


@router.post("/analyze/sheet", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
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
        record_analysis_telemetry(analysis)
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


@router.post("/analyze/instagram", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
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
