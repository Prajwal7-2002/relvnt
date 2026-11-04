import json
import logging
import os
from typing import Dict, List, Optional
import requests

logger = logging.getLogger("relvnt.diagnostics")

LOCAL_ENGINE_NAME = "Relvnt built-in analysis (runs locally, no data sent externally)"

# Shared rules for any generated text: the product's credibility depends on
# never stating a cause the data cannot show.
HONESTY_RULES = (
    "Rules:\n"
    "- Use only the numbers and findings provided. Quote them.\n"
    "- The daily series shows WHEN performance changed, not WHY. Do not claim causes such as "
    "algorithm penalties, retention, watch time, frequency or audience fatigue unless a provided "
    "finding shows it.\n"
    "- When suggesting causes, phrase them as things to check.\n"
    "- Plain English for a non-technical business owner. No jargon, no buzzwords, no emojis.\n"
)


def _metric_word(metric_type: str) -> str:
    return {"roas": "ROAS", "reach": "reach", "views": "views", "impressions": "impressions"}.get(
        (metric_type or "").lower(), metric_type or "performance"
    )


def _platform_name(platform: str) -> str:
    return {"instagram": "Instagram", "meta_ads": "Meta Ads", "google_sheets": "Google Sheets"}.get(
        (platform or "").lower(), platform or "Instagram"
    )


def _fmt(value: float, metric_type: str) -> str:
    if (metric_type or "").lower() == "roas":
        return f"{value:.2f}x"
    return f"{value:,.0f}"


def _readable_date(iso: str) -> str:
    try:
        from datetime import datetime

        return datetime.strptime(iso, "%Y-%m-%d").strftime("%d %b").lstrip("0")
    except (ValueError, TypeError):
        return str(iso)


