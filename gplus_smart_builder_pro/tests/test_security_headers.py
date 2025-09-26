from fastapi.testclient import TestClient
from gplus_smart_builder_pro.src.main import app

def test_security_headers_present():
    client = TestClient(app)
    resp = client.get("/")
    headers = resp.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert headers["Permissions-Policy"] == "geolocation=(), microphone=(), camera=()"
