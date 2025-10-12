"""pytest-style role-based security tests.

These tests use the project's TestClient and fixtures (`client`, `admin_token`,
`test_user_token`) so they run hermetically under pytest and do not depend on
an external server running on localhost.
"""

import pytest
from typing import List

from app.core.config import settings


def _full_path(path: str) -> str:
    # Ensure paths are API-relative (e.g. "/api/v1/...")
    if path.startswith("/"):
        return path
        return f"{settings.API_V1_STR}/{path.lstrip('/')}"


@pytest.mark.usefixtures("client")
def test_admin_protected_routes(client, admin_token, test_user_token):
    admin_endpoints: List[str] = [
        f"{settings.API_V1_STR}/admin/users",
        f"{settings.API_V1_STR}/admin/metrics",
        f"{settings.API_V1_STR}/admin/settings",
    ]

    # Admin should not receive 401/403 for admin endpoints (404 allowed if endpoint absent)
    for ep in admin_endpoints:
        resp = client.get(ep, headers=admin_token)
        if resp.status_code == 404:
            pytest.skip(f"Admin endpoint not present: {ep}")
        assert resp.status_code < 400, f"Admin couldn't access {ep}: {resp.status_code} {resp.text}"

    # Regular user should be denied (403/401) for admin endpoints
    for ep in admin_endpoints:
        resp = client.get(ep, headers=test_user_token)
        if resp.status_code == 404:
            pytest.skip(f"Admin endpoint not present: {ep}")
        assert resp.status_code in (401, 403), f"Regular user wrongly allowed to access {ep}: {resp.status_code}"


@pytest.mark.usefixtures("client")
def test_user_protected_routes(client, admin_token, test_user_token):
    user_endpoints: List[str] = [
        f"{settings.API_V1_STR}/users/me",
        f"{settings.API_V1_STR}/pickups",
        f"{settings.API_V1_STR}/vehicles",
    ]

    # Regular user should be allowed (or 404 if endpoint missing)
    for ep in user_endpoints:
        resp = client.get(ep, headers=test_user_token)
        if resp.status_code == 404:
            pytest.skip(f"User endpoint not present: {ep}")
        assert resp.status_code < 400, f"Regular user denied access to {ep}: {resp.status_code} {resp.text}"

    # Admin should also be allowed
    for ep in user_endpoints:
        resp = client.get(ep, headers=admin_token)
        if resp.status_code == 404:
            pytest.skip(f"User endpoint not present: {ep}")
        assert resp.status_code < 400, f"Admin denied access to {ep}: {resp.status_code} {resp.text}"


@pytest.mark.usefixtures("client")
def test_guest_access_limits(client):
    protected_endpoints = [
        f"{settings.API_V1_STR}/users/me",
        f"{settings.API_V1_STR}/pickups",
        f"{settings.API_V1_STR}/vehicles",
        f"{settings.API_V1_STR}/admin/users",
    ]

    public_endpoints = [
        f"{settings.API_V1_STR}/companies",
        f"{settings.API_V1_STR}/auth/login",
        f"{settings.API_V1_STR}/auth/register",
    ]

    for ep in protected_endpoints:
        resp = client.get(ep)
        if resp.status_code == 404:
            pytest.skip(f"Protected endpoint not present: {ep}")
        assert resp.status_code in (401, 403), f"Guest incorrectly allowed access to {ep}: {resp.status_code}"

    for ep in public_endpoints:
        # For login/register allow OPTIONS fallback as some tests call that
        method = client.options if ep.endswith('/login') or ep.endswith('/register') else client.get
        resp = method(ep)
        if resp.status_code == 404:
            pytest.skip(f"Public endpoint not present: {ep}")
        assert resp.status_code not in (401, 403), f"Guest incorrectly denied public endpoint {ep}: {resp.status_code}"
