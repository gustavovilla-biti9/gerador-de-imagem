from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Required secrets/config, read from env vars.

    Instantiating this raises a clear validation error if something required
    is missing — never fall back to a silent default for a secret.
    """

    replicate_api_token: str
    database_url: str
    upstash_redis_rest_url: str
    upstash_redis_rest_token: str
    rate_limit_per_minute: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
