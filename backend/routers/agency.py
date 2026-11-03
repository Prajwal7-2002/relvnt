import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from core.security import get_current_agency
from services.supabase_service import supabase_service

logger = logging.getLogger("relvnt.routers.agency")

router = APIRouter(tags=["Agency Multi-Tenancy"])


# --- Pydantic Data Contracts ---

class AgencyProfilePayload(BaseModel):
    name: str = Field(default="Your Agency")
    slug: Optional[str] = None
    tagline: Optional[str] = "Social Media & Distribution Advisory"
    auditor_name: str = Field(default="Lead Strategist")
    auditor_role: str = Field(default="Growth & Retention Director")
    contact_email: str = Field(default="audit@youragency.com")
    confidentiality: str = Field(default="CONFIDENTIAL & PROPRIETARY · PREPARED FOR CLIENT REVIEW")
    monogram: Optional[str] = "YA"


# --- Endpoints ---

@router.post("/agency/profile", status_code=status.HTTP_200_OK)
def save_agency_profile(
    payload: AgencyProfilePayload,
    current_agency: Dict[str, Any] = Depends(get_current_agency),
):
    """Saves or updates white-label agency branding and auditor details."""
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    # Bind tenant agency context if available
    if current_agency and current_agency.get("agency_id") != "default-agency":
        data["agency_id"] = current_agency["agency_id"]
    saved = supabase_service.save_agency(data)
    return {"status": "success", "agency": saved}


@router.get("/agency/profile/{slug_or_id}", status_code=status.HTTP_200_OK)
def get_agency_profile(slug_or_id: str):
    """Retrieves agency profile by slug or identifier."""
    agency = supabase_service.get_agency(slug_or_id)
    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency profile not found.")
    return agency


@router.get("/agency/{agency_id}/portfolio", status_code=status.HTTP_200_OK)
def get_agency_portfolio(
    agency_id: str,
    current_agency: Dict[str, Any] = Depends(get_current_agency),
):
    """Retrieves all tracked client accounts under the agency tenant."""
    # Ensure tenant isolation in live mode
    target_id = current_agency.get("agency_id", agency_id) if current_agency.get("mode") == "live" else agency_id
    return {"portfolio": supabase_service.get_portfolio(target_id)}
