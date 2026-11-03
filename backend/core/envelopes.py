from typing import Any, Dict, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Deterministic Enterprise API Response Envelope (JSend / JSON:API Standard).
    Provides consistent client-side contract: { success, data, error, meta }.
    """
    success: bool = Field(default=True, description="Indicates if the operation succeeded")
    data: Optional[T] = Field(default=None, description="The payload body")
    error: Optional[str] = Field(default=None, description="Human-readable error details if failed")
    meta: Dict[str, Any] = Field(default_factory=dict, description="Operational metadata (timestamp, version)")
