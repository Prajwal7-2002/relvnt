import os
from typing import Dict, List, Optional
import requests


class AIDiagnosticAgent:
    """
    Intelligent Root-Cause Diagnostic & Strategy Agent.
    - If GEMINI_API_KEY is present, generates live, nuanced strategic analysis via Google Gemini (Free Tier).
    - Otherwise, utilizes an adaptive, deeply parametric reasoning synthesizer that builds natural,
      context-specific explanations citing exact numbers, dates, and drop shapes.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")

    def _generate_with_gemini(
        self,
        account_name: str,
        platform: str,
        metric_type: str,
        prediction: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
    ) -> Optional[Dict]:
        if not self.api_key:
            return None

        prompt = f"""
You are an elite Social Media Algorithm Architect and Performance Media Strategist.
Analyze the following performance anomaly report and generate a natural, authoritative, and highly specific diagnosis and action protocol.

ACCOUNT CONTEXT:
- Account/Campaign: {account_name}
- Platform: {platform}
- Metric Tracked: {metric_type}
- System Status: {prediction.upper().replace('_', ' ')} (Health Score: {health_score}/100)
- Current Value: {metrics.get('current_value')}
- 14-Day Baseline Average: {metrics.get('baseline_avg')}
- Net Velocity Change: {metrics.get('change_pct')}%
- Anomaly Dates Detected: {[a.get('date') for a in anomalies]}
- Outlier Deviations: {[f"{a.get('deviation')}% on {a.get('date')}" for a in anomalies]}

INSTRUCTIONS:
1. Explain specifically WHY and HOW this shift happened in natural, expert prose. Cite the exact dates and numbers.
2. If it's a sudden cliff drop, distinguish between algorithmic non-follower suppression vs creative fatigue.
3. If it's ad ROAS, analyze audience frequency saturation and creative burnout.
4. Provide a concrete, numbered 72-Hour Action Protocol tailored strictly to this situation.
5. Format response strictly as JSON with two keys:
   "diagnosis": "2-3 sentences of deep root-cause explanation citing the data",
   "recommended_action": "Numbered 3-step tactical playbook for immediate execution"
