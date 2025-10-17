import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo_root))

from app.main import app
from fastapi.testclient import TestClient
from types import SimpleNamespace
from datetime import datetime
import json

# Mock like the test
def mock_get_current_user():
    return SimpleNamespace(
        id=1,
        email="test@example.com",
        is_active=True,
        is_superuser=False,
        name="Test User",
        points=0,
        address=None,
        phone_number=None,
        email_verified=False,
        role="user",
        created_at=datetime.utcnow(),
    )

from app.api.dependencies.auth import get_current_user

# Apply override
orig = app.dependency_overrides.get(get_current_user)
app.dependency_overrides[get_current_user] = mock_get_current_user

c = TestClient(app)
endpoints = [
    '/api/v1/environmental-impact/',
    '/api/v1/environmental-impact/summary?time_period=month',
    '/api/v1/environmental-impact/trend?metric=recycled&time_range=month&granularity=day',
    '/api/v1/environmental-impact/materials?time_period=month',
    '/api/v1/environmental-impact/leaderboard?time_period=month&metric=recycled_weight',
]

for ep in endpoints:
    r = c.get(ep)
    print('\nREQUEST', ep)
    print('STATUS', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)

# restore
if orig is not None:
    app.dependency_overrides[get_current_user] = orig
else:
    app.dependency_overrides.pop(get_current_user, None)
