import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database import Base
from src.models.user import User

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_database.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_user_model_creation(db_session):
    """Test that User model can be created with basic fields"""
    user = User(
        email="test@example.com",
        hashed_password="hashed_pw_123",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_active is True


def test_user_model_has_is_superuser(db_session):
    """Test that User model has is_superuser field"""
    user = User(
        email="admin@example.com",
        hashed_password="hashed_pw_456",
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    db_session.commit()
    
    assert user.is_superuser is True
    
    # Test default value
    user2 = User(
        email="user@example.com",
        hashed_password="hashed_pw_789",
        is_active=True
    )
    db_session.add(user2)
    db_session.commit()
    
    assert user2.is_superuser is False


def test_user_email_unique(db_session):
    """Test that email must be unique"""
    from sqlalchemy.exc import IntegrityError
    
    user1 = User(
        email="unique@example.com",
        hashed_password="hashed_pw_111"
    )
    db_session.add(user1)
    db_session.commit()
    
    user2 = User(
        email="unique@example.com",
        hashed_password="hashed_pw_222"
    )
    db_session.add(user2)
    
    with pytest.raises(IntegrityError):
        db_session.commit()
