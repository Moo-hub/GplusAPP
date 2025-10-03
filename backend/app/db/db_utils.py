import logging
from sqlalchemy.orm import Session
from app.db.init_db import init_db
from sqlalchemy.sql import text

logger = logging.getLogger(__name__)

def check_db_connected(db: Session) -> None:
    """
    Checks if the database is connected
    """
    try:
        # Execute a simple query to check if the database is connected
        db.execute(text("SELECT 1"))
        logger.info("Database is connected")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        # For development environments, we'll log the error but allow the app to continue
        from app.core.config import settings
        if settings.ENVIRONMENT == "development":
            logger.warning("Running in development mode, continuing despite database error")
            return
        raise e

def check_and_init_db(db: Session) -> None:
    """
    Checks if the database is initialized, and initializes it if needed
    """
    from app.core.config import settings
    
    try:
        # Different approach for SQLite vs PostgreSQL
        if settings.DATABASE_URL.startswith('sqlite'):
            # For SQLite, check if any tables exist
            query = text("SELECT name FROM sqlite_master WHERE type='table'")
            tables = db.execute(query)
            if not list(tables):
                logger.info("SQLite database is empty. Initializing database...")
                init_db(db)
            else:
                logger.info("SQLite database already initialized")
        else:
            # For PostgreSQL
            query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = db.execute(query)
            if not list(tables):
                logger.info("PostgreSQL database is empty. Initializing database...")
                init_db(db)
            else:
                logger.info("PostgreSQL database already initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # For development, log but continue
        if settings.ENVIRONMENT == "development":
            logger.warning("Running in development mode, continuing despite database initialization error")
            return
        raise e