import pytest
from src.models.user import User
from src.database import Base
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_models.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_user_model_has_is_superuser(db_session):
    """Test that the User model has is_superuser column"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    assert 'is_superuser' in columns

def test_create_user_with_is_superuser(db_session):
    """Test creating a user with is_superuser flag"""
    user = User(
        email="admin@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    db_session.commit()
    
    retrieved_user = db_session.query(User).filter(User.email == "admin@example.com").first()
    assert retrieved_user is not None
    assert retrieved_user.is_superuser is True

def test_user_default_is_superuser_false(db_session):
    """Test that is_superuser defaults to False"""
    user = User(
        email="user@example.com",
        hashed_password="hashed_password",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    retrieved_user = db_session.query(User).filter(User.email == "user@example.com").first()
    assert retrieved_user is not None
    assert retrieved_user.is_superuser is False
