from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from services.ai_agent import AIDiagnosticAgent


class AnomalyEngine:
    """
    Lightweight, robust time-series anomaly and performance intelligence engine.
    Detects sudden suppression (shocks), gradual fatigue (pre-shock), and recovery
    across organic reach, video views, ad ROAS, and engagement.
    """

    def __init__(self):
        self.ai_agent = AIDiagnosticAgent()

    def analyze_series(
        self,
        dates: List[str],
        values: List[float],
        metric_type: str = "reach",
        account_name: Optional[str] = None,
        platform: str = "instagram",
    ) -> Dict:
        if len(values) < 7:
            raise ValueError("At least 7 data points are required for time-series analysis.")

        df = pd.DataFrame({"date": dates, "value": [float(v) for v in values]})
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)

        series = df["value"].values
        n = len(series)

        # Baselines & Moving Averages
        short_window = min(7, max(3, n // 4))
        long_window = min(14, max(5, n // 2))

        rolling_short = pd.Series(series).rolling(window=short_window, min_periods=1).mean().values
        rolling_long = pd.Series(series).rolling(window=long_window, min_periods=1).mean().values
        rolling_std = pd.Series(series).rolling(window=long_window, min_periods=2).std().fillna(1e-5).values

        # Current vs Baseline
        current_val = float(series[-1])
        recent_avg = float(np.mean(series[-short_window:]))
        baseline_avg = float(np.mean(series[-long_window:-short_window])) if n >= long_window + short_window else float(np.mean(series))
        if baseline_avg <= 0:
            baseline_avg = 1.0

        change_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100.0

        # Anomaly scoring via Z-Score of the recent slope
        recent_std = float(rolling_std[-1])
        z_score = float((recent_avg - baseline_avg) / (recent_std if recent_std > 0 else 1.0))

        # Recent 3-day slope / velocity
        slope_3d = float((series[-1] - series[-min(3, n)]) / max(1, min(3, n)))

        # Determine State Classification
        # 0 = normal, 1 = pre_shock, 2 = shock, 3 = recovering
        if change_pct < -30.0 or z_score < -2.2:
            prediction_label = "shock"
            health_score = max(5, min(39, int(round(35 + (z_score * 5)))))
            alert_level = "red"
            confidence = min(0.96, max(0.70, 0.75 + abs(change_pct) / 200.0))
        elif change_pct < -12.0 or z_score < -1.2 or (slope_3d < 0 and change_pct < -8.0):
            prediction_label = "pre_shock"
            health_score = max(40, min(69, int(round(60 + (change_pct * 0.8)))))
            alert_level = "yellow"
            confidence = min(0.94, max(0.68, 0.70 + abs(change_pct) / 100.0))
        elif slope_3d > 0 and change_pct > -10.0 and series[-1] > series[-min(4, n)]:
            if change_pct < 5.0 and len(series) > 10 and np.mean(series[-10:-5]) < baseline_avg:
                prediction_label = "recovering"
                health_score = max(60, min(80, int(round(65 + change_pct))))
                alert_level = "yellow"
                confidence = 0.82
            else:
                prediction_label = "normal"
                health_score = max(70, min(100, int(round(82 + min(18, change_pct * 0.5)))))
                alert_level = "green"
                confidence = 0.90
        else:
            prediction_label = "normal"
            health_score = max(70, min(100, int(round(75 + max(-5, min(25, change_pct * 0.5))))))
            alert_level = "green"
            confidence = 0.88

        # Identify anomaly points (points where rolling Z-score deviated > 1.8)
        anomaly_points = []
        for i in range(len(series)):
            pt_val = series[i]
            expected = rolling_long[i]
            std = rolling_std[i]
            if std > 0 and (expected - pt_val) / std > 1.8:
                anomaly_points.append(
                    {
                        "date": df["date"].iloc[i].strftime("%Y-%m-%d"),
                        "value": float(pt_val),
                        "deviation": round(float((pt_val - expected) / expected * 100.0), 1),
                    }
                )

        metrics_summary = {
            "current_value": round(current_val, 1),
            "recent_avg": round(recent_avg, 1),
            "baseline_avg": round(baseline_avg, 1),
            "change_pct": round(change_pct, 1),
            "anomaly_count": len(anomaly_points),
        }

        # Generate deep, dynamic, natural diagnosis and recovery plan via AI Agent
        briefing = self.ai_agent.generate_briefing(
            account_name=account_name or "Connected Account",
            platform=platform,
            metric_type=metric_type,
            prediction=prediction_label,
            health_score=health_score,
            metrics=metrics_summary,
            anomalies=anomaly_points,
        )

        series_data = [
            {"date": row["date"].strftime("%Y-%m-%d"), "reach": int(round(row["value"]))}
            for _, row in df.iterrows()
        ]

        return {
            "account_name": account_name or "Connected Account",
            "platform": platform,
            "metric_type": metric_type,
            "health_score": health_score,
            "alert_level": alert_level,
            "prediction": prediction_label,
            "confidence": round(confidence, 2),
            "recommended_action": briefing["recommended_action"],
            "diagnosis": briefing["diagnosis"],
            "ai_engine": briefing.get("ai_engine", "Dynamic AI Synthesizer"),
            "metrics_summary": metrics_summary,
            "anomalies": anomaly_points,
            "reach_data": series_data,
            "data_source": "live_dataset",
        }
