import pytest
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_wallet_info():
    client = TestClient(app)
    resp = client.get("/wallet/")
    assert resp.status_code == 200
    assert "Wallet info endpoint" in resp.text

def test_wallet_info_invalid_method():
    client = TestClient(app)
    resp = client.post("/wallet/")
    assert resp.status_code in (405, 404)
