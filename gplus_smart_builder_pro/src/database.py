import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Base for both sync and async
Base = declarative_base()

# --- SYNC (for Alembic) ---
SYNC_POSTGRES_URL = os.getenv(
    "SYNC_POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/app"
)
sync_engine = create_engine(SYNC_POSTGRES_URL)
SyncSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=sync_engine
)

# --- ASYNC (for FastAPI) ---

import aioredis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

POSTGRES_URL = os.getenv(
    "POSTGRES_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/app",
)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
engine = create_async_engine(POSTGRES_URL, future=True, echo=True)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
redis = aioredis.from_url(
    REDIS_URL, encoding="utf-8", decode_responses=True
)

# Dependency for DB
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# Dependency for Redis
async def get_redis():
    yield redis
