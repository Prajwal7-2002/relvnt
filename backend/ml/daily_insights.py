"""
Findings from a daily series alone (no per-post data): when a drop started,
how persistent it is, and whether one weekday is clearly worse than the rest.

Every finding states its numbers and is only reported with enough days behind it.
Like the per-post findings, these describe what happened, not proof of cause.
"""
from typing import Dict, List

import numpy as np
import pandas as pd

BELOW_USUAL = -0.15         # a day counts as "below usual" at 15% under
RECENT_DAYS = 14
MIN_RUN_DAYS = 3
WEEKDAY_WINDOW = 28
MIN_WEEKDAY_SAMPLES = 3
WEEKDAY_GAP = 0.15          # worst weekday must be 15 points worse than the overall recent level


def _cap(word: str) -> str:
    """'reach' -> 'Reach', but keep 'ROAS' as is."""
    return word[:1].upper() + word[1:]


def _readable(ts: pd.Timestamp) -> str:
    return ts.strftime("%d %b").lstrip("0")


def daily_findings(dates: pd.Series, values: np.ndarray, usual: np.ndarray, metric_word: str) -> List[Dict]:
    """`usual` is the expected value for each day (stable baseline with that weekday's pattern)."""
    n = len(values)
    if n < 14:
        return []
    with np.errstate(divide="ignore", invalid="ignore"):
        deviation = np.where(usual > 0, values / usual - 1.0, 0.0)

    findings: List[Dict] = []

    # 1. Current run of days below usual, and how common it is recently
    run = 0
    for d in deviation[::-1]:
        if d <= BELOW_USUAL:
            run += 1
        else:
            break
    recent = deviation[-RECENT_DAYS:]
    below_recent = int((recent <= BELOW_USUAL).sum())

    if run >= MIN_RUN_DAYS:
        start = dates.iloc[n - run]
        typical = float(np.median(deviation[-run:]))
        findings.append(
            {
                "id": "daily_run",
                "tone": "negative",
                "title": f"{_cap(metric_word)} has been below usual for {run} days",
                "detail": (
                    f"Every day since {_readable(start)} has been at least 15% below usual "
                    f"(typically {abs(typical) * 100:.0f}% below), and {below_recent} of the last {len(recent)} days were below usual."
                ),
                "action": (
                    f"Compare what was posted since {_readable(start)} with the weeks before: formats, how often, and posting times. "
                    "Upload a per-post export for a detailed comparison."
                ),
                "evidence": {"run_days": run, "run_start": start.strftime("%Y-%m-%d"), "below_recent": below_recent, "recent_days": len(recent)},
            }
        )
    elif below_recent >= 5:
        findings.append(
            {
                "id": "daily_frequent",
                "tone": "negative",
                "title": f"{_cap(metric_word)} keeps dipping below usual",
                "detail": f"{below_recent} of the last {len(recent)} days were at least 15% below usual, though not all in a row.",
                "action": "Look at the dates of the weakest days and what was posted just before them.",
                "evidence": {"below_recent": below_recent, "recent_days": len(recent)},
            }
        )

    # 2. A weekday that is clearly worse than the recent level overall
    window = pd.DataFrame({"weekday": dates.iloc[-WEEKDAY_WINDOW:].dt.day_name().values, "dev": deviation[-WEEKDAY_WINDOW:]})
    by_day = window.groupby("weekday")["dev"].agg(["median", "count"])
    by_day = by_day[by_day["count"] >= MIN_WEEKDAY_SAMPLES]
    if len(by_day) >= 5:
        overall = float(window["dev"].median())
        worst = by_day["median"].idxmin()
        worst_dev = float(by_day.loc[worst, "median"])
        if worst_dev <= BELOW_USUAL and worst_dev - overall <= -WEEKDAY_GAP:
            findings.append(
                {
                    "id": "daily_weekday",
                    "tone": "negative",
                    "title": f"{worst}s are the weakest day",
                    "detail": (
                        f"Over the last {len(window)} days, {worst}s were typically {abs(worst_dev) * 100:.0f}% below usual, "
                        f"compared with {abs(overall) * 100:.0f}% {'below' if overall < 0 else 'above'} for the period overall "
                        f"({int(by_day.loc[worst, 'count'])} {worst}s)."
                    ),
                    "action": f"Check what is usually posted on {worst}s, and try moving one important post away from {worst} for two weeks.",
                    "evidence": {"weekday": worst, "weekday_median_dev": round(worst_dev, 3), "overall_median_dev": round(overall, 3)},
                }
            )

    return findings
