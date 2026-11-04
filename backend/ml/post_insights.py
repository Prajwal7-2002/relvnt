"""
Per-post insights: the "why" behind a reach change.

Every finding carries the numbers it is based on and is only reported when
there are enough posts to support it. Findings describe what happened at the
same time as a change; they do not claim to prove the cause.
"""
from typing import Dict, List, Optional

import pandas as pd

RECENT_DAYS = 28
PRIOR_DAYS = 56
MIN_POSTS_PER_GROUP = 3
TREND_THRESHOLD = 0.15      # 15% change in median reach per post
FREQUENCY_THRESHOLD = 0.30  # 30% change in posts per week
FORMAT_RATIO = 1.5          # best format must beat the weakest by 1.5x
MIX_SHIFT = 0.15            # 15 percentage points less of the best format
WEEKDAY_RATIO = 1.25        # best weekday vs overall median

FORMAT_PLURAL = {"Reel": "reels", "Carousel": "carousels", "Photo": "photos", "Video": "videos", "Other": "other posts"}


def _n(value: float) -> str:
    return f"{value:,.0f}"


def _pct(change: float) -> str:
    return f"{'+' if change > 0 else '−'}{abs(change) * 100:.0f}%"


def _periods(posts: pd.DataFrame):
    """Split into a recent window and the window before it."""
    end = posts["published"].max()
    span_days = (end - posts["published"].min()).days
    if span_days >= RECENT_DAYS + 14:
        recent_start = end - pd.Timedelta(days=RECENT_DAYS)
        prior_start = recent_start - pd.Timedelta(days=PRIOR_DAYS)
        recent = posts[posts["published"] > recent_start]
        prior = posts[(posts["published"] > prior_start) & (posts["published"] <= recent_start)]
        recent_weeks = RECENT_DAYS / 7
        prior_weeks = min(PRIOR_DAYS, (recent_start - posts["published"].min()).days) / 7
    else:
        mid = posts["published"].min() + (end - posts["published"].min()) / 2
        recent = posts[posts["published"] > mid]
        prior = posts[posts["published"] <= mid]
        recent_weeks = prior_weeks = max(1.0, span_days / 14)
    return recent, prior, recent_weeks, max(prior_weeks, 1.0)


def _trend_finding(recent, prior) -> Optional[Dict]:
    if len(recent) < MIN_POSTS_PER_GROUP or len(prior) < MIN_POSTS_PER_GROUP:
        return None
    r, p = recent["reach"].median(), prior["reach"].median()
    if p <= 0:
        return None
    change = (r - p) / p
    if abs(change) < TREND_THRESHOLD:
        return {
            "id": "trend",
            "tone": "neutral",
            "title": "Reach per post is steady",
            "detail": f"Median reach per post was {_n(r)} recently vs {_n(p)} before ({_pct(change)}, {len(recent)} vs {len(prior)} posts).",
            "evidence": {"recent_median": r, "prior_median": p, "recent_posts": len(recent), "prior_posts": len(prior)},
        }
    falling = change < 0
    return {
        "id": "trend",
        "tone": "negative" if falling else "positive",
        "title": "Reach per post fell" if falling else "Reach per post rose",
        "detail": (
            f"Median reach per post {'fell' if falling else 'rose'} from {_n(p)} to {_n(r)} ({_pct(change)}), "
            f"comparing the latest {len(recent)} posts with the {len(prior)} before them."
        ),
        "evidence": {"recent_median": r, "prior_median": p, "recent_posts": len(recent), "prior_posts": len(prior)},
    }


def _frequency_finding(recent, prior, recent_weeks, prior_weeks, reach_falling: bool) -> Optional[Dict]:
    r_rate, p_rate = len(recent) / recent_weeks, len(prior) / prior_weeks
    if p_rate <= 0 or len(prior) < MIN_POSTS_PER_GROUP:
        return None
    change = (r_rate - p_rate) / p_rate
    if change > -FREQUENCY_THRESHOLD or (p_rate - r_rate) < 0.75:
        return None
    detail = f"Posting dropped from about {p_rate:.1f} to {r_rate:.1f} posts a week."
    if reach_falling:
        detail += " Reach per post fell over the same period."
    return {
        "id": "frequency",
        "tone": "negative",
        "title": "Get back to your usual posting rhythm",
        "detail": detail,
        "action": f"Aim for about {round(p_rate)} posts a week again, the rate you kept before the drop.",
        "evidence": {"recent_per_week": round(r_rate, 2), "prior_per_week": round(p_rate, 2)},
    }