class LocalDiagnosticEngine:
    """
    Deterministic, offline briefing generator. Every sentence is built from the
    measured metrics, flagged days and (when available) per-post findings.
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
        findings: Optional[List[Dict]] = None,
    ) -> Dict:
        findings = findings or []
        word = _metric_word(metric_type)
        is_roas = (metric_type or "").lower() == "roas"
        recent = float(metrics.get("recent_avg", metrics.get("current_value", 0.0)) or 0.0)
        baseline = float(metrics.get("baseline_avg", 0.0) or 0.0)
        change = float(metrics.get("change_pct", 0.0) or 0.0)
        window = int(metrics.get("recent_window_days", 7) or 7)

        flagged_dates = sorted(a["date"] for a in anomalies) if anomalies else []
        flagged_note = ""
        if flagged_dates:
            flagged_note = (
                f" {len(flagged_dates)} {'day was' if len(flagged_dates) == 1 else 'days were'} flagged as well below "
                f"usual, most recently {_readable_date(flagged_dates[-1])}."
            )
        since = _readable_date(flagged_dates[0]) if flagged_dates else "the last few weeks"

        window_label = metrics.get("recent_window_label") or f"last {window} days"
        facts = (
            f"Over the {window_label}, {word} averaged {_fmt(recent, metric_type)}, "
            f"{abs(change):.1f}% {'below' if change < 0 else 'above'} the usual {_fmt(baseline, metric_type)}."
        )

        # Evidence-backed findings (from per-post analysis) take priority over generic checks
        finding_actions = [f for f in findings if f.get("action")]
        evidence_sentence = ""
        if findings:
            evidence_sentence = " " + " ".join(f["detail"] for f in findings[:2] if f.get("detail"))

        if prediction == "shock":
            severity = "CRITICAL_DRIFT"
            diagnosis = (
                f"{facts}{flagged_note}{evidence_sentence}"
                + ("" if findings else " The daily numbers show when this happened, not why; the steps below cover what to check first.")
            )
        elif prediction == "pre_shock":
            severity = "ELEVATED_RISK"
            diagnosis = (
                f"{facts}{flagged_note}{evidence_sentence}"
                + ("" if findings else " This is an early dip rather than a collapse, so small changes now are worth more than big changes later.")
            )
        elif prediction == "recovering":
            severity = "RECOVERY_PHASE"
            diagnosis = f"{facts} The last few days are moving back towards the usual level.{evidence_sentence}"
        else:
            severity = "NOMINAL_EQUILIBRIUM"
            diagnosis = f"{facts} This is within the normal range for this account.{evidence_sentence}"

        phases = cls._build_steps(prediction, is_roas, since, baseline, metric_type, finding_actions)
        action = "\n".join(f"{i + 1}. {p['title']}: {p['action']}" for i, p in enumerate(phases))

        return {
            "severity": severity,
            "diagnosis": diagnosis.strip(),
            "recommended_action": action,
            "phases": phases,
            "ai_engine": LOCAL_ENGINE_NAME,
        }

    @staticmethod
    def _build_steps(prediction, is_roas, since, baseline, metric_type, finding_actions) -> List[Dict]:
        """Three steps. Evidence-backed actions from findings come first; generic checks fill the rest."""
        steps: List[Dict] = [
            {"phase": f"Day {i + 1}", "title": f["title"], "action": f["action"]} for i, f in enumerate(finding_actions[:3])
        ]

        if prediction in ("shock", "pre_shock"):
            if is_roas:
                generic = [
                    ("Check the ads that changed", f"Look at ad sets that slowed since {since}: how long each creative has been running and how often the same people have seen it."),
                    ("Refresh the weakest creative", "Pause the lowest-ROAS ad and test one new creative in its place, keeping the budget the same so the comparison is fair."),
                    ("Compare after three days", f"Check whether ROAS is moving back towards the usual {_fmt(baseline, metric_type)} before changing anything else."),
                ]
            else:
                generic = [
                    ("Find what changed", f"Compare posts published since {since} with earlier ones: format (reels, carousels, photos), how often you posted, and posting times."),
                    ("Repeat what worked before", "Go back to the format and posting schedule of your best-performing posts from before the drop for the next few posts."),
                    ("Check progress", f"Compare the next few days with the usual level of {_fmt(baseline, metric_type)}. Upload a per-post export for a detailed breakdown of what is and isn't working."),
                ]
        elif prediction == "recovering":
            generic = [
                ("Keep what changed", "Keep the posting schedule and formats from the last few days; they coincide with the recovery."),
                ("Note what worked", "Write down which recent posts did best so the team can repeat them."),
                ("Change one thing at a time", "If you test something new, change only one thing so you can tell what made the difference."),
            ]
        else:
            generic = [
                ("Keep the current schedule", "Performance is normal; no changes are needed."),
                ("Note your best posts", "Keep a short list of the best-performing recent posts as a reference."),
                ("Check again next week", "Relvnt will flag any drop below the usual level."),
            ]

        for title, text in generic:
            if len(steps) >= 3:
                break
            steps.append({"phase": f"Day {len(steps) + 1}", "title": title, "action": text})
        return steps

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
        agency_name: str = "Your Agency",
        auditor_name: str = "Account Manager",
    ) -> Dict:
        """Offline copilot answers built only from the measured numbers."""
        q = question.lower()
        word = _metric_word(metric_type)
        recent = float(metrics.get("recent_avg", metrics.get("current_value", 0)) or 0)
        baseline = float(metrics.get("baseline_avg", 0) or 0)
        change = float(metrics.get("change_pct", 0) or 0)
        direction = "below" if change < 0 else "above"
        numbers = f"{word} averaged {_fmt(recent, metric_type)} recently, {abs(change):.1f}% {direction} the usual {_fmt(baseline, metric_type)}"

        if any(w in q for w in ["email", "client", "draft", "message", "update"]):
            answer = (
                f"Subject: {account_name}: performance update\n\n"
                f"Hi,\n\n"
                f"A quick update on {account_name}. Over the last week, {numbers}.\n\n"
                f"Here is what we're doing next:\n"
                f"1. Reviewing recent posts against earlier, stronger ones to find what changed.\n"
                f"2. Returning to the formats and schedule that worked best before the drop.\n"
                f"3. Checking the numbers again in a few days and sharing what we find.\n\n"
                f"Best regards,\n{auditor_name}\n{agency_name}"
            )
        elif any(w in q for w in ["why", "drop", "reason", "cause"]):
            answer = (
                f"{numbers.capitalize()}. {len(anomalies)} days were flagged as well below usual.\n\n"
                f"The daily numbers show when the drop happened, not why. The most common causes to check are: "
                f"a change in what was posted (format or topic), posting less often, or a change in posting times. "
                f"Uploading a per-post export lets Relvnt compare these directly."
            )
        elif any(w in q for w in ["post", "format", "what to", "next"]):
            answer = (
                "Start with what has worked for this account before: look at the best-performing posts from before "
                "the drop and repeat their format and posting schedule for the next few posts. "
                "A per-post export gives a specific comparison of formats, posting frequency and timing."
            )
        else:
            answer = (
                f"{account_name}: health score {health_score}/100. {numbers.capitalize()}.\n"
                f"{diagnosis}"
            ).strip()

        return {"answer": answer, "engine": LOCAL_ENGINE_NAME}


class HybridAIAgent:
    """
    Uses Google Gemini when GEMINI_API_KEY is set, otherwise (or on any failure)
    falls back to LocalDiagnosticEngine.
    """

    def __init__(self):
        from pathlib import Path
        from dotenv import load_dotenv

        base_dir = Path(__file__).resolve().parent.parent
        load_dotenv(base_dir / ".env")
        load_dotenv(base_dir.parent / ".env")

        self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip() or None
        self.model = (os.getenv("GEMINI_MODEL") or "gemini-flash-lite-latest").strip()

    def _get_candidate_models(self) -> List[str]:
        candidates = []
        if self.model:
            candidates.append(self.model)
        for fb in ["gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-3.1-flash-lite"]:
            if fb not in candidates:
                candidates.append(fb)
        return candidates

    def generate_briefing(
        self,
        account_name: str,
        platform: str,
        metric_type: str,
        prediction: str,
        health_score: int,
        metrics: Dict,
        anomalies: List[Dict],
        findings: Optional[List[Dict]] = None,
    ) -> Dict:
        findings = findings or []
        if self.api_key:
            flagged = [_readable_date(d) for d in sorted(a["date"] for a in anomalies)]
            recent = metrics.get("recent_avg", metrics.get("current_value")) or 0
            prompt = (
                "You write short performance summaries for a social media monitoring tool used by small "
                "businesses and agencies.\n\n"
                f"{HONESTY_RULES}\n"
                f"Account: {account_name}\nPlatform: {_platform_name(platform)}\nMetric: {_metric_word(metric_type)}\n"
                f"Health score: {health_score}/100 (under 40 critical, under 70 watch)\n"
                f"Average over the {metrics.get('recent_window_label', 'last 7 days')}: {_fmt(float(recent), metric_type)}\n"
                f"Usual level: {_fmt(float(metrics.get('baseline_avg') or 0), metric_type)}\n"
                f"Change vs usual: {abs(float(metrics.get('change_pct') or 0)):.1f}% "
                f"{'below' if float(metrics.get('change_pct') or 0) < 0 else 'above'} usual\n"
                f"Flagged days ({len(flagged)}, most recent last): {', '.join(flagged[-6:]) or 'none'}\n"
                f"Per-post findings: {json.dumps(findings) if findings else 'none (only daily totals available)'}\n\n"
                "Return JSON with keys:\n"
                "- 'severity': 'CRITICAL_DRIFT' | 'ELEVATED_RISK' | 'RECOVERY_PHASE' | 'NOMINAL_EQUILIBRIUM'\n"
                "- 'diagnosis': 2-3 sentences stating what changed and when, quoting the numbers exactly as given "
                "(do not add decimals, do not restate the health score)\n"
                "- 'recommended_action': the three steps as a numbered list\n"
                "- 'phases': exactly 3 objects with 'phase' ('Day 1', 'Day 2', 'Day 3'), 'title' (max 6 words), "
                "and 'action' (1-2 sentences). Base them on the per-post findings when available.\n"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            }

            for model_name in self._get_candidate_models():
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                    res = requests.post(url, json=payload, timeout=6.0)
                    if res.status_code == 200:
                        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                        data = json.loads(text)
                        if not isinstance(data.get("phases"), list) or len(data["phases"]) != 3:
                            raise ValueError("Gemini returned an unexpected phase structure")
                        # Evidence-backed actions are more specific than generated ones; use them as the steps
                        finding_actions = [f for f in findings if f.get("action")]
                        if finding_actions:
                            data["phases"] = LocalDiagnosticEngine._build_steps(
                                prediction, (metric_type or "").lower() == "roas", "", float(metrics.get("baseline_avg") or 0), metric_type, finding_actions
                            )
                            data["recommended_action"] = "\n".join(
                                f"{i + 1}. {p['title']}: {p['action']}" for i, p in enumerate(data["phases"])
                            )
                        data["ai_engine"] = f"Gemini ({model_name})"
                        return data
                    logger.warning("Gemini briefing (%s) returned HTTP %s: %s", model_name, res.status_code, res.text[:120])
                except Exception as exc:
                    logger.warning("Gemini model %s briefing failed: %s", model_name, exc)
                    continue

        return LocalDiagnosticEngine.generate_briefing(
            account_name, platform, metric_type, prediction, health_score, metrics, anomalies, findings
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
        agency_name: str = "Your Agency",
        auditor_name: str = "Account Manager",
    ) -> Dict:
        if self.api_key:
            prompt = (
                f"You are an assistant for the agency '{agency_name}', answering questions about one client account.\n\n"
                f"{HONESTY_RULES}\n"
                f"Account: {account_name}\nPlatform: {_platform_name(platform)}\nMetric: {_metric_word(metric_type)}\n"
                f"Health score: {health_score}/100\n"
                f"Recent average: {metrics.get('recent_avg', metrics.get('current_value'))}\n"
                f"Usual level: {metrics.get('baseline_avg')}\n"
                f"Change vs usual: {metrics.get('change_pct')}%\n"
                f"Current summary: {diagnosis}\n\n"
                f"Question: {question}\n\n"
                "If asked to draft a message or email to the client, write a calm, complete, ready-to-send draft "
                f"signed as:\n{auditor_name}\n{agency_name}\n"
            )
            payload = {"contents": [{"parts": [{"text": prompt}]}]}

            for model_name in self._get_candidate_models():
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                    res = requests.post(url, json=payload, timeout=8.0)
                    if res.status_code == 200:
                        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                        return {"answer": text.strip(), "engine": f"Gemini ({model_name})"}
                    logger.warning("Gemini copilot (%s) returned HTTP %s: %s", model_name, res.status_code, res.text[:120])
                except Exception as exc:
                    logger.warning("Gemini model %s copilot failed: %s", model_name, exc)
                    continue

        return LocalDiagnosticEngine.answer_copilot(
            question, account_name, platform, metric_type, health_score, metrics, anomalies, diagnosis, agency_name, auditor_name
        )
