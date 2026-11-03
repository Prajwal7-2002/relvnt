import asyncio
import logging
from typing import Any, Dict, List, Optional
import httpx
import requests

logger = logging.getLogger("relvnt.alerts")


class AlertDispatcher:
    """
    Proactive Early-Warning Radar Alert Dispatcher (ASGI Non-Blocking I/O Standard).
    Delivers instant anomaly cards to Slack, Discord, or generic webhooks without
    blocking the Uvicorn worker thread. Supports parallel fan-out via asyncio.gather.
    """

    @staticmethod
    def _build_slack_payload(
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        status_emoji = "🚨" if health_score < 40 else "⚠️" if health_score < 70 else "✅"
        color_hex = "#E11D48" if health_score < 40 else "#F59E0B" if health_score < 70 else "#10B981"
        return {
            "attachments": [
                {
                    "color": color_hex,
                    "blocks": [
                        {
                            "type": "header",
                            "text": {
                                "type": "plain_text",
                                "text": f"{status_emoji} Relvnt Radar Alert: {account_name}",
                                "emoji": True,
                            },
                        },
                        {
                            "type": "section",
                            "fields": [
                                {"type": "mrkdwn", "text": f"*Agency:*\n{agency_name}"},
                                {"type": "mrkdwn", "text": f"*Health Index:*\n`{health_score} / 100` ({alert_level.upper()})"},
                            ],
                        },
                        {
                            "type": "section",
                            "text": {"type": "mrkdwn", "text": f"*Diagnostic Summary:*\n{diagnosis}"},
                        },
                        {
                            "type": "section",
                            "text": {"type": "mrkdwn", "text": f"*72-Hour Action Runbook:*\n{action_plan}"},
                        },
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "mrkdwn",
                                    "text": "Automated Early-Warning Radar · Relvnt Sentinel Engine v1.2.0",
                                }
                            ],
                        },
                    ],
                }
            ]
        }

    @staticmethod
    def _build_discord_payload(
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        status_emoji = "🚨" if health_score < 40 else "⚠️" if health_score < 70 else "✅"
        color_int = 0xE11D48 if health_score < 40 else 0xF59E0B if health_score < 70 else 0x10B981
        return {
            "username": "Relvnt Sentinel Radar",
            "embeds": [
                {
                    "title": f"{status_emoji} Relvnt Radar Alert: {account_name}",
                    "color": color_int,
                    "fields": [
                        {"name": "Agency", "value": agency_name, "inline": True},
                        {"name": "Health Index", "value": f"`{health_score} / 100` ({alert_level.upper()})", "inline": True},
                        {"name": "Diagnostic Summary", "value": diagnosis[:1024]},
                        {"name": "72-Hour Action Runbook", "value": action_plan[:1024]},
                    ],
                    "footer": {"text": "Automated Early-Warning Radar · Relvnt Sentinel Engine v1.2.0"},
                }
            ],
        }

    # --- Asynchronous Non-Blocking Dispatch (Production Standard) ---

    @classmethod
    async def dispatch_auto_async(
        cls,
        webhook_url: str,
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        url_lower = webhook_url.lower()
        async with httpx.AsyncClient(timeout=10.0) as client:
            if "discord.com" in url_lower:
                payload = cls._build_discord_payload(account_name, health_score, alert_level, diagnosis, action_plan, agency_name)
                resp = await client.post(webhook_url, json=payload)
                if resp.status_code not in (200, 204):
                    raise ValueError(f"Discord webhook responded with HTTP {resp.status_code}: {resp.text}")
                return {"status": "success", "channel": "discord", "code": resp.status_code}

            elif "slack.com" in url_lower:
                payload = cls._build_slack_payload(account_name, health_score, alert_level, diagnosis, action_plan, agency_name)
                resp = await client.post(webhook_url, json=payload)
                if resp.status_code != 200:
                    raise ValueError(f"Slack webhook responded with HTTP {resp.status_code}: {resp.text}")
                return {"status": "success", "channel": "slack", "code": resp.status_code}

            else:
                event_data = {
                    "event": "relvnt_radar_anomaly",
                    "agency_name": agency_name,
                    "account_name": account_name,
                    "health_score": health_score,
                    "alert_level": alert_level,
                    "diagnosis": diagnosis,
                    "action_plan": action_plan,
                }
                resp = await client.post(webhook_url, json=event_data)
                if resp.status_code not in (200, 201, 202, 204):
                    raise ValueError(f"Webhook responded with HTTP {resp.status_code}: {resp.text}")
                return {"status": "success", "channel": "webhook", "code": resp.status_code}

    @classmethod
    async def dispatch_batch_async(cls, webhook_url: str, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parallel fan-out dispatching using asyncio.gather to prevent sequential delays."""
        tasks = [
            cls.dispatch_auto_async(
                webhook_url=webhook_url,
                account_name=a.get("account_name", "Client"),
                health_score=a.get("health_score", 50),
                alert_level=a.get("alert_level", "warning"),
                diagnosis=a.get("diagnosis", ""),
                action_plan=a.get("action_plan", ""),
                agency_name=a.get("agency_name", "Your Agency"),
            )
            for a in alerts
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)

    # --- Synchronous Helpers for Legacy / Synchronous CLI contexts ---

    @classmethod
    def dispatch_auto(cls, *args, **kwargs) -> Dict[str, Any]:
        """Synchronous wrapper for test compatibility."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If running inside active loop, use synchronous requests
                return cls._dispatch_auto_sync(*args, **kwargs)
            else:
                return loop.run_until_complete(cls.dispatch_auto_async(*args, **kwargs))
        except Exception:
            return cls._dispatch_auto_sync(*args, **kwargs)

    @classmethod
    def _dispatch_auto_sync(
        cls,
        webhook_url: str,
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        url_lower = webhook_url.lower()
        if "discord.com" in url_lower:
            payload = cls._build_discord_payload(account_name, health_score, alert_level, diagnosis, action_plan, agency_name)
            resp = requests.post(webhook_url, json=payload, timeout=10)
            if resp.status_code not in (200, 204):
                raise ValueError(f"Discord webhook HTTP {resp.status_code}")
            return {"status": "success", "channel": "discord", "code": resp.status_code}
        elif "slack.com" in url_lower:
            payload = cls._build_slack_payload(account_name, health_score, alert_level, diagnosis, action_plan, agency_name)
            resp = requests.post(webhook_url, json=payload, timeout=10)
            if resp.status_code != 200:
                raise ValueError(f"Slack webhook HTTP {resp.status_code}")
            return {"status": "success", "channel": "slack", "code": resp.status_code}
        else:
            event_data = {
                "event": "relvnt_radar_anomaly",
                "agency_name": agency_name,
                "account_name": account_name,
                "health_score": health_score,
                "alert_level": alert_level,
                "diagnosis": diagnosis,
                "action_plan": action_plan,
            }
            resp = requests.post(webhook_url, json=event_data, timeout=10)
            if resp.status_code not in (200, 201, 202, 204):
                raise ValueError(f"Webhook HTTP {resp.status_code}")
            return {"status": "success", "channel": "webhook", "code": resp.status_code}
