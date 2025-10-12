import os
os.environ.setdefault("ENVIRONMENT", "test")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.main import app
from app.tests.utils.user import create_random_user, user_authentication_headers

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./app_test_debug.db"
engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# create DB
Base.metadata.create_all(bind=engine)

# create session and user
session = TestingSessionLocal()
user = create_random_user(session)

# override get_db
from app.db.session import get_db

def override_get_db():
    try:
        yield session
    finally:
        pass

orig_override = app.dependency_overrides.get(get_db)
try:
    # Apply the DB override only while the TestClient is active to avoid
    # mutating app.dependency_overrides at import time which leaks between
    # test modules and causes order-dependent failures.
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        headers = user_authentication_headers(client, user.email, "testpassword")
        print('Headers:', headers)
        resp = client.get('/api/v1/notifications/preferences', headers=headers)
        print('Status', resp.status_code)
        print('Body:', resp.text)
finally:
    # Restore original override to avoid affecting other scripts/tests
    if orig_override is not None:
        app.dependency_overrides[get_db] = orig_override
    else:
        app.dependency_overrides.pop(get_db, None)

    # cleanup
    session.close()
    try:
        import os
        os.remove('./app_test_debug.db')
    except Exception:
        pass
