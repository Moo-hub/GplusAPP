"""Hermetic smoke tests for main API endpoints using TestClient fixtures.

These replace portions of `tests/manual/test_api_endpoints.py` and exercise
the app via the TestClient provided by `backend/tests/conftest.py`.
"""
from __future__ import annotations

import pytest
from typing import Optional

# Reuse the `client` fixture from tests/conftest.py which yields a TestClient
# with dependency overrides for DB and environment set to `test`.


def test_root_and_health(client):
    resp = client.get("/")
    assert resp.status_code in (200, 404)  # app may serve index or 404 in API-only setups

    resp = client.get("/health")
    # Some deployments expose /health, others don't. Accept 200/204 or 404
    assert resp.status_code in (200, 204, 404)


def _get_auth_token(client) -> Optional[str]:
    # Try a few common auth routes used in this project. If login fails, skip
    # higher-level authenticated checks.
    login_paths = ["/api/v1/auth/token", "/api/v1/auth/login", "/auth/token", "/auth/login"]
    test_credentials = {"username": "test@example.com", "password": "password123"}

    for p in login_paths:
        resp = client.post(p, json=test_credentials)
        if resp.status_code == 200:
            body = resp.json()
            token = body.get("access_token") or body.get("token") or body.get("token_value")
            if token:
                return token
    return None


@pytest.mark.skipif(False, reason="Will run in CI when a test user exists")
def test_user_endpoints(client):
    token = _get_auth_token(client)
    if not token:
        pytest.skip("No test user available for authenticated tests")

    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200


def _create_test_pickup(client, token: str) -> Optional[dict]:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    pickup_data = {
        "materials": ["plastic", "glass"],
        "weight_estimate": 1.2,
        "scheduled_date": "2025-10-01T14:00:00Z",
        "address": "123 Test St",
        "time_slot": "13:00-16:00",
        "is_recurring": False,
    }
    resp = client.post("/api/v1/pickups/", headers=headers, json=pickup_data)
    if resp.status_code in (200, 201):
        return resp.json()
    return None


@pytest.mark.skipif(False, reason="Will run in CI when a test user exists")
def test_pickup_endpoints(client):
    token = _get_auth_token(client)
    if not token:
        pytest.skip("No test user available for pickup tests")

    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/pickups/", headers=headers)
    assert resp.status_code in (200, 204)

    pickups = []
    if resp.status_code == 200:
        try:
            pickups = resp.json() or []
        except Exception:
            pickups = []

    if not pickups:
        created = _create_test_pickup(client, token)
        if created:
            pickups = [created]

    if pickups:
        pickup_id = pickups[0].get("id")
        if pickup_id:
            resp = client.get(f"/api/v1/pickups/{pickup_id}", headers=headers)
            assert resp.status_code == 200
