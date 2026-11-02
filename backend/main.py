import io
from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.anomaly_engine import AnomalyEngine
from ml.presets import get_preset_datasets
from services.instagram_api import get_90_days_reach


app = FastAPI(title="Relvnt AI Anomaly Engine", version="0.2.0")

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
    account_name: Optional[str] = "Demo Account"
    platform: Optional[str] = "instagram"
    metric_type: Optional[str] = "reach"
    series: List[DataPoint]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "product": "Relvnt AI Anomaly & Performance Sentinel",
        "version": "0.2.0",
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
    - Otherwise defaults instantly to the realistic 'instagram_drop' analysis.
    """
    presets = get_preset_datasets()

    # Only attempt live Instagram call if explicitly requested
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
            detail="At least 7 time-series data points are required for statistical anomaly analysis.",
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
        df = pd.read_csv(io.BytesIO(content))

        if df.empty or len(df) < 7:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain at least 7 rows of historical performance data.",
            )

        # Detect Date column
        date_col = None
        for col in df.columns:
            if any(k in str(col).lower() for k in ["date", "day", "time", "timestamp"]):
                date_col = col
                break
        if not date_col:
            date_col = df.columns[0]

        # Detect Value column
        val_col = None
        preferred_metric = (metric_type or "").lower()
        for col in df.columns:
            if preferred_metric and preferred_metric in str(col).lower():
                val_col = col
                break
        if not val_col:
            for col in df.columns:
                if any(k in str(col).lower() for k in ["reach", "value", "impressions", "views", "roas", "spend", "count"]):
                    val_col = col
                    break
        if not val_col:
            # Pick first numeric column that is not the date column
            for col in df.columns:
                if col != date_col and pd.api.types.is_numeric_dtype(df[col]):
                    val_col = col
                    break

        if not val_col:
            raise HTTPException(
                status_code=400,
                detail=f"Could not automatically find a numeric metric column in CSV. Found columns: {list(df.columns)}",
            )

        # Clean and extract series
        df["_parsed_date"] = pd.to_datetime(df[date_col], errors="coerce")
        df["_parsed_val"] = pd.to_numeric(df[val_col], errors="coerce")
        df = df.dropna(subset=["_parsed_date", "_parsed_val"]).sort_values("_parsed_date")

        dates = [d.strftime("%Y-%m-%d") for d in df["_parsed_date"]]
        values = [float(v) for v in df["_parsed_val"]]

        acc = account_name or file.filename.replace(".csv", "").replace("_", " ").title()

        res = engine.analyze_series(
            dates=dates,
            values=values,
            metric_type=metric_type or "reach",
            account_name=acc,
            platform=platform or "uploaded_csv",
        )
        res["username"] = acc
        res["data_source"] = "csv_upload"
        return res
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(exc)}")


def main():
    import uvicorn

    print("Relvnt AI Anomaly Engine starting...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