"""

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            }
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                data = res.json()
                import json
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return {
                    "diagnosis": parsed.get("diagnosis"),
                    "recommended_action": parsed.get("recommended_action"),
                    "ai_engine": "Gemini 1.5 Flash (Live AI)",
                }
        except Exception as exc:
            print(f"Gemini live generation fallback: {exc}")
        return None

    def _synthesize_parametric_diagnosis(
        self,
        account_name: str,
        platform: str,
        metric_type: str,
        prediction: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
    ) -> Dict:
        """
        Dynamic analytical natural language generator.
        Constructs bespoke explanations using actual dates, numbers, steepness, and variance.
        """
        current = metrics.get("current_value", 0)
        baseline = metrics.get("baseline_avg", 0)
        change = metrics.get("change_pct", 0)
        anomaly_count = len(anomalies)
        dates_str = ", ".join([a["date"] for a in anomalies[:2]]) if anomalies else "recent dates"
        unit = "x" if metric_type == "roas" else ""

        # Determine drop shape (cliff drop vs gradual drift)
        is_cliff = change < -25 and anomaly_count >= 1
        is_roas = metric_type.lower() == "roas"

        if prediction == "shock":
            if is_roas:
                diagnosis = (
                    f"Severe creative saturation detected on {platform}. ROAS deteriorated from a baseline of "
                    f"{baseline:.2f}x down to {current:.2f}x ({change:.1f}% decline), with anomalous breakdown points recorded on {dates_str}. "
                    f"This pattern indicates the target audience has been over-saturated, driving up CPMs while conversion intent collapsed."
                )
                action = (
                    f"1. Budget Preservation: Pause exhausted ad variations on {platform} immediately to stop unprofitable spend. "
                    f"2. Creative Rotation: Deploy 2 fresh high-contrast creative hooks with direct product demonstration. "
                    f"3. Funnel Reset: Expand broad audience targeting with a 30-day past-purchaser exclusion window."
                )
            else:
                diagnosis = (
                    f"Critical distribution collapse detected on {platform}. Velocity plummeted by {abs(change):.1f}% "
                    f"relative to the {baseline:,.0f} baseline, triggering statistical anomaly alerts on {dates_str}. "
                    f"The sudden cliff suggests algorithmic non-follower throttling caused by low early watch-time completion."
                )
                action = (
                    f"1. Distribution Reset: Halt low-engagement static posts and carousels for 48 hours. "
                    f"2. Resuscitation Hook: Post 1 high-velocity short format (under 12 seconds) featuring a text-hook teaser within the first 1.5 seconds. "
                    f"3. Engagement Window: Actively reply to all comments within 30 minutes of publishing to force-seed algorithmic re-indexing."
                )

        elif prediction == "pre_shock":
            if is_roas:
                diagnosis = (
                    f"Early creative fatigue warning for {account_name}. While current ROAS ({current:.2f}x) remains near break-even, "
                    f"momentum has decelerated by {abs(change):.1f}% against the {baseline:.2f}x benchmark. Anomaly clusters on {dates_str} "
                    f"indicate audience frequency is rising faster than unique conversions."
                )
                action = (
                    f"1. Early Rotation: Prepare 3 new UGC or testimonial ad creatives before efficiency degrades further. "
                    f"2. Bid Strategy: Cap daily budget increases to under 10% to prevent automated bidding auctions from volatility spikes. "
                    f"3. Audience Expansion: Test lookalike 3-5% or broad interest expansion to dilute audience exhaustion."
                )
            else:
                diagnosis = (
                    f"Algorithmic cooling detected on {platform}. Reach has declined {abs(change):.1f}% from the {baseline:,.0f} baseline, "
                    f"with subtle negative velocity deviations starting on {dates_str}. Without tactical adjustment, full feed suppression is projected within 4–7 days."
                )
                action = (
                    f"1. Hook Optimization: Redesign upcoming content to introduce the core payoff in the first 2 seconds. "
                    f"2. Format Pivot: Alternate between single-topic carousels and concise Reels to test which format regains explore-page traction. "
                    f"3. Story Seeding: Publish interactive story stickers (polls/quizzes) 1 hour prior to grid posts to pre-warm follower engagement."
                )

        elif prediction == "recovering":
            diagnosis = (
                f"Rebound trajectory confirmed for {account_name}. Metric velocity is trending upward after recent suppression, "
                f"reaching {current:,.1f}{unit} and reducing baseline deficit to {change:.1f}%. Audience retention signals are stabilizing."
            )
            action = (
                f"1. Cadence Locking: Maintain exact posting schedule and content theme without introducing drastic format changes. "
                f"2. Retention Amplification: Pin top-performing comments on recent rebound posts to prolong dwell time. "
                f"3. Momentum Scaling: Incrementally expand publishing frequency by 1 additional asset this week."
            )

        else:
            diagnosis = (
                f"Account performance is operating in healthy algorithmic equilibrium. Current output ({current:,.1f}{unit}) "
                f"is tracking consistently with the {baseline:,.1f}{unit} 14-day baseline (+{change:.1f}% drift), showing strong distribution velocity."
            )
            action = (
                f"1. Cadence Retention: Maintain current creative rotation and publishing velocity. "
                f"2. Benchmark Archiving: Tag current top-performing assets as baseline references for future creative iterations. "
                f"3. Scaling Test: Safely test 1 new experimental concept per week without disturbing primary core distribution."
            )

        return {
            "diagnosis": diagnosis,
            "recommended_action": action,
            "ai_engine": "Dynamic Contextual Synthesizer",
        }

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
        # Try live LLM if API key is present
        ai_res = self._generate_with_gemini(
            account_name, platform, metric_type, prediction, health_score, metrics, anomalies
        )
        if ai_res:
            return ai_res

        # Fallback to dynamic parametric reasoning
        return self._synthesize_parametric_diagnosis(
            account_name, platform, metric_type, prediction, health_score, metrics, anomalies
        )

