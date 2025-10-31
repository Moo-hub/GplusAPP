"""
Test helpers for creating users and obtaining auth headers.
"""
from typing import Dict
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate
from app.crud.user import create as create_user
from app.core.config import settings
from .utils import random_lower_string


DEFAULT_TEST_PASSWORD = "testpassword"


def create_random_user(db: Session, *, password: str = DEFAULT_TEST_PASSWORD):
    """Create and return a random user in the provided DB session."""
    email = f"{random_lower_string(8)}@example.com"
    name = f"Test {random_lower_string(6)}"
    user_in = UserCreate(email=email, name=name, password=password)
    user = create_user(db, obj_in=user_in)
    return user


def user_authentication_headers(client: TestClient, email: str, password: str = DEFAULT_TEST_PASSWORD) -> Dict[str, str]:
    """Login via API and return Authorization headers for subsequent requests."""
    login_url = f"{settings.API_V1_STR}/auth/login"
    resp = client.post(login_url, data={"username": email, "password": password})
    resp.raise_for_status()
    data = resp.json()
    token = data.get("access_token")
    return {"Authorization": f"Bearer {token}"}
