import pytest
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_auth_login():
    client = TestClient(app)
    resp = client.get("/auth/login")
    assert resp.status_code == 200
    assert "Auth login endpoint" in resp.text

def test_auth_login_invalid_method():
    client = TestClient(app)
    resp = client.post("/auth/login")
    assert resp.status_code in (405, 404)
