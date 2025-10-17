import asyncio
import logging
import sys
import os
from sqlalchemy.orm import Session

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app.core.config import settings
from app.db.session import SessionLocal
from app.crud.user import get_by_email, create as create_user
from app.schemas.user import UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- User Configuration ---
REGULAR_USER_EMAIL = "user@gplusapp.com"
REGULAR_USER_PASSWORD = "userpassword"
REGULAR_USER_FULL_NAME = "Regular User"
# --------------------------

async def create_user_entry():
    """
    Creates a default regular user if one doesn't exist.
    """
    db: Session = SessionLocal()
    try:
        user = get_by_email(db, email=REGULAR_USER_EMAIL)
        if not user:
            logger.info(f"Creating regular user: {REGULAR_USER_EMAIL}")
            user_in = UserCreate(
                email=REGULAR_USER_EMAIL,
                password=REGULAR_USER_PASSWORD,
                name=REGULAR_USER_FULL_NAME,
                is_superuser=False, # This is a regular user
                is_active=True,
            )
            user = create_user(db, obj_in=user_in)
            logger.info("Regular user created successfully.")
        else:
            logger.info(f"User '{REGULAR_USER_EMAIL}' already exists. Skipping creation.")
    finally:
        db.close()

async def main():
    logger.info("Starting user creation process...")
    await create_user_entry()
    logger.info("User creation process finished.")

if __name__ == "__main__":
    # Ensure the db is initialized before running
    from app.db.db_utils import check_and_init_db
    db_session_for_init = SessionLocal()
    try:
        check_and_init_db(db_session_for_init)
    finally:
        db_session_for_init.close()
        
    asyncio.run(main())
