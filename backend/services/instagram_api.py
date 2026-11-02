import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd
import requests
from dotenv import load_dotenv
from requests import HTTPError


env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

BASE_URL = "https://graph.facebook.com/v25.0"


def get_credentials(token: Optional[str] = None, business_id: Optional[str] = None):
    access_token = token or os.getenv("INSTAGRAM_ACCESS_TOKEN")
    b_id = business_id or os.getenv("INSTAGRAM_BUSINESS_ID")
    return access_token, b_id


def get_reach_data(since: str, until: str, access_token: Optional[str] = None, business_id: Optional[str] = None):
    try:
        token, b_id = get_credentials(access_token, business_id)
        if not token or not b_id:
            return pd.DataFrame(columns=["date", "reach"])

        url = f"{BASE_URL}/{b_id}/insights"
        params = {
            "metric": "reach",
            "period": "day",
            "since": since,
            "until": until,
            "access_token": token,
        }
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        payload = response.json()

        values = payload.get("data", [{}])[0].get("values", [])
        rows = []
        for item in values:
            end_time = item.get("end_time")
            value = item.get("value")
            if end_time is None or value is None:
                continue
            rows.append({"date": pd.to_datetime(end_time).tz_localize(None), "reach": value})

        df = pd.DataFrame(rows, columns=["date", "reach"])
        if df.empty:
            return df
        df["date"] = pd.to_datetime(df["date"]).dt.normalize()
        df["reach"] = pd.to_numeric(df["reach"], errors="coerce").fillna(0).astype(int)
        return df.sort_values("date").reset_index(drop=True)
    except Exception as exc:
        print(f"Instagram API request error ({since} to {until}): {exc}")
        return pd.DataFrame(columns=["date", "reach"])


def get_90_days_reach(access_token: Optional[str] = None, business_id: Optional[str] = None):
    try:
        today = datetime.now().date()
        ranges = [
            (today - timedelta(days=90), today - timedelta(days=61)),
            (today - timedelta(days=60), today - timedelta(days=31)),
            (today - timedelta(days=30), today - timedelta(days=1)),
        ]

        frames = [
            get_reach_data(start.isoformat(), end.isoformat(), access_token, business_id)
            for start, end in ranges
        ]
        final_df = pd.concat(frames, ignore_index=True)
        if final_df.empty:
            return pd.DataFrame(columns=["date", "reach"])

        final_df = (
            final_df.drop_duplicates(subset=["date"])
            .sort_values("date")
            .reset_index(drop=True)
        )
        return final_df
    except Exception as exc:
        print(f"Failed to fetch 90 days of Instagram reach data: {exc}")
        return pd.DataFrame(columns=["date", "reach"])
