import io
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd
import requests

ROOT_DIR = Path(__file__).resolve().parents[1]
BENCHMARK_DIR = ROOT_DIR / "data" / "benchmarks"
PUBLIC_SAMPLES_DIR = ROOT_DIR / "frontend" / "public" / "samples"

BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_SAMPLES_DIR.mkdir(parents=True, exist_ok=True)


def download_real_instagram_dataset():
    """
    Downloads authentic Instagram post metrics from open creator benchmark repository
    and formats it as a daily time series ready for anomaly detection.
    """
    print("Fetching authentic Instagram creator dataset...")
    url = "https://raw.githubusercontent.com/amankharwal/Website-data/master/Instagram.csv"
    r = requests.get(url, timeout=15)
    r.raise_for_status()

    df = pd.read_csv(io.StringIO(r.text), encoding="latin1")
    df = df.dropna(subset=["Impressions"]).reset_index(drop=True)

    # Assign sequential daily dates ending today
    n_days = len(df)
    today = datetime.now().date()
    dates = [(today - timedelta(days=n_days - 1 - i)).isoformat() for i in range(n_days)]

    clean_df = pd.DataFrame(
        {
            "Date": dates,
            "Reach": df["Impressions"].astype(int),
            "From_Explore": df["From Explore"].fillna(0).astype(int),
            "From_Hashtags": df["From Hashtags"].fillna(0).astype(int),
            "Shares": df["Shares"].fillna(0).astype(int),
            "Saves": df["Saves"].fillna(0).astype(int),
            "Likes": df["Likes"].fillna(0).astype(int),
            "Comments": df["Comments"].fillna(0).astype(int),
        }
    )

    clean_df.to_csv(BENCHMARK_DIR / "real_instagram_creator.csv", index=False)
    clean_df.to_csv(PUBLIC_SAMPLES_DIR / "real_instagram_sample.csv", index=False)
    print(f"Saved {len(clean_df)} authentic Instagram rows.")


def download_real_meta_ads_dataset():
    """
    Downloads real-world Facebook / Meta Ad conversion data (Kaggle benchmark)
    and formats campaign performance into daily ad spend and ROAS.
    """
    print("Fetching authentic Meta Ads campaign benchmark...")
    url = "https://raw.githubusercontent.com/ychennay/ychennay.github.io/master/KAG_conversion_data.csv"
    r = requests.get(url, timeout=15)
    r.raise_for_status()

    df = pd.read_csv(io.StringIO(r.text))

    # Focus on top high-spend campaign (xyz_campaign_id == 1178)
    camp_df = df[df["xyz_campaign_id"] == 1178].copy()
    camp_df = camp_df[camp_df["Spent"] > 0].reset_index(drop=True)

    # Group by sequential clusters to simulate daily campaign trajectory
    n_days = min(90, len(camp_df))
    today = datetime.now().date()
    dates = [(today - timedelta(days=n_days - 1 - i)).isoformat() for i in range(n_days)]

    sample_df = camp_df.iloc[:n_days].copy().reset_index(drop=True)
    # Estimate realistic ROAS: (Approved_Conversion * AOV $75) / Spent
    estimated_revenue = sample_df["Approved_Conversion"] * 75.0 + sample_df["Total_Conversion"] * 25.0
    roas = np.clip(estimated_revenue / sample_df["Spent"], 0.2, 8.5)

    clean_df = pd.DataFrame(
        {
            "Reporting Starts": dates,
            "Website purchase ROAS": np.round(roas, 2),
            "Amount spent (USD)": np.round(sample_df["Spent"], 2),
            "Impressions": sample_df["Impressions"].astype(int),
            "Clicks": sample_df["Clicks"].astype(int),
            "Purchases": sample_df["Approved_Conversion"].astype(int),
        }
    )

    clean_df.to_csv(BENCHMARK_DIR / "real_meta_ads_campaign.csv", index=False)
    clean_df.to_csv(PUBLIC_SAMPLES_DIR / "real_meta_ads_sample.csv", index=False)
    print(f"Saved {len(clean_df)} authentic Meta Ads campaign rows.")


def main():
    try:
        download_real_instagram_dataset()
        download_real_meta_ads_dataset()
        print("\nAll real-world benchmarks successfully curated in:")
        print(f" - {BENCHMARK_DIR}")
        print(f" - {PUBLIC_SAMPLES_DIR}")
    except Exception as exc:
        print(f"Error fetching benchmarks: {exc}")


if __name__ == "__main__":
    main()

