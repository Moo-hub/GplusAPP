

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'app')))
from app.main import app
from fastapi.testclient import TestClient

def test_get_impacts_ok():
    client = TestClient(app)
    response = client.get("/api/v1/environmental/impacts")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert all("id" in item and "category" in item and "score" in item for item in body)
