import pytest
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_carbon_info():
    client = TestClient(app)
    resp = client.get("/carbon/")
    assert resp.status_code == 200
    assert "Carbon info endpoint" in resp.text

def test_carbon_info_invalid_method():
    client = TestClient(app)
    resp = client.post("/carbon/")
    assert resp.status_code in (405, 404)
