import importlib
import pytest
from fastapi.testclient import TestClient

# Import the app
m = importlib.import_module('app.main')
app = m.app



def test_impacts_service_error(monkeypatch):
    """Simulate service raising an exception and ensure the client gets 500 or error structure."""
    # Monkeypatch the router's bound function the route awaits
    env_router = importlib.import_module('app.environmental.router')

    async def raise_error():
        raise RuntimeError("simulated failure")

    monkeypatch.setattr(env_router, 'list_impacts', raise_error)

    # Use a TestClient that doesn't re-raise server exceptions so we get a 5xx response
    with TestClient(app, raise_server_exceptions=False) as tc:
        response = tc.get("/api/v1/environmental/impacts")
    # Expect a 5xx server error because the endpoint raises
    assert 500 <= response.status_code < 600
