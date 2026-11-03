from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from services.ai_agent import HybridAIAgent, LocalDiagnosticEngine


class AnomalyEngine:
    """
    Production-Grade Self-Calibrating Anomaly & Performance Intelligence Engine.
    Features:
    - Outlier-Resistant Baseline (Winsorized estimation to prevent viral-post distortion)
    - Day-of-Week Seasonality Normalization (eliminates false weekend dip alarms)
    - Scikit-Learn IsolationForest (100 Decision Trees fitted on 5D time-series feature space)
    - Multi-scale velocity and acceleration tracking (detects pre-shock early warnings)
    - Quantified Impact Modeling (projected revenue/reach at risk)
    """

    def __init__(self):
        self.ai_agent = HybridAIAgent()

    def _normalize_seasonality(self, df: pd.DataFrame) -> np.ndarray:
        """
        Calculates day-of-week index and returns deseasonalized series
        to prevent weekend traffic drops from triggering false suppression warnings.
        """
        values = df["value"].values
        day_of_week = (
            df["date"].dt.day_of_week.values
            if hasattr(df["date"].dt, "day_of_week")
            else df["date"].dt.dayofweek.values
        )

        # If series is short (< 14 days), skip seasonal adjustment
        if len(values) < 14:
            return values

        # Calculate average value per day of week
        overall_mean = np.mean(values)
        if overall_mean <= 0:
            return values

        dow_means = {}
        for dow in range(7):
            mask = day_of_week == dow
            if np.any(mask):
                dow_means[dow] = np.mean(values[mask])
            else:
                dow_means[dow] = overall_mean

        # Create seasonal factor per day (clipped to avoid extreme zero scaling)
        seasonal_factors = np.array(
            [max(0.4, min(2.5, dow_means[d] / overall_mean)) for d in day_of_week]
        )
        return values / seasonal_factors

    def _fit_isolation_forest(
        self, raw_series: np.ndarray, deseasonalized: np.ndarray, baseline_avg: float
    ) -> Tuple[np.ndarray, float, bool]:
        """
        Fits an unsupervised Scikit-learn IsolationForest (100 Decision Trees)
        on a 5-dimensional feature space engineered from the time-series:
        1. Deseasonalized value
        2. 3-day velocity slope (1st derivative)
        3. 3-day acceleration rate (2nd derivative)
        4. Rolling volatility index
        5. Distance ratio to baseline
        """
        n = len(raw_series)
        if n < 7:
            return np.ones(n), 0.10, False

        # 1. 3-day slope
        slope_series = np.zeros(n)
        for i in range(n):
            prev_idx = max(0, i - 3)
            slope_series[i] = (raw_series[i] - raw_series[prev_idx]) / max(1, i - prev_idx)

        # 2. Acceleration (rate of change of slope)
        accel_series = np.gradient(slope_series)

        # 3. Rolling volatility
        vol_series = pd.Series(deseasonalized).rolling(window=min(7, n), min_periods=1).std().fillna(0).values

        # 4. Baseline ratio
        ratio_series = (raw_series - baseline_avg) / (baseline_avg if baseline_avg > 0 else 1.0)

        # Build 5D feature matrix
        X = np.column_stack([deseasonalized, slope_series, accel_series, vol_series, ratio_series])

        iso = IsolationForest(n_estimators=100, contamination=0.10, random_state=42)
        iso.fit(X)
        scores = iso.decision_function(X)
        preds = iso.predict(X)

        current_score = scores[-1]
        is_ml_outlier = bool(preds[-1] == -1)

        # Convert decision function score to a 0.05 to 0.98 probability index
        anomaly_prob = float(np.clip(0.5 - (current_score * 1.5), 0.05, 0.98))

        return preds, round(anomaly_prob, 2), is_ml_outlier

    def analyze_series(
        self,
        dates: List[str],
        values: List[float],
        metric_type: str = "reach",
        account_name: Optional[str] = None,
        platform: str = "instagram",
    ) -> Dict:
        if len(values) < 7:
            raise ValueError("At least 7 data points are required for statistical performance evaluation.")

        df = pd.DataFrame({"date": pd.to_datetime(dates), "value": [float(v) for v in values]})
        df = df.sort_values("date").reset_index(drop=True)

        raw_series = df["value"].values
        n = len(raw_series)

        # 1. Seasonality & Outlier Protection
        deseasonalized = self._normalize_seasonality(df)

        # Baseline window (14 to 30 days)
        short_window = min(7, max(3, n // 4))
        long_window = min(30, max(7, n // 2))

        # 2. Outlier-Resistant Baseline via Winsorization (Caps top 10% viral spikes)
        p90 = np.percentile(raw_series, 90)
        winsorized_series = np.clip(raw_series, None, p90 * 1.25)

        # Calculate baselines
        baseline_slice = winsorized_series[-long_window:-short_window] if n >= long_window + short_window else winsorized_series
        baseline_avg = float(np.median(baseline_slice))
        if baseline_avg <= 0:
            baseline_avg = float(np.mean(baseline_slice)) or 1.0

        current_val = float(raw_series[-1])
        recent_avg = float(np.mean(raw_series[-short_window:]))

        # Velocity change percentage
        change_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100.0

        # Rolling standard deviation and Volatility
        rolling_std = pd.Series(deseasonalized).rolling(window=short_window, min_periods=2).std().fillna(1e-5).values
        recent_std = float(rolling_std[-1])
        z_score = float((recent_avg - baseline_avg) / (recent_std if recent_std > 0 else 1.0))
        volatility_index = min(100.0, round(float((recent_std / baseline_avg) * 100.0), 1))

        # 3-Day Slope Velocity
        slope_3d = float((raw_series[-1] - raw_series[-min(3, n)]) / max(1, min(3, n)))

        # 3. Fit Machine Learning Model: Scikit-Learn IsolationForest
        iso_preds, ml_anomaly_score, is_ml_outlier = self._fit_isolation_forest(
            raw_series, deseasonalized, baseline_avg
        )

        # 4. Intelligent Classification
        if change_pct < -30.0 or z_score < -2.2 or (is_ml_outlier and change_pct < -20.0):
            prediction_label = "shock"
            health_score = max(5, min(38, int(round(35 + (z_score * 4.5)))))
            alert_level = "red"
            confidence = min(0.96, max(0.72, 0.78 + abs(change_pct) / 250.0))
        elif change_pct < -12.0 or z_score < -1.1 or (slope_3d < 0 and change_pct < -8.0) or is_ml_outlier:
            prediction_label = "pre_shock"
            health_score = max(40, min(69, int(round(58 + (change_pct * 0.75)))))
            alert_level = "yellow"
            confidence = min(0.93, max(0.70, 0.72 + abs(change_pct) / 120.0))
        elif slope_3d > 0 and change_pct > -10.0 and raw_series[-1] > raw_series[-min(4, n)]:
            if change_pct < 5.0 and len(raw_series) > 10:
                prediction_label = "recovering"
                health_score = max(60, min(82, int(round(65 + change_pct))))
                alert_level = "yellow"
                confidence = 0.84
            else:
                prediction_label = "normal"
                health_score = max(72, min(100, int(round(82 + min(18, change_pct * 0.5)))))
                alert_level = "green"
                confidence = 0.91
        else:
            prediction_label = "normal"
            health_score = max(70, min(100, int(round(76 + max(-5, min(24, change_pct * 0.4))))))
            alert_level = "green"
            confidence = 0.88

        # 5. Anomaly Point Detection (deseasonalized outliers > 1.8 std or ML outlier flag)
        rolling_mean_long = pd.Series(deseasonalized).rolling(window=long_window, min_periods=1).mean().values
        rolling_std_long = pd.Series(deseasonalized).rolling(window=long_window, min_periods=2).std().fillna(1e-5).values
        anomaly_points = []

        for i in range(len(raw_series)):
            pt_deseas = deseasonalized[i]
            exp_val = rolling_mean_long[i]
            std_val = rolling_std_long[i]
            if (std_val > 0 and (exp_val - pt_deseas) / std_val > 1.8) or (iso_preds[i] == -1 and (exp_val - pt_deseas) > 0):
                anomaly_points.append(
                    {
                        "date": df["date"].iloc[i].strftime("%Y-%m-%d"),
                        "value": float(round(raw_series[i], 2)),
                        "deviation": round(float((pt_deseas - exp_val) / exp_val * 100.0), 1),
                    }
                )

        # 6. Quantified Impact Modeling
        if metric_type.lower() == "roas":
            daily_loss = max(0.0, (baseline_avg - current_val) * 150.0)
            projected_impact = f"Est. ${int(daily_loss * 7):,} ad spend efficiency at risk over 7 days"
        else:
            lost_impressions = max(0, int((baseline_avg - current_val) * 7))
            projected_impact = f"Est. -{lost_impressions:,} distribution deficit projected over 7 days"

        metrics_summary = {
            "current_value": round(current_val, 2),
            "recent_avg": round(recent_avg, 2),
            "baseline_avg": round(baseline_avg, 2),
            "change_pct": round(change_pct, 1),
            "z_score_deviation": round(z_score, 2),
            "volatility_index": volatility_index,
            "anomaly_count": len(anomaly_points),
            "projected_impact": projected_impact,
            "ml_model": "Scikit-Learn IsolationForest (100 Decision Trees)",
            "ml_anomaly_score": ml_anomaly_score,
            "ml_flagged": is_ml_outlier,
        }

        # 7. Cognitive AI Agent Briefing (Gemini 1.5 Flash or Local Fallback)
        briefing = self.ai_agent.generate_briefing(
            account_name=account_name or "Connected Account",
            platform=platform,
            metric_type=metric_type,
            prediction=prediction_label,
            health_score=health_score,
            metrics=metrics_summary,
            anomalies=anomaly_points,
        )

        anomaly_dates_set = {a["date"] for a in anomaly_points}
        series_data = []
        for i, row in df.iterrows():
            d_str = row["date"].strftime("%Y-%m-%d")
            series_data.append({
                "date": d_str,
                "reach": float(round(row["value"], 2)),
                "baseline": float(round(rolling_mean_long[i], 2)),
                "is_anomaly": d_str in anomaly_dates_set,
            })

        return {
            "account_name": account_name or "Connected Account",
            "platform": platform,
            "metric_type": metric_type,
            "health_score": health_score,
            "alert_level": alert_level,
            "severity": briefing.get("severity", "NOMINAL_EQUILIBRIUM"),
            "prediction": prediction_label,
            "confidence": round(confidence, 2),
            "recommended_action": briefing["recommended_action"],
            "diagnosis": briefing["diagnosis"],
            "protocol_phases": briefing.get("phases", []),
            "ai_engine": briefing.get("ai_engine", "Relvnt Local Statistical Inference Engine (Zero-Data-Leak)"),
            "metrics_summary": metrics_summary,
            "anomalies": anomaly_points,
            "reach_data": series_data,
            "data_source": "live_dataset",
        }

    def query_copilot(
        self,
        question: str,
        account_name: str,
        platform: str,
        metric_type: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
        diagnosis: str,
        agency_name: str = "Growth Agency Partner",
        auditor_name: str = "Lead Growth Strategist",
    ) -> Dict:
        return self.ai_agent.query_copilot(
            question=question,
            account_name=account_name,
            platform=platform,
            metric_type=metric_type,
            health_score=health_score,
            metrics=metrics,
            anomalies=anomalies,
            diagnosis=diagnosis,
            agency_name=agency_name,
            auditor_name=auditor_name,
        )
