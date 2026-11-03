import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from backend/.env or root .env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

from core.rate_limiter import rate_limit_middleware
from routers.agency import router as agency_router
from routers.analytics import router as analytics_router
from routers.radar import router as radar_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("relvnt.api")

app = FastAPI(
    title="Relvnt Algorithmic Intelligence API",
    description="Enterprise Early-Warning Radar for Algorithmic Distribution Decoupling & Ad Fatigue.",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enterprise Tiered Rate Limiter (RFC 6585 Headers + Compute-Aware Sliding Window)
app.middleware("http")(rate_limit_middleware)


# Strict Enterprise Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
    return response


# Safe Global Exception Handler
@app.exception_handler(Exception)
async def safe_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error processing %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return Response(
        content='{"detail":"An internal processing anomaly occurred. Request could not be completed safely."}',
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        media_type="application/json",
    )


# Secure CORS Configuration (OWASP Standard)
allowed_origins_env = os.getenv("CORS_ORIGINS", "").strip()
if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    allow_credentials = "*" not in allowed_origins
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://relvnt.vercel.app",
        "https://relvnt.onrender.com",
    ]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# System Health Contracts & Endpoint
class HealthResponse(BaseModel):
    status: str
    system: str
    version: str
    data_governance: str
    ai_engine: Optional[str] = None
    gemini_connected: Optional[bool] = False


@app.get("/health", response_model=HealthResponse, tags=["System Health"], status_code=status.HTTP_200_OK)
def health():
    has_gemini = bool((os.getenv("GEMINI_API_KEY") or "").strip())
    model = (os.getenv("GEMINI_MODEL") or "gemini-1.5-flash").strip()
    return {
        "status": "nominal",
        "system": "Relvnt Algorithmic Intelligence Sentinel",
        "version": "2.1.0",
        "data_governance": "Compound AI: Local IsolationForest + Optional Zero-Retention Gemini Reasoning",
        "ai_engine": f"Google Gemini Live AI ({model})" if has_gemini else "Local Deterministic Sentinel (Zero-Data-Leak)",
        "gemini_connected": has_gemini,
    }


# Mount API v1 Routes (RESTful industry standard)
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(radar_router, prefix="/api/v1")
app.include_router(agency_router, prefix="/api/v1")

# Mount Root Aliases for Backward Compatibility
app.include_router(analytics_router)
app.include_router(radar_router)
app.include_router(agency_router)
