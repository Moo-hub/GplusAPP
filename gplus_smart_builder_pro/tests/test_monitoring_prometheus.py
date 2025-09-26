from gplus_smart_builder_pro.src.monitoring.prometheus import router
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_metrics_route():
    client = TestClient(app)
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
