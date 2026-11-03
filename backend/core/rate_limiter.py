import json
import logging
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response, status

logger = logging.getLogger("relvnt.security.ratelimit")


class TieredRateLimiter:
    """
    Enterprise In-Memory Sliding Window Rate Limiter with RFC 6585 Headers.
    Protects machine learning inference and prevents denial-of-service / scraping.
    """

    def __init__(self):
        # Sliding window logs: { (client_ip, tier): [timestamps] }
        self._requests: Dict[Tuple[str, str], List[float]] = defaultdict(list)

        # Tier configs: max requests per 60-second window
        self.tiers = {
            "heavy": 45,    # ML Inference, CSV Uploads, Copilot AI, Radar Scans
            "standard": 180, # Metadata, Presets, Profiles, Health checks
        }

    def _get_tier(self, path: str) -> str:
        """Categorizes request paths into compute tiers."""
        heavy_prefixes = (
            "/analyze",
            "/api/v1/analyze",
            "/copilot",
            "/api/v1/copilot",
            "/radar/scan",
            "/api/v1/radar/scan",
        )
        for prefix in heavy_prefixes:
            if path.startswith(prefix):
                return "heavy"
        return "standard"

    def check(self, request: Request) -> Tuple[bool, int, int, int, int]:
        """
        Evaluates request against the tier limits.
        Returns: (allowed: bool, limit: int, remaining: int, reset_epoch: int, retry_after: int)
        """
        client_ip = request.client.host if request.client else "127.0.0.1"
        tier = self._get_tier(request.url.path)
        limit = self.tiers[tier]
        now = time.time()
        window_size = 60.0

        key = (client_ip, tier)
        # Prune timestamps outside current 60s sliding window
        recent = [t for t in self._requests[key] if now - t < window_size]
        self._requests[key] = recent

        reset_epoch = int(recent[0] + window_size) if recent else int(now + window_size)
        retry_after = max(1, reset_epoch - int(now))

        if len(recent) >= limit:
            logger.warning("Rate limit exceeded for %s on tier %s (%d/%d)", client_ip, tier, len(recent), limit)
            return False, limit, 0, reset_epoch, retry_after

        recent.append(now)
        remaining = max(0, limit - len(recent))
        return True, limit, remaining, reset_epoch, 0


rate_limiter = TieredRateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """FastAPI HTTP Middleware enforcing tiered rate limits and standard headers."""
    # Allow OPTIONS preflight requests to pass freely
    if request.method == "OPTIONS":
        return await call_next(request)

    allowed, limit, remaining, reset_epoch, retry_after = rate_limiter.check(request)

    if not allowed:
        error_payload = {
            "success": False,
            "error": "Rate limit exceeded. Too many requests.",
            "detail": f"Rate limit reached ({limit} requests/min). Please throttle requests.",
            "meta": {
                "limit": limit,
                "window": "60s",
                "retry_after_seconds": retry_after,
            },
        }
        response = Response(
            content=json.dumps(error_payload),
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            media_type="application/json",
        )
        response.headers["Retry-After"] = str(retry_after)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = "0"
        response.headers["X-RateLimit-Reset"] = str(reset_epoch)
        return response

    response: Response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_epoch)
    return response