def _format_finding(posts, recent, prior) -> Optional[Dict]:
    stats = posts.groupby("post_type")["reach"].agg(["median", "count"])
    stats = stats[(stats["count"] >= MIN_POSTS_PER_GROUP) & (stats.index != "Other")]
    if len(stats) < 2:
        return None
    best, worst = stats["median"].idxmax(), stats["median"].idxmin()
    ratio = stats.loc[best, "median"] / max(stats.loc[worst, "median"], 1.0)
    if ratio < FORMAT_RATIO:
        return None

    best_word, worst_word = FORMAT_PLURAL.get(best, best.lower()), FORMAT_PLURAL.get(worst, worst.lower())
    detail = (
        f"{best_word.capitalize()} got {ratio:.1f}x the reach of {worst_word} "
        f"(median {_n(stats.loc[best, 'median'])} across {int(stats.loc[best, 'count'])} posts vs "
        f"{_n(stats.loc[worst, 'median'])} across {int(stats.loc[worst, 'count'])})."
    )
    evidence = {
        "best_format": best,
        "best_median": float(stats.loc[best, "median"]),
        "worst_format": worst,
        "worst_median": float(stats.loc[worst, "median"]),
        "ratio": round(float(ratio), 2),
    }

    recent_share = (recent["post_type"] == best).mean() if len(recent) else 0.0
    prior_share = (prior["post_type"] == best).mean() if len(prior) else 0.0
    evidence.update({"recent_share": round(float(recent_share), 2), "prior_share": round(float(prior_share), 2)})

    if len(recent) >= MIN_POSTS_PER_GROUP and prior_share - recent_share >= MIX_SHIFT:
        recent_best = int((recent["post_type"] == best).sum())
        verb = f"was a {best.lower()}" if recent_best == 1 else f"were {best_word}"
        detail += f" But only {recent_best} of the latest {len(recent)} posts {verb}, down from {prior_share * 100:.0f}% before."
        target = max(2, round(prior_share * 7)) if prior_share > 0 else 2
        return {
            "id": "format",
            "tone": "negative",
            "title": f"Post more {best_word}",
            "detail": detail,
            "action": f"Make at least {target} of the next 7 posts {best_word}. They have been this account's strongest format.",
            "evidence": evidence,
        }
    return {
        "id": "format",
        "tone": "positive",
        "title": f"{best_word.capitalize()} are your strongest format",
        "detail": detail,
        "action": f"Keep {best_word} as the main format, and test {worst_word} less often.",
        "evidence": evidence,
    }


def _weekday_finding(posts) -> Optional[Dict]:
    by_day = posts.assign(weekday=posts["published"].dt.day_name()).groupby("weekday")["reach"].agg(["median", "count"])
    by_day = by_day[by_day["count"] >= MIN_POSTS_PER_GROUP]
    if len(by_day) < 3:
        return None
    overall = posts["reach"].median()
    best = by_day["median"].idxmax()
    ratio = by_day.loc[best, "median"] / max(overall, 1.0)
    if ratio < WEEKDAY_RATIO:
        return None
    return {
        "id": "weekday",
        "tone": "positive",
        "title": f"{best} posts do best",
        "detail": (
            f"Posts published on {best} reached a median of {_n(by_day.loc[best, 'median'])}, "
            f"{ratio:.1f}x the account's overall median of {_n(overall)} ({int(by_day.loc[best, 'count'])} posts)."
        ),
        "action": f"Schedule the week's most important post for {best}.",
        "evidence": {"weekday": best, "weekday_median": float(by_day.loc[best, "median"]), "overall_median": float(overall)},
    }


def _post_summary(row) -> Dict:
    caption = (row["caption"] or "").strip().replace("\n", " ")
    return {
        "date": row["published"].strftime("%Y-%m-%d"),
        "type": row["post_type"],
        "reach": float(row["reach"]),
        "caption": caption[:90] + ("…" if len(caption) > 90 else ""),
        "permalink": row["permalink"] or None,
    }


def analyze_posts(posts: pd.DataFrame) -> Dict:
    """Return evidence-backed findings plus a per-day series for the anomaly engine."""
    recent, prior, recent_weeks, prior_weeks = _periods(posts)

    trend = _trend_finding(recent, prior)
    reach_falling = bool(trend and trend["tone"] == "negative")
    candidates = [
        _format_finding(posts, recent, prior),
        _frequency_finding(recent, prior, recent_weeks, prior_weeks, reach_falling),
        _weekday_finding(posts),
    ]
    # Negative (fixable) findings first, then positives
    actionable = sorted([f for f in candidates if f], key=lambda f: 0 if f["tone"] == "negative" else 1)
    findings = ([trend] if trend else []) + actionable

    by_reach = posts.sort_values("reach", ascending=False)
    daily = posts.assign(day=posts["published"].dt.strftime("%Y-%m-%d")).groupby("day")["reach"].mean()

    formats = (
        posts.groupby("post_type")["reach"].agg(["median", "count"]).sort_values("median", ascending=False).reset_index()
    )

    return {
        "post_count": int(len(posts)),
        "period_start": posts["published"].min().strftime("%Y-%m-%d"),
        "period_end": posts["published"].max().strftime("%Y-%m-%d"),
        "median_reach": float(posts["reach"].median()),
        "findings": findings,
        "formats": [
            {"type": r["post_type"], "median_reach": float(r["median"]), "posts": int(r["count"])} for _, r in formats.iterrows()
        ],
        "top_posts": [_post_summary(r) for _, r in by_reach.head(3).iterrows()],
        "bottom_posts": [_post_summary(r) for _, r in by_reach.tail(3).iloc[::-1].iterrows()],
        "daily_series": {"dates": list(daily.index), "values": [float(v) for v in daily.values]},
    }
