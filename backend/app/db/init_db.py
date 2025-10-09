import logging
from sqlalchemy.orm import Session

from app.db.session import engine
from app.db.base import Base
from app.schemas.user import UserCreate
from app.schemas.company import CompanyCreate
from app.crud.user import get_by_email, create as create_user
from app.crud import company as company_crud

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create initial test user (use emails that test fixtures expect)
    user = get_by_email(db, email="test@test.com")
    if not user:
        user_in = UserCreate(
            name="Test User",
            email="test@test.com",
            password="testpass"
        )
        create_user(db, obj_in=user_in)
        logger.info("Created initial test user")

    # Create admin user if it doesn't exist
    admin = get_by_email(db, email="admin@test.com")
    if not admin:
        admin_in = UserCreate(
            name="Admin User",
            email="admin@test.com",
            password="testpass"
        )
        create_user(db, obj_in=admin_in)
        logger.info("Created admin user")
    
    # Create initial companies
    companies = db.query(company_crud.Company).count()
    if companies == 0:
        # Create EcoRecycle Solutions
        eco_company = CompanyCreate(
            name="EcoRecycle Solutions",
            description="Specialized in plastic and paper recycling with state-of-the-art facilities.",
            logo_url="https://example.com/ecorecycle.png",
            materials=["plastic", "paper"],
            impact_metrics={
                "co2_saved": 1500,
                "trees_saved": 350,
                "water_saved": 25000
            },
            contact_info={
                "phone": "+1234567890",
                "email": "info@ecorecycle.example",
                "address": "456 Sustainable Way, Green Valley"
            }
        )
        company_crud.create(db, obj_in=eco_company)
        
        # Create GlassMetal Reclaim
        glass_company = CompanyCreate(
            name="GlassMetal Reclaim",
            description="Focused on glass and metal recycling with innovative processing techniques.",
            logo_url="https://example.com/glassmetal.png",
            materials=["glass", "metal"],
            impact_metrics={
                "co2_saved": 2300,
                "energy_saved": 45000,
                "landfill_reduced": 12000
            },
            contact_info={
                "phone": "+1987654321",
                "email": "contact@glassmetal.example",
                "address": "789 Industrial Eco Park, Sustainable City"
            }
        )
        company_crud.create(db, obj_in=glass_company)
        
        logger.info("Created initial companies")

def main() -> None:
    from app.db.session import SessionLocal
    db = SessionLocal()
    init_db(db)

if __name__ == "__main__":
    logger.info("Creating initial data")
    main()
    logger.info("Initial data created")