import logging
import requests
from typing import Any, Dict, Optional

logger = logging.getLogger("relvnt.alerts")


class AlertDispatcher:
    """
    Proactive Early-Warning Radar Alert Dispatcher.
    Formats and delivers instant anomaly warning cards to Slack, Discord,
    or generic webhook / WhatsApp gateways when a client's reach decouples.
    """

    @staticmethod
    def dispatch_slack(
        webhook_url: str,
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        """Sends a rich formatted card to an incoming Slack webhook."""
        status_emoji = "🚨" if health_score < 40 else "⚠️" if health_score < 70 else "✅"
        color_hex = "#E11D48" if health_score < 40 else "#F59E0B" if health_score < 70 else "#10B981"

        payload = {
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

        try:
            resp = requests.post(webhook_url, json=payload, timeout=10)
            if resp.status_code != 200:
                raise ValueError(f"Slack webhook responded with HTTP {resp.status_code}: {resp.text}")
            return {"status": "success", "channel": "slack", "code": resp.status_code}
        except Exception as exc:
            logger.error("Failed to deliver Slack radar alert: %s", exc)
            raise

    @staticmethod
    def dispatch_discord(
        webhook_url: str,
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        """Sends a structured embed message to a Discord webhook."""
        status_emoji = "🚨" if health_score < 40 else "⚠️" if health_score < 70 else "✅"
        color_int = 0xE11D48 if health_score < 40 else 0xF59E0B if health_score < 70 else 0x10B981

        payload = {
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

        try:
            resp = requests.post(webhook_url, json=payload, timeout=10)
            if resp.status_code not in (200, 204):
                raise ValueError(f"Discord webhook responded with HTTP {resp.status_code}: {resp.text}")
            return {"status": "success", "channel": "discord", "code": resp.status_code}
        except Exception as exc:
            logger.error("Failed to deliver Discord radar alert: %s", exc)
            raise

    @staticmethod
    def dispatch_generic_webhook(
        webhook_url: str,
        event_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Delivers a clean JSON webhook payload to Zapier, Make, n8n, or WhatsApp gateway."""
        try:
            resp = requests.post(webhook_url, json=event_data, timeout=10)
            if resp.status_code not in (200, 201, 202, 204):
                raise ValueError(f"Webhook responded with HTTP {resp.status_code}: {resp.text}")
            return {"status": "success", "channel": "webhook", "code": resp.status_code}
        except Exception as exc:
            logger.error("Failed to deliver generic webhook alert: %s", exc)
            raise

    @classmethod
    def dispatch_auto(
        cls,
        webhook_url: str,
        account_name: str,
        health_score: int,
        alert_level: str,
        diagnosis: str,
        action_plan: str,
        agency_name: str = "Your Agency",
    ) -> Dict[str, Any]:
        """
        Auto-routes to Slack, Discord, or generic webhook based on URL structure.
        """
        url_lower = webhook_url.lower()
        if "discord.com" in url_lower:
            return cls.dispatch_discord(
                webhook_url=webhook_url,
                account_name=account_name,
                health_score=health_score,
                alert_level=alert_level,
                diagnosis=diagnosis,
                action_plan=action_plan,
                agency_name=agency_name,
            )
        elif "slack.com" in url_lower:
            return cls.dispatch_slack(
                webhook_url=webhook_url,
                account_name=account_name,
                health_score=health_score,
                alert_level=alert_level,
                diagnosis=diagnosis,
                action_plan=action_plan,
                agency_name=agency_name,
            )
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
            return cls.dispatch_generic_webhook(webhook_url=webhook_url, event_data=event_data)
