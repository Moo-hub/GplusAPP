from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.core.config import settings

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


# If running tests, ensure the test database schema is created and seeded so
# tests that open SessionLocal() directly can run without needing the
# application startup event.
try:
    from app.core.config import settings as _settings
    if _settings.ENVIRONMENT == "test":
        try:
            from app.db.init_db import init_db
            db = SessionLocal()
            try:
                init_db(db)
            finally:
                db.close()
        except Exception as _e:
            # Don't raise here; tests may proceed and will surface errors.
            import logging
            logging.getLogger(__name__).warning(f"Test DB initialization failed: {_e}")
except Exception:
    # If config import fails for any reason, skip test auto-init silently.
    pass
