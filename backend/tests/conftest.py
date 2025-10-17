import os
import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment to test early so settings pick it up before modules import them
os.environ["ENVIRONMENT"] = "test"
# Ensure the app and tests use the same SQLite test database file
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.api.dependencies.auth import get_current_user

# Test database URL
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test database engine
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch the application's db.session to use the test engine and session factory.
# This ensures code that calls SessionLocal() or relies on the module-level
# engine uses the test database instead of the real one.
try:
    import app.db.session as app_db_session
    app_db_session.engine = engine
    app_db_session.SessionLocal = TestingSessionLocal
except Exception:
    # If patching fails, tests will still run because we override get_db for
    # endpoint dependencies, but direct SessionLocal() calls may target the
    # real DB.
    pass

@pytest.fixture(scope="session")
def db() -> Generator:
    """
    Create a fresh database on each test case
    """
    # Ensure any previous test database is removed so schema matches models
    test_db_path = "./test.db"
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except OSError:
            # If removal fails, attempt to drop all tables as a fallback
            Base.metadata.drop_all(bind=engine)

    # Create the test database and tables
    Base.metadata.create_all(bind=engine)
    
    # Create a test session
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Create a test user (use app hashing so scheme matches runtime)
    test_user = User(
        email="test@test.com",
        name="Test User",
        hashed_password=get_password_hash("testpass"),
        is_active=True
    )
    session.add(test_user)
    
    # Create admin user
    admin_user = User(
        email="admin@test.com",
        name="Admin User",
        hashed_password=get_password_hash("testpass"),
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
    
    # Remove the database file (ignore Windows file-lock errors)
    try:
        os.remove("./test.db")
    except OSError:
        pass

@pytest.fixture(scope="session")
def client(db: Generator) -> Generator:
    """
    Create a TestClient for testing API endpoints
    """
    # Override the get_db dependency to use the test database
    def override_get_db():
        # Return the shared session for the duration of tests. Do not close here
        # because the session is managed by the fixture teardown.
        yield db
    
    app.dependency_overrides[get_db] = override_get_db

    # Capture original overrides so we can restore them after tests.
    orig_overrides = dict(app.dependency_overrides)

    with TestClient(app) as client:
        yield client

    # Restore original dependency overrides after the TestClient context exits.
    # Some tests mutate app.dependency_overrides directly (e.g. app.dependency_overrides = {}),
    # which can leak across tests. Restoring to the snapshot we took at client setup
    # ensures deterministic behavior for subsequent test sessions.
    app.dependency_overrides.clear()
    app.dependency_overrides.update(orig_overrides)


# Ensure our get_db override is present for every test. Some test modules
# temporarily replace or reset `app.dependency_overrides` (for mocking
# get_current_user etc). If they clear the overrides dict, subsequent
# tests can lose the database override which causes 401s because the
# app tries to use the real DB/session. A per-test autouse fixture will
# re-apply the get_db override before each test.
@pytest.fixture(autouse=True)
def ensure_get_db_override(db):
    def override_get_db():
        yield db

    # Re-apply before each test
    app.dependency_overrides[get_db] = override_get_db

    # Instrumentation: record the state of dependency_overrides before and after
    # each test run so we can detect tests that clear or replace the dict.
    try:
        import logging
        logger = logging.getLogger("tests.dependency_overrides_instrumentation")

        # Snapshot before test
        before_keys = list(app.dependency_overrides.keys())
        logger.info("dependency_overrides BEFORE test: %s", [k.__name__ if hasattr(k, '__name__') else str(k) for k in before_keys])

        # If there is an override for get_current_user, log details about it.
        try:
            override_callable = app.dependency_overrides.get(get_current_user)
            if override_callable is not None:
                try:
                    qualname = getattr(override_callable, '__qualname__', None) or getattr(override_callable, '__name__', repr(override_callable))
                except Exception:
                    qualname = repr(override_callable)
                try:
                    module = getattr(override_callable, '__module__', None)
                except Exception:
                    module = None
                logger.info("get_current_user override detected: %s (module=%s)", qualname, module)
                # Safe attempt to call the override with no args to see what it returns (many test mocks are nullary)
                try:
                    ret = override_callable()
                    # If it's a generator, get the first yielded value
                    try:
                        if hasattr(ret, '__iter__') and not isinstance(ret, dict):
                            # Attempt to consume one item if it's a generator
                            next_val = next(ret)
                            logger.info("get_current_user() returned generator yielding: %s", type(next_val))
                        else:
                            logger.info("get_current_user() returned: %s", type(ret))
                    except StopIteration:
                        logger.info("get_current_user() generator returned no items")
                    except Exception:
                        logger.info("get_current_user() returned (uninspectable)")
                except TypeError:
                    # Callable expects args; skip
                    logger.info("get_current_user override callable requires parameters; skipping call")
                except Exception:
                    logger.exception("Error when calling get_current_user override for inspection")
        except Exception:
            logger.exception("Error inspecting get_current_user override")
    except Exception:
        logger = None
    # NOTE: removed automatic wrapping of get_current_user test overrides.
    # Tests should install compatible overrides themselves (returning model-like
    # objects or using FastAPI-compatible dependencies). Automatic wrapping was
    # brittle and caused FastAPI to interpret varargs as query parameters
    # resulting in 422 validation errors. We keep instrumentation logs above
    # to help detect problematic overrides.
    yield

    # Snapshot after test for telemetry
    try:
        after_keys = list(app.dependency_overrides.keys())
        if logger:
            logger.info("dependency_overrides AFTER test: %s", [k.__name__ if hasattr(k, '__name__') else str(k) for k in after_keys])
    except Exception:
        pass

@pytest.fixture(scope="session")
def test_user_token(db) -> Dict[str, Any]:
    """Create a token for the test user by looking up their DB id."""
    # The db fixture creates a user with email 'test@test.com'
    try:
        user = db.query(User).filter(User.email == "test@test.com").first()
        user_id = user.id if user else 1
    except Exception:
        user_id = 1
    access_token = create_access_token(subject=user_id, extra_data={"role": "user", "disabled": False})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="session")
def admin_token(db) -> Dict[str, Any]:
    """Create a token for the admin user by looking up their DB id."""
    try:
        admin = db.query(User).filter(User.email == "admin@test.com").first()
        admin_id = admin.id if admin else 2
    except Exception:
        admin_id = 2
    access_token = create_access_token(subject=admin_id, extra_data={"role": "admin", "disabled": False})
    return {"Authorization": f"Bearer {access_token}"}