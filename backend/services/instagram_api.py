import os
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv


env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN")
BUSINESS_ID = os.getenv("INSTAGRAM_BUSINESS_ID")
BASE_URL = "https://graph.facebook.com/v25.0"

if not ACCESS_TOKEN or not BUSINESS_ID:
    print("ERROR: Instagram credentials missing from .env")
    print(f"Looking for .env at: {env_path}")
    print(f"ACCESS_TOKEN found: {bool(ACCESS_TOKEN)}")
    print(f"BUSINESS_ID found: {bool(BUSINESS_ID)}")
else:
    print("Credentials loaded successfully")
    print(f"BUSINESS_ID: {BUSINESS_ID}")


def get_reach_data(since: str, until: str):
    try:
        if not ACCESS_TOKEN or not BUSINESS_ID:
            raise ValueError("Instagram credentials are missing from .env")

        url = f"{BASE_URL}/{BUSINESS_ID}/insights"
        params = {
            "metric": "reach",
            "period": "day",
            "since": since,
            "until": until,
            "access_token": ACCESS_TOKEN,
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
        print(f"Instagram API error for {since} to {until}: {exc}")
        return pd.DataFrame(columns=["date", "reach"])


def get_90_days_reach():
    try:
        today = datetime.now().date()
        ranges = [
            (today - timedelta(days=90), today - timedelta(days=61)),
            (today - timedelta(days=60), today - timedelta(days=31)),
            (today - timedelta(days=30), today - timedelta(days=1)),
        ]

        frames = [
            get_reach_data(start.isoformat(), end.isoformat()) for start, end in ranges
        ]
        final_df = pd.concat(frames, ignore_index=True)
        if final_df.empty:
            print("Fetched 0 days of reach data")
            return pd.DataFrame(columns=["date", "reach"])

        final_df = (
            final_df.drop_duplicates(subset=["date"])
            .sort_values("date")
            .reset_index(drop=True)
        )
        print(f"Fetched {len(final_df)} days of reach data")
        return final_df
    except Exception as exc:
        print(f"Failed to fetch 90 days of Instagram reach data: {exc}")
        return pd.DataFrame(columns=["date", "reach"])


if __name__ == "__main__":
    print(get_90_days_reach().tail())
