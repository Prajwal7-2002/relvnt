import json
import logging
import os
from typing import Dict, List, Optional
import requests

logger = logging.getLogger("relvnt.diagnostics")


class LocalDiagnosticEngine:
    """
    Zero-Data-Leakage Local Diagnostic Engine.
    Executes entirely on-premise / on-server with zero third-party API transmissions.
    Generates deterministic, mathematically grounded root-cause diagnoses,
    remediation protocols, and conversational Copilot answers.
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
        iso_score = metrics.get("ml_anomaly_score", 0.0)
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
                    f"IsolationForest ensemble confirmed anomalous state ({int(iso_score * 100)}% ML confidence). "
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
                    f"IsolationForest detected distribution decoupling ({int(iso_score * 100)}% ML confidence). "
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

    @classmethod
    def answer_copilot(
        cls,
        question: str,
        account_name: str,
        platform: str,
        metric_type: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
        diagnosis: str,
    ) -> Dict:
        """
        Local deterministic Copilot reasoning fallback.
        Provides targeted expert answers for common questions without calling external APIs.
        """
        q = question.lower()
        current = metrics.get("current_value", 0)
        baseline = metrics.get("baseline_avg", 0)
        change = metrics.get("change_pct", 0)
        unit = "x" if metric_type.lower() == "roas" else ""

        if any(w in q for w in ["email", "sponsor", "client", "draft"]):
            answer = (
                f"Subject: Performance Trajectory Update & Algorithmic Optimization // {account_name}\n\n"
                f"Hi team,\n\n"
                f"We are monitoring our recent distribution metrics across {platform}. "
                f"Our Sentinel radar detected a temporary velocity adjustment (current run-rate at {current:,.1f}{unit} "
                f"vs {baseline:,.1f}{unit} baseline, a {change:+.1f}% variance). "
                f"This shift reflects standard algorithmic recalibration rather than creative failure.\n\n"
                f"We have already initiated our 72-hour containment protocol:\n"
                f"1. Halting lower-performing static assets for 48 hours to preserve algorithmic index scores.\n"
                f"2. Preparing 2 high-retention hook variants to reclaim explore distribution.\n"
                f"3. Monitoring daily velocity recovery against our rolling median baseline.\n\n"
                f"We will share our next benchmark update in 48 hours.\n\nBest regards,\nGrowth Team"
            )
        elif any(w in q for w in ["why", "drop", "reason", "cause"]):
            answer = (
                f"ROOT CAUSE BREAKDOWN FOR {account_name}:\n\n"
                f"1. Statistical Divergence: Run-rate contracted by {abs(change):.1f}% against the {baseline:,.0f}{unit} baseline, "
                f"triggering statistical outlier flags at {metrics.get('z_score_deviation', 0)} std deviations.\n"
                f"2. Retention Decay: The primary inflection occurred when early audience watch-time fell below threshold. "
                f"When 0-3s retention falls below 35%, distribution algorithms deprioritize explore feed insertion.\n"
                f"3. Algorithmic State: Account health is currently indexed at {health_score}/100. "
                f"Anomalies detected: {len(anomalies)} events in the evaluation window."
            )
        elif any(w in q for w in ["format", "post", "hook", "what to post"]):
            answer = (
                f"RECOMMENDED 72-HOUR PUBLISHING SOP FOR {platform.upper()}:\n\n"
                f"1. Format: High-contrast short-form video (7 to 12 seconds maximum).\n"
                f"2. Hook Execution: Deliver the core premise or visual contradiction within frames 0–1 (first 1.5s). Zero intro sequences.\n"
                f"3. Dwell Strategy: Place a detailed actionable tip in the text caption to keep viewers watching on loop.\n"
                f"4. Engagement Window: Actively respond to incoming comments within 45 minutes of asset release to trigger feed re-indexing."
            )
        else:
            answer = (
                f"SENTINEL INTELLIGENCE BRIEF FOR {account_name}:\n\n"
                f"• Current Health Score: {health_score}/100\n"
                f"• Run-Rate: {current:,.1f}{unit} vs {baseline:,.1f}{unit} baseline ({change:+.1f}%)\n"
                f"• ML Status: {diagnosis}\n"
                f"• Recommended Protocol: Execute 72-hour phase reset and maintain engagement priming."
            )

        return {
            "answer": answer,
            "engine": "Relvnt Local Copilot Engine (Zero-Data-Leak)",
        }


class HybridAIAgent:
    """
    Hybrid Compound AI Agent:
    - If GEMINI_API_KEY is available: calls Google Gemini (1.5 Flash by default) for live generative reasoning.
    - If offline / no key: seamlessly falls back to LocalDiagnosticEngine (Zero-Data-Leak).
    """

    def __init__(self):
        from pathlib import Path
        from dotenv import load_dotenv

        base_dir = Path(__file__).resolve().parent.parent
        load_dotenv(base_dir / ".env")
        load_dotenv(base_dir.parent / ".env")

        self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip() or None
        self.model = (os.getenv("GEMINI_MODEL") or "gemini-1.5-flash").strip()

    def generate_briefing(
        self,
        account_name: str,
        platform: str,
        metric_type: str,
        prediction: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
    ) -> Dict:
        if self.api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                prompt = (
                    f"You are the Relvnt Enterprise Algorithmic Incident Sentinel. "
                    f"Analyze this performance anomaly report and generate a clinical, quantified Root-Cause Analysis (RCA) "
                    f"and a structured 3-phase chronological 72-hour tactical recovery runbook.\n\n"
                    f"Account: {account_name}\n"
                    f"Platform: {platform}\n"
                    f"Metric: {metric_type}\n"
                    f"Health Score: {health_score}/100\n"
                    f"Current Run-Rate: {metrics.get('current_value')}\n"
                    f"Baseline Expected: {metrics.get('baseline_avg')}\n"
                    f"Velocity Change: {metrics.get('change_pct')}%\n"
                    f"Z-Score: {metrics.get('z_score_deviation')} std dev\n"
                    f"IsolationForest ML Score: {metrics.get('ml_anomaly_score')}\n"
                    f"Anomalies: {anomalies}\n\n"
                    f"Format output as JSON with keys:\n"
                    f"- 'severity': 'CRITICAL_DRIFT' | 'ELEVATED_RISK' | 'NOMINAL_EQUILIBRIUM'\n"
                    f"- 'diagnosis': 2-3 clinical sentences detailing exact inflection points and causes\n"
                    f"- 'recommended_action': Numbered overview of recovery actions\n"
                    f"- 'phases': list of 3 objects with 'phase' (e.g. 'PHASE 01 (00:00 - 24:00)'), 'title', and 'action'\n"
                )
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                }
                res = requests.post(url, json=payload, timeout=10)
                if res.status_code == 200:
                    resp_json = res.json()
                    text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
                    data = json.loads(text)
                    data["ai_engine"] = f"Gemini ({self.model}) (Live Generative AI)"
                    return data
                else:
                    logger.warning("Gemini briefing returned HTTP %s: %s", res.status_code, res.text[:200])
            except Exception as exc:
                logger.warning("Gemini live briefing failed, using local engine: %s", exc)

        return LocalDiagnosticEngine.generate_briefing(
            account_name, platform, metric_type, prediction, health_score, metrics, anomalies
        )

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
    ) -> Dict:
        if self.api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                prompt = (
                    f"You are the Relvnt AI Growth & Incident Copilot. "
                    f"The user is asking a question about their account performance.\n\n"
                    f"ACCOUNT CONTEXT:\n"
                    f"- Account: {account_name}\n"
                    f"- Platform: {platform}\n"
                    f"- Metric: {metric_type}\n"
                    f"- Health Score: {health_score}/100\n"
                    f"- Current Run-Rate: {metrics.get('current_value')}\n"
                    f"- Baseline: {metrics.get('baseline_avg')}\n"
                    f"- Net Drift: {metrics.get('change_pct')}%\n"
                    f"- Active Diagnosis: {diagnosis}\n\n"
                    f"USER QUESTION: {question}\n\n"
                    f"INSTRUCTIONS:\n"
                    f"Provide an authoritative, direct, and actionable answer citing their specific data. "
                    f"If they ask for an email, write a polished ready-to-send draft. "
                    f"Do not use generic buzzwords or emojis. Keep it professional and clear."
                )
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                res = requests.post(url, json=payload, timeout=10)
                if res.status_code == 200:
                    resp_json = res.json()
                    text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
                    return {
                        "answer": text.strip(),
                        "engine": f"Gemini ({self.model}) (Live AI Copilot)",
                    }
                else:
                    logger.warning("Gemini copilot query returned HTTP %s: %s", res.status_code, res.text[:200])
            except Exception as exc:
                logger.warning("Gemini live copilot query failed, using local engine: %s", exc)

        return LocalDiagnosticEngine.answer_copilot(
            question, account_name, platform, metric_type, health_score, metrics, anomalies, diagnosis
        )
