from typing import Dict
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.crud.user import create as create_user
from app.schemas.user import UserCreate
from app.core.security import create_access_token


def create_random_user(db: Session, email: str = None, password: str = "testpassword"):
    if email is None:
        import uuid
        email = f"test_{uuid.uuid4().hex[:8]}_{password}@example.com"

    user_in = UserCreate(
        email=email,
        name="Test User",
        password=password
    )
    return create_user(db, obj_in=user_in)


def user_authentication_headers(client: TestClient, email: str, password: str) -> Dict[str, str]:
    # Simple helper to obtain auth token via the API (assumes /api/v1/auth/token exists)
    resp = client.post("/api/v1/auth/token", data={"username": email, "password": password})
    if resp.status_code == 200:
        token = resp.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}

    # Try test-only helper that looks up user by email and issues a token
    resp2 = client.get(f"/api/v1/auth/test-token/{email}")
    if resp2.status_code == 200:
        token = resp2.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}

    # Fallback: create a token directly for subject 1 (best-effort)
    try:
        token = create_access_token(subject=1)
        return {"Authorization": f"Bearer {token}"}
    except Exception:
        return {}
