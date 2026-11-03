import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger("relvnt.supabase")

# Optional Supabase Client initialization
try:
    from supabase import Client, create_client
    HAS_SUPABASE_LIB = True
except ImportError:
    HAS_SUPABASE_LIB = False
    logger.info("supabase-py library not installed. Operating with in-memory persistence fallback.")


class SupabaseService:
    """
    Enterprise Data Access Object (DAO) for Supabase PostgreSQL.
    Provides multi-tenant agency isolation, telemetry storage, and incident logging.
    Graceful Degradation: If SUPABASE_URL / SUPABASE_KEY are not present,
    operates smoothly using in-memory local state without interrupting Sentinel audits.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseService, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.url = os.getenv("SUPABASE_URL", "").strip()
        self.key = os.getenv("SUPABASE_KEY", "").strip() or os.getenv("SUPABASE_ANON_KEY", "").strip()
        self.client = None
        self._memory_agencies: Dict[str, Dict[str, Any]] = {}
        self._memory_clients: Dict[str, List[Dict[str, Any]]] = {}
        self._memory_incidents: List[Dict[str, Any]] = []

        if HAS_SUPABASE_LIB and self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
                logger.info("Supabase PostgreSQL client connected successfully: %s", self.url)
            except Exception as exc:
                logger.warning("Failed to initialize Supabase client: %s. Using in-memory fallback.", exc)
        else:
            logger.info("Supabase credentials not configured. Using local zero-leak in-memory store.")

    @property
    def is_connected(self) -> bool:
        return self.client is not None

    def save_agency(self, agency_data: Dict[str, Any]) -> Dict[str, Any]:
        """Upserts an agency white-label profile."""
        slug = agency_data.get("slug") or agency_data.get("name", "agency").lower().replace(" ", "-")
        record = {
            "name": agency_data.get("name", "Your Agency"),
            "slug": slug,
            "tagline": agency_data.get("tagline", "Social Media & Distribution Advisory"),
            "auditor_name": agency_data.get("auditor_name", "Lead Strategist"),
            "auditor_role": agency_data.get("auditor_role", "Growth & Retention Director"),
            "contact_email": agency_data.get("contact_email", "audit@youragency.com"),
            "confidentiality_seal": agency_data.get("confidentiality", "CONFIDENTIAL & PROPRIETARY // CLIENT EYES ONLY"),
            "monogram": agency_data.get("monogram", "YA"),
        }

        if self.client:
            try:
                res = self.client.table("agencies").upsert(record, on_conflict="slug").execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.warning("Supabase agency upsert error: %s. Falling back to local store.", exc)

        self._memory_agencies[slug] = record
        return record

    def get_agency(self, slug_or_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves agency profile by slug or ID."""
        if self.client:
            try:
                res = self.client.table("agencies").select("*").or_(f"slug.eq.{slug_or_id},id.eq.{slug_or_id}").limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.warning("Supabase agency lookup error: %s", exc)

        return self._memory_agencies.get(slug_or_id)

    def save_client(self, agency_id: str, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a client account under an agency."""
        handle = client_data.get("account_handle") or client_data.get("account", "@client")
        record = {
            "agency_id": agency_id,
            "account_handle": handle,
            "brand_name": client_data.get("brand_name", handle),
            "platform": client_data.get("platform", "instagram"),
            "metric_type": client_data.get("metric_type", "reach"),
            "current_health_score": client_data.get("health_score", 50),
            "active_status": client_data.get("status", "healthy"),
        }

        if self.client:
            try:
                res = self.client.table("client_accounts").upsert(record, on_conflict="agency_id,account_handle,platform").execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.warning("Supabase client upsert error: %s", exc)

        if agency_id not in self._memory_clients:
            self._memory_clients[agency_id] = []
        # Update or append
        existing = [c for c in self._memory_clients[agency_id] if c["account_handle"] == handle]
        if existing:
            existing[0].update(record)
            return existing[0]
        else:
            self._memory_clients[agency_id].append(record)
            return record

    def get_portfolio(self, agency_id: str) -> List[Dict[str, Any]]:
        """Returns all client accounts for an agency."""
        if self.client:
            try:
                res = self.client.table("client_accounts").select("*").eq("agency_id", agency_id).execute()
                if res.data is not None:
                    return res.data
            except Exception as exc:
                logger.warning("Supabase portfolio lookup error: %s", exc)

        return self._memory_clients.get(agency_id, [])

    def log_incident(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """Logs an anomalous incident."""
        if self.client:
            try:
                res = self.client.table("forensic_incidents").insert(incident_data).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.warning("Supabase incident log error: %s", exc)

        self._memory_incidents.append(incident_data)
        return incident_data


supabase_service = SupabaseService()

