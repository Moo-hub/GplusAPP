import pytest
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_recycling_info():
    client = TestClient(app)
    resp = client.get("/recycling/")
    assert resp.status_code == 200
    assert "Recycling info endpoint" in resp.text

def test_recycling_info_invalid_method():
    client = TestClient(app)
    resp = client.post("/recycling/")
    assert resp.status_code in (405, 404)
