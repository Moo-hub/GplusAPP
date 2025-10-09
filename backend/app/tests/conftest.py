import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure tests run in test environment and set a DATABASE_URL if not provided
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///./app_test.db")

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User

TEST_SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app_test.db")

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db() -> Generator:
    # Remove existing test DB if present
    test_db_path = "./app_test.db"
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except OSError:
            Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)

    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Create default test users
    test_user = User(
        email="test@app.test",
        name="Test User",
        hashed_password=get_password_hash("testpass"),
        is_active=True
    )
    session.add(test_user)

    admin_user = User(
        email="admin@app.test",
        name="Admin User",
        hashed_password=get_password_hash("testpass"),
        is_active=True,
        is_superuser=True
    )
    session.add(admin_user)

    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

    try:
        os.remove(test_db_path)
    except OSError:
        pass

@pytest.fixture(scope="session")
def client(db: Generator) -> Generator:
    def override_get_db():
        yield db
    # Snapshot existing overrides and restore them after tests to avoid
    # destructive assignment which can leak state across test modules.
    orig_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    # Restore original overrides rather than wiping the whole dict. Some
    # tests (or helper scripts) mistakenly assign app.dependency_overrides = {}
    # which removes other modules' overrides; restoring the snapshot keeps
    # test runs deterministic.
    app.dependency_overrides.clear()
    app.dependency_overrides.update(orig_overrides)

@pytest.fixture(scope="session")
def test_user_token():
    # Lookup test user id created by the db fixture
    try:
        from app.models.user import User as _User
        # Use the application's SessionLocal if available
        from app.db.session import SessionLocal as _SessionLocal
        s = _SessionLocal()
        user = s.query(_User).filter(_User.email == "test@app.test").first()
        s.close()
        subject = user.id if user else 1
    except Exception:
        subject = 1
    access_token = create_access_token(subject=subject, extra_data={"role": "user", "disabled": False})
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(scope="session")
def admin_token():
    try:
        from app.models.user import User as _User
        from app.db.session import SessionLocal as _SessionLocal
        s = _SessionLocal()
        admin = s.query(_User).filter(_User.email == "admin@app.test").first()
        s.close()
        subject = admin.id if admin else 2
    except Exception:
        subject = 2
    access_token = create_access_token(subject=subject, extra_data={"role": "admin", "disabled": False})
    return {"Authorization": f"Bearer {access_token}"}
