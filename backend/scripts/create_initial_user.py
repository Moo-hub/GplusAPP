
import asyncio
import logging
import sys
import os
from sqlalchemy.orm import Session

# Add the project root to the Python path
# This allows running the script from the 'scripts' directory
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app.core.config import settings
from app.db.session import SessionLocal
from app.crud.user import get_by_email, create as create_user
from app.schemas.user import UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_admin_user():
    """
    Creates a default admin user if one doesn't exist.
    """
    # Initialize the database first
    from app.db.db_utils import check_and_init_db
    db_session_for_init = SessionLocal()
    try:
        check_and_init_db(db_session_for_init)
    finally:
        db_session_for_init.close()

    db: Session = SessionLocal()
    try:
        email = settings.FIRST_SUPERUSER_EMAIL
        password = settings.FIRST_SUPERUSER_PASSWORD
        
        user = get_by_email(db, email=email)
        if not user:
            logger.info(f"Creating superuser: {email}")
            user_in = UserCreate(
                email=email,
                password=password,
                name="Default Admin",
                is_superuser=True,
                is_active=True,
            )
            user = create_user(db, obj_in=user_in)
            logger.info("Superuser created successfully.")
        else:
            logger.info(f"Superuser '{email}' already exists in the database.")
            
    except Exception as e:
        logger.error(f"Error during admin user creation: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting admin user creation script...")
    asyncio.run(create_admin_user())
    logger.info("Admin user creation script finished.")
