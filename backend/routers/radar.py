import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import requests

from services.alert_dispatcher import AlertDispatcher
from services.supabase_service import supabase_service

logger = logging.getLogger("relvnt.routers.radar")

router = APIRouter(tags=["Early-Warning Radar & Alerts"])


# --- Pydantic Data Contracts ---

class RadarAccountItem(BaseModel):
    account_name: str
    platform: Optional[str] = "instagram"
    metric_type: Optional[str] = "reach"
    health_score: int = 50
    diagnosis: Optional[str] = ""
    action_plan: Optional[str] = ""


class RadarScanPayload(BaseModel):
    agency_name: Optional[str] = "Your Agency"
    webhook_url: Optional[str] = None
    threshold: Optional[str] = "critical"  # "critical" (< 40) or "warning" (< 70)
    accounts: Optional[List[RadarAccountItem]] = None


class TestAlertPayload(BaseModel):
    webhook_url: str = Field(..., description="Destination webhook URL (Slack, Discord, or generic)")
    agency_name: Optional[str] = "Your Agency"


class SlackAlertPayload(BaseModel):
    webhook_url: str = Field(..., description="Incoming Slack Webhook URL")
    account_name: str = "Client Account"
    health_score: int = 50
    alert_level: str = "yellow"
    diagnosis: str = "Performance shift detected."
    action_plan: str = "Review recent asset delivery."


# --- Endpoints ---

@router.post("/radar/scan", status_code=status.HTTP_200_OK)
async def run_radar_scan(payload: RadarScanPayload):
    """
    Proactive Algorithmic Decoupling Radar:
    Evaluates client accounts against rolling 7-day baselines.
    Dispatches non-blocking async alerts to Slack, Discord, or generic Webhooks.
    """
    scanned_accounts = []
    flagged_incidents = []
    dispatched_alerts = []

    accounts_to_scan = payload.accounts or []
    if not accounts_to_scan:
        portfolio = supabase_service.get_portfolio("default-agency")
        for p in portfolio:
            accounts_to_scan.append(
                RadarAccountItem(
                    account_name=p.get("account_handle", "Client"),
                    platform=p.get("platform", "instagram"),
                    metric_type=p.get("metric_type", "reach"),
                    health_score=p.get("current_health_score", 50),
                    diagnosis="Active monitoring record in portfolio.",
                    action_plan="Verify reach continuity.",
                )
            )

    cutoff_score = 40 if payload.threshold == "critical" else 70
    async_dispatch_tasks = []

    for acc in accounts_to_scan:
        scanned_accounts.append(acc.account_name)
        if acc.health_score <= cutoff_score:
            flagged = {
                "account_name": acc.account_name,
                "health_score": acc.health_score,
                "alert_level": "critical" if acc.health_score <= 40 else "warning",
                "diagnosis": acc.diagnosis or "Algorithmic distribution decoupling detected below baseline.",
            }
            flagged_incidents.append(flagged)

            if payload.webhook_url:
                async_dispatch_tasks.append({
                    "webhook_url": payload.webhook_url,
                    "account_name": acc.account_name,
                    "health_score": acc.health_score,
                    "alert_level": "critical" if acc.health_score <= 40 else "warning",
                    "diagnosis": acc.diagnosis or "Distribution decoupling detected.",
                    "action_plan": acc.action_plan or "Execute 72-Hour Turnaround Protocol.",
                    "agency_name": payload.agency_name or "Your Agency",
                })

    if async_dispatch_tasks:
        try:
            batch_results = await AlertDispatcher.dispatch_batch_async(async_dispatch_tasks)
            for res in batch_results:
                dispatched_alerts.append({
                    "account": res.get("account_name"),
                    "channel": res.get("channel"),
                    "status": "delivered" if res.get("status") == "dispatched" else "failed",
                    "error": res.get("error"),
                })
        except Exception as exc:
            logger.error("Async batch dispatch error: %s", exc)

    return {
        "status": "completed",
        "total_scanned": len(scanned_accounts),
        "total_flagged": len(flagged_incidents),
        "flagged_accounts": flagged_incidents,
        "dispatched_count": len(dispatched_alerts),
        "dispatches": dispatched_alerts,
    }


@router.post("/alerts/test", status_code=status.HTTP_200_OK)
async def test_alert_webhook(payload: TestAlertPayload):
    """
    Sends an immediate non-blocking test verification ping to the specified Slack, Discord, or generic webhook.
    """
    try:
        res = await AlertDispatcher.dispatch_auto_async(
            webhook_url=payload.webhook_url,
            account_name="Verification Account (@relvnt_test)",
            health_score=35,
            alert_level="critical",
            diagnosis="Live Sentinel connection check. Algorithmic early-warning pipeline is operational.",
            action_plan="Channel link confirmed. Ready for 24/7 automated decoupling surveillance.",
            agency_name=payload.agency_name or "Your Agency",
        )
        return {
            "status": "success",
            "channel": res.get("channel", "webhook"),
            "message": "Verification test alert dispatched successfully.",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook delivery test failed: {str(exc)}",
        )


@router.post("/alerts/slack", status_code=status.HTTP_200_OK)
def send_slack_alert(payload: SlackAlertPayload):
    """
    Dispatches a formatted executive alert card to a client or internal Slack channel via incoming webhook.
    """
    status_emoji = "🚨" if payload.health_score < 40 else "⚠️" if payload.health_score < 70 else "✅"
    color_hex = "#EF4444" if payload.health_score < 40 else "#F59E0B" if payload.health_score < 70 else "#10B981"

    slack_msg = {
        "attachments": [
            {
                "color": color_hex,
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": f"{status_emoji} Relvnt Sentinel Alert: {payload.account_name}",
                            "emoji": True,
                        },
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Health Index:*\n`{payload.health_score} / 100`"},
                            {"type": "mrkdwn", "text": f"*Status Level:*\n*{payload.alert_level.upper()}*"},
                        ],
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Diagnostic Summary:*\n{payload.diagnosis}"},
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Recommended Action:*\n{payload.action_plan}"},
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": "Generated automatically by Relvnt Early-Warning Sentinel · Local zero-retention analysis",
                            }
                        ],
                    },
                ],
            }
        ]
    }

    try:
        resp = requests.post(payload.webhook_url, json=slack_msg, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slack webhook rejected payload with status {resp.status_code}: {resp.text}",
            )
        return {"status": "dispatched", "message": "Alert dispatched to Slack successfully."}
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to communicate with Slack webhook: {str(exc)}",
        )
