import asyncio
import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from app.middlewares.security import RateLimiter
from app.core.redis_client import InMemoryRedis, get_redis_client


@pytest.fixture(autouse=True)
def ensure_test_env(monkeypatch):
    # ensure settings.ENVIRONMENT is test so get_redis_client returns InMemoryRedis
    monkeypatch.setenv("ENVIRONMENT", "test")
    yield


def _make_app():
    app = FastAPI()

    @app.get("/api/auth/login")
    async def login():
        return {"ok": True}

    # add the rate limiter middleware
    app.add_middleware(RateLimiter)

    return app


def test_fail_open_when_no_redis(monkeypatch):
    # Simulate get_redis_client returning None
    monkeypatch.setattr('app.core.redis_client.get_redis_client', lambda: None)

    app = _make_app()
    client = TestClient(app)

    r = client.get('/api/auth/login')
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_rate_limit_enforced(monkeypatch):
    # Return a fresh in-memory redis for this test
    monkeypatch.setattr('app.core.redis_client.get_redis_client', lambda: InMemoryRedis())

    app = _make_app()
    client = TestClient(app)

    # Default RATE_LIMIT_MAX_REQUESTS is 100; we'll monkeypatch to a small value
    monkeypatch.setenv('RATE_LIMIT_MAX_REQUESTS', '3')
    monkeypatch.setenv('RATE_LIMIT_WINDOW_SECONDS', '60')

    # Consume allowed requests
    for _ in range(3):
        r = client.get('/api/auth/login')
        assert r.status_code == 200

    # Next request should be rate limited
    r = client.get('/api/auth/login')
    assert r.status_code == 429
    payload = r.json()
    assert payload.get('detail', {}).get('code') == 'RATE_LIMIT_EXCEEDED'
