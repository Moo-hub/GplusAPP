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
