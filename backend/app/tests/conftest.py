import os
import pytest
from typing import Generator
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure test environment BEFORE importing the app so middlewares/lifespan respect it
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Mock Redis to use FakeRedis for testing
try:
    import fakeredis
    FAKEREDIS_AVAILABLE = True
except ImportError:
    FAKEREDIS_AVAILABLE = False


# Use a dedicated SQLite file for app/tests to avoid interfering with dev DB
TEST_SQLALCHEMY_DATABASE_URL = os.getenv("TEST_SQLITE_PATH", "sqlite:///./test.db")

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator:
    """Provide a DB session bound to a fresh SQLite test database."""
    # Fresh transaction per test
    Base.metadata.create_all(bind=engine)

    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function", autouse=True)
def override_db_dependency(db):
    """Override FastAPI's get_db to use the testing session for this test package."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_db, None)

    # Exclude load-test style script from unit test collection
    collect_ignore = [
        "test_rate_limiting.py",
    ]

@pytest.fixture(scope="session", autouse=True)
def mock_redis():
    """Mock Redis connections to use FakeRedis for testing."""
    if FAKEREDIS_AVAILABLE:
        fake_redis = fakeredis.FakeRedis()
        with patch('redis.Redis', return_value=fake_redis):
            with patch('redis.from_url', return_value=fake_redis):
                yield
    else:
        # If fakeredis not available, skip Redis mocking
        yield


@pytest.fixture(scope="session", autouse=True)
def clean_redis_and_reset_state(mock_redis):
    """Clean test-prefixed Redis keys and reset in-memory guards before and after the test session.

    This reduces cross-test flakiness caused by leftover blacklist or rate-limit counters,
    and ensures websocket manager starts clean.
    """
    # Since we're using FakeRedis, we can directly manipulate it
    if FAKEREDIS_AVAILABLE:
        fake_redis = fakeredis.FakeRedis()
        # Clean any test keys
        for key in fake_redis.scan_iter(match="test:*"):
            fake_redis.delete(key)

    # Reset in-process rate limiter and websocket manager
    try:
        import app.api.api_v1.endpoints.auth as auth_endpoints
        auth_endpoints._RL_STATE.clear()
    except Exception:
        pass

    try:
        from app.api.websockets import manager
        manager.active_connections.clear()
        manager.user_connections.clear()
    except Exception:
        pass

    # Yield for tests, then run cleanup again
    yield

    if FAKEREDIS_AVAILABLE:
        fake_redis = fakeredis.FakeRedis()
        for key in fake_redis.scan_iter(match="test:*"):
            fake_redis.delete(key)
