from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import AsyncGenerator
from app.core.settings import get_settings

settings = get_settings()

# ── Async engine — used by FastAPI route handlers ─────────────────────────────
async_engine = create_async_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    echo=settings.debug,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── Sync engine — used by Celery workers (separate process, no asyncio loop) ──
sync_engine = create_engine(
    settings.sync_database_url,
    pool_size=5,
    max_overflow=10,
    echo=settings.debug,
    pool_pre_ping=True,
)

SyncSessionLocal = sessionmaker(
    sync_engine,
    autocommit=False,
    autoflush=False,
)
