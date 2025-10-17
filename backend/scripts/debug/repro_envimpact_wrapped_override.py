"""
Reproducer: apply the same wrapped get_current_user override used in tests,
call the environmental-impact endpoints, and print the full response bodies
and headers so we can inspect the 422 validation errors.
"""
from pathlib import Path
import sys
repo_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo_root))

from app.main import app
from types import SimpleNamespace
from datetime import datetime
from app.api.dependencies.auth import get_current_user
from fastapi.testclient import TestClient
import json

# Define a mock like the tests

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

# Apply override like tests
orig = app.dependency_overrides.get(get_current_user)
app.dependency_overrides[get_current_user] = mock_get_current_user

# Now wrap as conftest does
orig_override = app.dependency_overrides.get(get_current_user)

from types import SimpleNamespace as _SN

def _wrapped_current_user(*args, **kwargs):
    try:
        res = orig_override(*args, **kwargs)
    except TypeError:
        res = orig_override()
    try:
        if hasattr(res, "__iter__") and not isinstance(res, dict):
            return res
    except Exception:
        pass
    if isinstance(res, dict):
        user_payload = dict(res)
        user_payload.setdefault("id", int(user_payload.get("id", 1)))
        user_payload.setdefault("points", int(user_payload.get("points", 0)))
        user_payload.setdefault("address", user_payload.get("address", None))
        user_payload.setdefault("phone_number", user_payload.get("phone_number", None))
        user_payload.setdefault("email_verified", bool(user_payload.get("email_verified", False)))
        user_payload.setdefault("role", user_payload.get("role", "user"))
        if "created_at" not in user_payload or user_payload["created_at"] is None:
            user_payload["created_at"] = datetime.utcnow()
        return _SN(**user_payload)
    return res

_wrapped_current_user._wrapped_by_test_helper = True
app.dependency_overrides[get_current_user] = _wrapped_current_user

print("DEBUG: dependency override installed:", app.dependency_overrides.get(get_current_user))
try:
    import inspect
    print("DEBUG: override signature:", inspect.signature(app.dependency_overrides.get(get_current_user)))
except Exception as e:
    print("DEBUG: could not get signature:", e)

endpoints = [
    '/api/v1/environmental-impact/',
    '/api/v1/environmental-impact/summary?time_period=month',
]

with TestClient(app) as c:
    for ep in endpoints:
        r = c.get(ep)
        print('\nREQUEST', ep)
        print('STATUS', r.status_code)
        print('HEADERS', dict(r.headers))
        try:
            print('JSON:', json.dumps(r.json(), indent=2))
        except Exception:
            print('TEXT:', r.text)

# restore
if orig is not None:
    app.dependency_overrides[get_current_user] = orig
else:
    app.dependency_overrides.pop(get_current_user, None)
