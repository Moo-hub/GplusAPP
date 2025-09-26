import os
from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_cors_allows_only_frontend_origin():
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    client = TestClient(app)
    # Allowed origin
    resp = client.options("/", headers={
        "Origin": frontend_origin,
        "Access-Control-Request-Method": "GET"
    })
    assert resp.headers.get("access-control-allow-origin") == frontend_origin
    # Disallowed origin
    resp2 = client.options("/", headers={
        "Origin": "https://evil.com",
        "Access-Control-Request-Method": "GET"
    })
    # Should not echo the disallowed origin
    assert resp2.headers.get("access-control-allow-origin") != "https://evil.com"
