import pytest
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_vehicles_info():
    client = TestClient(app)
    resp = client.get("/vehicles/")
    assert resp.status_code == 200
    assert "Vehicles info endpoint" in resp.text

def test_vehicles_info_invalid_method():
    client = TestClient(app)
    resp = client.post("/vehicles/")
    assert resp.status_code in (405, 404)
