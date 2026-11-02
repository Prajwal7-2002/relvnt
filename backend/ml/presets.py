from datetime import datetime, timedelta
from typing import Dict, List
import numpy as np


def generate_sample_dates(days: int = 90) -> List[str]:
    today = datetime.now().date()
    return [(today - timedelta(days=days - 1 - i)).isoformat() for i in range(days)]


def get_preset_datasets() -> Dict[str, Dict]:
    dates_90 = generate_sample_dates(90)
    rng = np.random.default_rng(42)

    # 1. Instagram Reach with Pre-Shock / Anomaly
    base_reach = 12000
    weekly_wave = 1 + 0.15 * np.sin(2 * np.pi * np.arange(90) / 7)
    reach_vals = base_reach * weekly_wave + rng.normal(0, 400, 90)
    # inject pre-shock decline in the last 14 days
    reach_vals[-14:] = reach_vals[-14:] * np.linspace(1.0, 0.62, 14)

    # 2. Meta Ads ROAS Fatigue
    roas_vals = 3.4 + rng.normal(0, 0.15, 90)
    # ad fatigue steep drop in last 8 days
    roas_vals[-8:] = np.linspace(3.1, 1.2, 8) + rng.normal(0, 0.08, 8)

    # 3. Healthy Steady Growth
    steady_vals = np.linspace(8000, 14500, 90) * weekly_wave + rng.normal(0, 300, 90)

    return {
        "instagram_drop": {
            "name": "Creator Reach Drop (Early Warning)",
            "account_name": "@tech_founder",
            "platform": "instagram",
            "metric_type": "reach",
            "dates": dates_90,
            "values": [max(50, int(round(v))) for v in reach_vals],
        },
        "meta_ads_fatigue": {
            "name": "E-Commerce Meta Ads Creative Fatigue",
            "account_name": "Acme Apparel - US Retargeting",
            "platform": "meta_ads",
            "metric_type": "roas",
            "dates": dates_90,
            "values": [max(0.1, round(float(v), 2)) for v in roas_vals],
        },
        "healthy_growth": {
            "name": "Steady Creator Performance",
            "account_name": "@growth_studio",
            "platform": "instagram",
            "metric_type": "reach",
            "dates": dates_90,
            "values": [max(50, int(round(v))) for v in steady_vals],
        },
    }

