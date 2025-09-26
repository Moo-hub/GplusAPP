import os
import time
import pytest
from jose import jwt
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

SECRET_KEY = os.getenv("SECRET_KEY", "testsecret")
ALGORITHM = "HS256"

def create_token(role="user", exp=None):
    payload = {"sub": "testuser", "role": role}
    if exp is not None:
        payload["exp"] = exp
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def test_valid_jwt_access():
    client = TestClient(app)
    token = create_token(role="admin", exp=int(time.time())+60)
    resp = client.get("/admin/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "Admin access granted" in resp.text

def test_invalid_jwt_signature():
    client = TestClient(app)
    token = create_token(role="admin") + "tampered"
    resp = client.get("/admin/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401

def test_expired_jwt():
    client = TestClient(app)
    token = create_token(role="admin", exp=int(time.time())-10)
    resp = client.get("/admin/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401

def test_missing_jwt():
    client = TestClient(app)
    resp = client.get("/admin/admin-only")
    assert resp.status_code == 401

def test_admin_role_access():
    client = TestClient(app)
    token = create_token(role="admin")
    resp = client.get("/admin/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

def test_user_role_forbidden():
    client = TestClient(app)
    token = create_token(role="user")
    resp = client.get("/admin/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

def test_no_token_forbidden():
    client = TestClient(app)
    resp = client.get("/admin/admin-only")
    assert resp.status_code == 401
