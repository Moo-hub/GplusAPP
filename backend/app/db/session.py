from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.core.config import settings

# In test environment, align with test suite DB and ensure a clean schema
if settings.ENVIRONMENT == "test":
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    # Ensure tables match current models for manual tests that don't use fixtures
    try:
        from app.db.base import Base  # noqa: F401 ensures models are imported
        # Drop and recreate to avoid schema drift across runs
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    except Exception:
        # If anything goes wrong, continue; fixture-based tests will manage schema
        pass
else:
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
    # Configure engine differently based on database type
    if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
        # SQLite needs connect_args={"check_same_thread": False} for FastAPI
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        # PostgreSQL or other databases
        engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
