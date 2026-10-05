import time

from fastapi import HTTPException, Request, status
from upstash_redis.asyncio import Redis

from core.config import get_settings

_redis: Redis | None = None


def _get_redis() -> Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = Redis(
            url=settings.upstash_redis_rest_url,
            token=settings.upstash_redis_rest_token,
        )
    return _redis


def _client_identifier(request: Request) -> str:
    # The backend is only ever called server-to-server by the frontend service
    # (it has no public route), so the real visitor IP isn't on the socket —
    # the frontend forwards it explicitly in this header.
    forwarded = request.headers.get("x-client-ip")
    if forwarded:
        return forwarded
    return request.client.host if request.client else "unknown"


async def enforce_rate_limit(request: Request) -> None:
    settings = get_settings()
    redis = _get_redis()

    client_id = _client_identifier(request)
    window = int(time.time() // 60)
    key = f"ratelimit:generate:{client_id}:{window}"

    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 60)

    if count > settings.rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many generations from this device. Try again in a minute.",
        )
