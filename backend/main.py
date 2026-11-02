import logging
import re
from typing import Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.anomaly_engine import AnomalyEngine
from ml.presets import get_preset_datasets
from services.csv_parser import DefensiveCSVParser
from services.instagram_api import get_90_days_reach

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("relvnt.api")

app = FastAPI(title="Relvnt Enterprise Performance Sentinel", version="1.1.0")

# SECURITY: Strict Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# CORS configuration: Allow localhost, vercel deployments, and all custom origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

engine = AnomalyEngine()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB strict limit


class DataPoint(BaseModel):
    date: str
    value: float


class AnalyzePayload(BaseModel):
    account_name: Optional[str] = "Client Account"
    platform: Optional[str] = "instagram"
    metric_type: Optional[str] = "reach"
    series: List[DataPoint]


class CopilotQuery(BaseModel):
    question: str
    account_name: Optional[str] = "Target Account"
    platform: Optional[str] = "instagram"
    metric_type: Optional[str] = "reach"
    health_score: Optional[int] = 50
    metrics: Optional[Dict] = {}
    anomalies: Optional[List[Dict]] = []
    diagnosis: Optional[str] = ""


@app.get("/health")
def health():
    return {
        "status": "nominal",
        "system": "Relvnt Enterprise Sentinel",
        "version": "1.1.0",
        "data_governance": "Compound AI: Local IsolationForest + Optional Zero-Retention Gemini Reasoning",
    }


@app.get("/presets")
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


@app.get("/analyze")
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


@app.post("/analyze")
def analyze_custom(payload: AnalyzePayload):
    if len(payload.series) < 7:
        raise HTTPException(
            status_code=400,
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


@app.post("/analyze/upload")
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
                status_code=413,
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
        raise HTTPException(status_code=400, detail=str(val_err))
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Internal processing error during CSV evaluation: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred during dataset evaluation. Please verify file format.",
        )


@app.post("/copilot")
def copilot_query(payload: CopilotQuery):
    clean_question = re.sub(r"[^\w\s\-\?\.\,\'\"\/]", "", payload.question).strip()
    if not clean_question:
        raise HTTPException(status_code=400, detail="Question parameter is required.")

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
