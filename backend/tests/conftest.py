import os
import sys
import time
import signal
import subprocess
import pytest
import requests
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
from app.core.security import create_access_token, get_password_hash
from app.models.user import User

# Test database URL
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Ensure a clean slate each session
if os.path.exists("./test.db"):
    try:
        os.remove("./test.db")
    except Exception:
        pass

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
    # Ensure tables reflect current models (avoid schema drift)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Create a test session
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Create a test user
    test_user = User(
        email="test@test.com",
        name="Test User",
        hashed_password=get_password_hash("testpass"),  # password: testpass
        is_active=True
    )
    session.add(test_user)
    
    # Create admin user
    admin_user = User(
        email="admin@test.com",
        name="Admin User",
        hashed_password=get_password_hash("testpass"),  # password: testpass
        is_active=True,
        is_superuser=True,
        role="admin"
    )
    session.add(admin_user)
    
    session.commit()
    
    yield session
    
    # Clean up
    session.close()
    transaction.rollback()
    connection.close()
    
    # Remove the database file
    try:
        os.remove("./test.db")
    except Exception:
        pass

@pytest.fixture(scope="session")
def client(db: Generator) -> Generator:
    """
    Create a TestClient for testing API endpoints
    """
    # Override the get_db dependency to use the test database
    def override_get_db():
        # Use the shared session for the duration of the test session.
        # Do not close per-request to avoid detaching instances mid-test.
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as client:
        yield client
    
    # Reset dependency overrides after tests
    app.dependency_overrides = {}


def _wait_for_server(base_url: str, timeout_seconds: int = 20) -> bool:
    """Poll the health endpoint until the server is up or timeout expires."""
    deadline = time.time() + timeout_seconds
    health_url = base_url.rstrip("/") + "/health"
    while time.time() < deadline:
        try:
            r = requests.get(health_url, timeout=0.5)
            if r.status_code < 500:
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


@pytest.fixture(scope="session", autouse=True)
def ensure_live_server() -> Generator[None, None, None]:
    """
    Ensure a live uvicorn server is running for tests that hit http://localhost:8000.
    If it's already up, do nothing. Otherwise, start it as a subprocess and stop it at the end.
    """
    base_url = os.environ.get("BASE_URL", "http://localhost:8000")

    # If server already up, don't start another one
    if _wait_for_server(base_url, timeout_seconds=2):
        yield
        return

    # Build environment for the server process
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    app_dir = os.path.join(backend_dir, "app")
    env = os.environ.copy()
    py_path = env.get("PYTHONPATH", "")
    # Use OS-specific path separator
    pathsep = os.pathsep
    parts = [backend_dir, app_dir]
    if py_path:
        parts.append(py_path)
    env["PYTHONPATH"] = pathsep.join(parts)
    # Force ENVIRONMENT to development by default so security middleware is active;
    # allow override via LIVE_SERVER_ENV if needed.
    env["ENVIRONMENT"] = env.get("LIVE_SERVER_ENV", "development")
    # Disable email verification in integration server to avoid SMTP dependencies
    env.setdefault("REQUIRE_EMAIL_VERIFICATION", "False")

    # Ensure a fresh SQLite database for the live server to avoid schema drift
    # Use a test-specific sqlite file to avoid touching developer's app.db
    test_sqlite_filename = "test_app.db"
    env["SQLITE_PATH"] = test_sqlite_filename
    sqlite_path = os.path.join(backend_dir, test_sqlite_filename)
    try:
        if os.path.exists(sqlite_path):
            os.remove(sqlite_path)
    except Exception:
        # Non-fatal; tests may fail if schema is stale, but we proceed
        pass

    # Start uvicorn subprocess
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "localhost",
        "--port",
        "8000",
        "--log-level",
        "warning",
    ]

    # Log server output to a file for debugging integration failures
    log_path = os.path.join(backend_dir, "logs", "uvicorn_test.log")
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    log_file = open(log_path, "wb")
    proc = subprocess.Popen(
        cmd,
        cwd=backend_dir,
        env=env,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )

    started = _wait_for_server(base_url, timeout_seconds=20)
    if not started:
        # If the server didn't start, terminate process and proceed (tests may fail accordingly)
        try:
            proc.terminate()
        except Exception:
            pass
        yield
        return

    try:
        yield
    finally:
        # Cleanly stop the server
        try:
            if os.name == "nt":
                proc.terminate()
            else:
                proc.send_signal(signal.SIGINT)
            proc.wait(timeout=5)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
        try:
            log_file.close()
        except Exception:
            pass

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