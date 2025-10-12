import os
from fastapi.testclient import TestClient

os.environ['ENVIRONMENT'] = 'test'
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

from app.main import app
from app.core.security import create_access_token
from app.api.dependencies.auth import get_current_user

# Mock that returns a dict (same as test_environmental_impact_api)

def mock_get_current_user():
    return {
        "id": 1,
        "email": "test@example.com",
        "is_active": True,
        "is_superuser": False
    }

# Apply override only while running this script
orig = app.dependency_overrides.get(get_current_user)
try:
    with TestClient(app) as client:
        # Apply override only while the TestClient is active
        app.dependency_overrides[get_current_user] = mock_get_current_user
        access_token = create_access_token(subject=1, extra_data={"role": "user", "disabled": False})
        headers = {"Authorization": f"Bearer {access_token}"}

        endpoints = [
            '/api/v1/pickups/admin',
            '/api/v1/pickups/timeslots?start_date=2025-10-08&days=3',
            '/api/v1/pickups/1',
        ]

        for ep in endpoints:
            resp = client.get(ep, headers=headers)
            print('\nREQUEST', ep)
            print('STATUS', resp.status_code)
            try:
                print('TEXT:', resp.json())
            except Exception:
                print('RAW:', resp.text)
finally:
    if orig is not None:
        app.dependency_overrides[get_current_user] = orig
    else:
        app.dependency_overrides.pop(get_current_user, None)
