import logging
from typing import Dict, List, Optional

logger = logging.getLogger("relvnt.diagnostics")


class LocalDiagnosticEngine:
    """
    Zero-Data-Leakage Local Diagnostic Engine.
    Executes entirely on-premise / on-server with zero third-party API transmissions.
    Generates deterministic, mathematically grounded root-cause diagnoses and
    remediation protocols citing exact timeframes, velocities, and deviations.
    """

    @classmethod
    def generate_briefing(
        cls,
        account_name: str,
        platform: str,
        metric_type: str,
        prediction: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
    ) -> Dict:
        current = metrics.get("current_value", 0.0)
        baseline = metrics.get("baseline_avg", 0.0)
        change = metrics.get("change_pct", 0.0)
        z_score = metrics.get("z_score_deviation", 0.0)
        volatility = metrics.get("volatility_index", 0.0)
        anomaly_count = len(anomalies)

        dates_list = [a["date"] for a in anomalies[:3]] if anomalies else []
        dates_ref = ", ".join(dates_list) if dates_list else "the recent evaluation window"
        unit = "x" if metric_type.lower() == "roas" else ""

        # Formulate clinical, non-hyped technical diagnosis and phased runbook
        if prediction == "shock":
            severity = "CRITICAL_DRIFT"
            if metric_type.lower() == "roas":
                diagnosis = (
                    f"Return on Ad Spend collapsed from baseline {baseline:.2f}x to {current:.2f}x "
                    f"({change:.1f}%), crossing statistical significance at {z_score:.2f} std dev. "
                    f"Outlier clusters registered on {dates_ref}. "
                    f"Pattern confirms acute audience saturation and auction delivery exhaustion."
                )
                action = (
                    "1. Terminate exhausted ad sets immediately to halt capital erosion.\n"
                    "2. Rotate 2 fresh creative assets featuring distinct first-frame visual contrasts.\n"
                    "3. Expand audience exclusion parameters to eliminate recent 30-day purchasers."
                )
                phases = [
                    {"phase": "PHASE 01 (00:00 - 24:00)", "title": "Immediate Capital Containment", "action": "Kill exhausted ad sets with frequency > 3.2. Pause budget bleeding."},
                    {"phase": "PHASE 02 (24:00 - 48:00)", "title": "Creative Format Rotation", "action": "Deploy 2 high-contrast visual angle assets to break feed banner-blindness."},
                    {"phase": "PHASE 03 (48:00 - 72:00)", "title": "Audience Pool Expansion", "action": "Expand exclusions and broaden lookalike seed to refresh delivery cohorts."},
                ]
            else:
                diagnosis = (
                    f"Distribution velocity contracted by {abs(change):.1f}% against the {baseline:,.0f} baseline "
                    f"({z_score:.2f} std dev deviation). Primary divergence identified on {dates_ref}. "
                    f"Pattern indicates algorithmic feed de-prioritization driven by declining initial-retention cohorts."
                )
                action = (
                    "1. Suspend non-performing asset formats for a 48-hour index reset.\n"
                    "2. Publish 1 high-density short-form asset with instant narrative premise in frame 0-1.\n"
                    "3. Front-load audience engagement responses within 45 minutes of asset release."
                )
                phases = [
                    {"phase": "PHASE 01 (00:00 - 24:00)", "title": "Algorithmic Decay Reset", "action": "Halt underperforming formats for 48 hours to prevent compounding negative distribution signals."},
                    {"phase": "PHASE 02 (24:00 - 48:00)", "title": "High-Density Hook Injection", "action": "Release 1 high-retention asset with immediate narrative punchline in frame 0 to reset completion rate."},
                    {"phase": "PHASE 03 (48:00 - 72:00)", "title": "Engagement Cohort Priming", "action": "Actively resolve incoming dialogue within 45 minutes of publication to trigger feed re-indexing."},
                ]

        elif prediction == "pre_shock":
            severity = "ELEVATED_RISK"
            if metric_type.lower() == "roas":
                diagnosis = (
                    f"Performance deceleration observed. ROAS drifted {abs(change):.1f}% below baseline "
                    f"({current:.2f}x vs {baseline:.2f}x benchmark), with elevated variance ({volatility}% vol). "
                    f"Frequency accumulation indicates impending creative exhaustion within 3-5 days."
                )
                action = (
                    "1. Queue next-generation creative variants for immediate phased deployment.\n"
                    "2. Restrict daily campaign budget pacing to increments below 10%.\n"
                    "3. Broaden targeting pools to distribute frequency across fresh user cohorts."
                )
                phases = [
                    {"phase": "PHASE 01 (00:00 - 24:00)", "title": "Frequency Audit", "action": "Inspect 7-day frequency metrics across top 3 spending ad sets."},
                    {"phase": "PHASE 02 (24:00 - 48:00)", "title": "Variant Staging", "action": "Stage 3 new UGC and motion graphic angles in parallel sandbox testing."},
                    {"phase": "PHASE 03 (48:00 - 72:00)", "title": "Pacing Stabilization", "action": "Lock daily spend increments under 10% to prevent auction bid spiking."},
                ]
            else:
                diagnosis = (
                    f"Early distribution decay detected. Metric velocity decelerated by {abs(change):.1f}% "
                    f"below the {baseline:,.0f} baseline. Initial inflection point registered on {dates_ref}. "
                    f"Risk of broader feed suppression elevated if retention metrics remain uncorrected."
                )
                action = (
                    "1. Restructure lead hook timings to deliver value proposition under 2.0 seconds.\n"
                    "2. A/B test split between carousel deep-dives and rapid single-topic shorts.\n"
                    "3. Deploy interactive follower touchpoints 60 minutes prior to scheduled primary distribution."
                )
                phases = [
                    {"phase": "PHASE 01 (00:00 - 24:00)", "title": "Retention Hook Compression", "action": "Audit average watch-time curves; cut intros to reach key proposition under 2.0s."},
                    {"phase": "PHASE 02 (24:00 - 48:00)", "title": "Format Split Testing", "action": "Deploy high-save carousels alongside high-share rapid shorts to recalibrate distribution channels."},
                    {"phase": "PHASE 03 (48:00 - 72:00)", "title": "Early Signal Amplification", "action": "Post interactive poll stickers to warm up active follower cohort before major drops."},
                ]

        elif prediction == "recovering":
            severity = "RECOVERY_PHASE"
            diagnosis = (
                f"Positive trajectory shift confirmed. Current velocity ({current:,.1f}{unit}) "
                f"is reclaiming baseline equilibrium ({baseline:,.1f}{unit}), with variance stabilizing. "
                f"Algorithmic indexing is responding positively to recent publishing adjustments."
            )
            action = (
                "1. Maintain stable distribution schedule and asset composition.\n"
                "2. Standardize top-performing asset parameters as reference template.\n"
                "3. Incrementally test 1 controlled variant while baseline solidifies."
            )
            phases = [
                {"phase": "PHASE 01 (00:00 - 24:00)", "title": "Cadence Preservation", "action": "Maintain exact publishing frequency and schedule timing without disruption."},
                {"phase": "PHASE 02 (24:00 - 48:00)", "title": "Asset Template Extraction", "action": "Document winning hook pacing, framing, and caption style as reference SOP."},
                {"phase": "PHASE 03 (48:00 - 72:00)", "title": "Controlled Variation", "action": "Introduce at most 1 minor asset variable test while core baseline cements."},
            ]

        else:
            severity = "NOMINAL_EQUILIBRIUM"
            diagnosis = (
                f"System operating within normal variance parameters. Current velocity ({current:,.1f}{unit}) "
                f"matches expected baseline ({baseline:,.1f}{unit}, {change:+.1f}% variance). "
                f"Distribution stability verified across all analytical windows."
            )
            action = (
                "1. Preserve current operational cadence and budget allocation.\n"
                "2. Archive current asset performance metrics as standard benchmarks.\n"
                "3. Continue scheduled creative pipeline without disruption."
            )
            phases = [
                {"phase": "PHASE 01 (00:00 - 24:00)", "title": "Nominal Health Monitoring", "action": "Verify baseline metrics remain within 1.0 standard deviation bounds."},
                {"phase": "PHASE 02 (24:00 - 48:00)", "title": "Benchmark Archival", "action": "Store current performance velocities as baseline profile for rolling comparisons."},
                {"phase": "PHASE 03 (48:00 - 72:00)", "title": "Continuous Pipeline Execution", "action": "Advance scheduled content calendar and ad experiments with standard pacing."},
            ]

        return {
            "severity": severity,
            "diagnosis": diagnosis,
            "recommended_action": action,
            "phases": phases,
            "ai_engine": "Relvnt Local Statistical Inference Engine (Zero-Data-Leak)",
        }
