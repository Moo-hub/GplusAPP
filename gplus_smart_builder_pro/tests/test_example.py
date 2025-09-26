from fastapi.testclient import TestClient

from gplus_smart_builder_pro.src.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
