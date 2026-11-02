from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.anomaly_engine import AnomalyEngine
from ml.presets import get_preset_datasets
from services.csv_parser import DefensiveCSVParser
from services.instagram_api import get_90_days_reach


app = FastAPI(title="Relvnt AI Anomaly & Performance Sentinel", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = AnomalyEngine()


class DataPoint(BaseModel):
    date: str
    value: float


class AnalyzePayload(BaseModel):
    account_name: Optional[str] = "Client Account"
    platform: Optional[str] = "instagram"
    metric_type: Optional[str] = "reach"
    series: List[DataPoint]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "product": "Relvnt AI Performance Sentinel",
        "version": "1.0.0",
        "engine": "Adaptive Seasonality & Anomaly Engine",
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
    """
    Returns an analysis report.
    - If source == 'live' or 'instagram', attempts to query Instagram API.
    - If a preset is requested, evaluates that preset.
    - Otherwise defaults to the realistic 'instagram_drop' scenario.
    """
    presets = get_preset_datasets()

    if source in ["live", "instagram"]:
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
            detail="At least 7 daily data points are required for statistical anomaly evaluation.",
        )

    dates = [p.date for p in payload.series]
    values = [p.value for p in payload.series]

    res = engine.analyze_series(
        dates=dates,
        values=values,
        metric_type=payload.metric_type or "reach",
        account_name=payload.account_name or "Custom Account",
        platform=payload.platform or "custom",
    )
    res["username"] = payload.account_name or "Custom Account"
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
        clean_df, date_col, val_col = DefensiveCSVParser.parse(
            file_bytes=content,
            filename=file.filename or "upload.csv",
            preferred_metric=metric_type,
        )

        acc = account_name or file.filename.replace(".csv", "").replace("_", " ").title()

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
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(exc)}")
