import os
import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment to test
os.environ["ENVIRONMENT"] = "test"

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import create_access_token
from app.models.user import User

# Test database URL
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test database engine
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db() -> Generator:
    """
    Create a fresh database on each test case
    """
    # Create the test database and tables
    Base.metadata.create_all(bind=engine)
    
    # Create a test session
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Create a test user
    test_user = User(
        email="test@test.com",
        name="Test User",
        hashed_password="$2b$12$XO0lAHZaXLmEYFWBx8bJdeSrWGW/Z6LbGq4qYY2o8P0fLb/xd7EJS",  # password: testpass
        is_active=True
    )
    session.add(test_user)
    
    # Create admin user
    admin_user = User(
        email="admin@test.com",
        name="Admin User",
        hashed_password="$2b$12$XO0lAHZaXLmEYFWBx8bJdeSrWGW/Z6LbGq4qYY2o8P0fLb/xd7EJS",  # password: testpass
        is_active=True,
        is_superuser=True
    )
    session.add(admin_user)
    
    session.commit()
    
    yield session
    
    # Clean up
    session.close()
    transaction.rollback()
    connection.close()
    
    # Remove the database file
    os.remove("./test.db")

@pytest.fixture(scope="session")
def client(db: Generator) -> Generator:
    """
    Create a TestClient for testing API endpoints
    """
    # Override the get_db dependency to use the test database
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as client:
        yield client
    
    # Reset dependency overrides after tests
    app.dependency_overrides = {}

@pytest.fixture(scope="session")
def test_user_token() -> Dict[str, Any]:
    """
    Create a token for test user
    """
    access_token = create_access_token(subject=1)
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(scope="session")
def admin_token() -> Dict[str, Any]:
    """
    Create a token for admin user
    """
    access_token = create_access_token(subject=2)
    return {"Authorization": f"Bearer {access_token}"}