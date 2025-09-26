import pytest
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_list_users():
    client = TestClient(app)
    resp = client.get("/users/")
    assert resp.status_code == 200
    assert "List users endpoint" in resp.text

def test_list_users_invalid_method():
    client = TestClient(app)
    resp = client.post("/users/")
    assert resp.status_code in (405, 404)
