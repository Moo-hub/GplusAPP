import os
from fastapi.testclient import TestClient

# Ensure test env
os.environ['ENVIRONMENT'] = 'test'
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

from app.main import app
from app.core.security import create_access_token
from app.api.dependencies.auth import get_current_user

# Mock that returns a dict (like the environmental_impact test)

def mock_get_current_user():
    return {
        "id": 1,
        "email": "test@example.com",
        "is_active": True,
        "is_superuser": False
    }

# Run inside TestClient context and apply the override for the duration of the
# script to avoid mutating app.dependency_overrides at import time.
orig = app.dependency_overrides.get(get_current_user)
try:
    # Apply the override only during the TestClient context to avoid import-time
    # mutation of app.dependency_overrides which leaks state across tests.
    with TestClient(app) as client:
        app.dependency_overrides[get_current_user] = mock_get_current_user

        # Create a valid access token for user id 1
        access_token = create_access_token(subject=1, extra_data={"role": "user", "disabled": False})
        headers = {"Authorization": f"Bearer {access_token}"}

        print('Using override get_current_user -> mock_get_current_user (dict)')
        print('Requesting /api/v1/auth/me with valid token...')
        resp = client.get('/api/v1/auth/me', headers=headers)
        print('STATUS', resp.status_code)
        try:
            print('JSON:', resp.json())
        except Exception as e:
            print('Could not parse JSON:', e, 'text=', resp.text)

        print('\nRequesting /api/v1/auth/me with invalid token...')
        resp2 = client.get('/api/v1/auth/me', headers={"Authorization": "Bearer invalidtoken"})
        print('STATUS', resp2.status_code)
        try:
            print('JSON:', resp2.json())
        except Exception as e:
            print('Could not parse JSON:', e, 'text=', resp2.text)
finally:
    # Restore original override to avoid affecting other scripts/tests
    if orig is not None:
        app.dependency_overrides[get_current_user] = orig
    else:
        app.dependency_overrides.pop(get_current_user, None)
