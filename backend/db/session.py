from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from core.config import get_settings


class Base(DeclarativeBase):
    pass


def _to_asyncpg_url(database_url: str) -> str:
    if database_url.startswith("postgresql+asyncpg://"):
        return database_url
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return database_url


@lru_cache
def _get_engine():
    settings = get_settings()
    return create_async_engine(_to_asyncpg_url(settings.database_url), pool_pre_ping=True)


@lru_cache
def _get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(_get_engine(), expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    sessionmaker = _get_sessionmaker()
    async with sessionmaker() as session:
        yield session
