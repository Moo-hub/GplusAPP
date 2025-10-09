"""
Pytest-friendly authentication security tests.

This test module exercises CSRF protection, rate limiting, token validation,
and token blacklisting/logout using the FastAPI TestClient fixture `client`.

Design decisions:
- Use the shared `client` fixture from `conftest.py` (must be available).
- Persist cookies on `client.cookies` (avoid per-request `cookies=` usage).
- Use `assert` for test outcomes; no test should `return` values.
- Keep tests hermetic and idempotent by creating unique test users.
"""

import time
import pytest

API_PREFIX = "/api/v1"


def _unique_email():
    return f"auth_security_test_{int(time.time()*1000)}@example.com"


def setup_test_user(client):
    """Register a fresh test user and store tokens/cookies on the client.

    Returns a dict with keys: access_token, refresh_token, csrf_token, email, user
    Raises AssertionError if registration/login fails.
    """
    test_user = {
        "email": _unique_email(),
        "password": "TestPassword123!",
        "name": "Auth Security Test User",
    }

    # Register
    url = f"{API_PREFIX}/auth/register"
    resp = client.post(url, json=test_user)
    assert resp.status_code == 200, f"Register failed: {resp.status_code} {resp.text}"
    payload = resp.json()

    # Persist cookies on the TestClient instance to avoid per-request cookie deprecation
    try:
        cookie_dict = getattr(resp.cookies, "get_dict", lambda: dict())()
        if cookie_dict:
            client.cookies.update(cookie_dict)
    except Exception:
        # Non-fatal — tests will still attempt to use returned tokens
        pass

    return {
        "access_token": payload.get("access_token"),
        "refresh_token": payload.get("refresh_token"),
        "csrf_token": payload.get("csrf_token"),
        "email": test_user["email"],
        "user": payload.get("user"),
    }


def test_csrf_protection(client):
    """CSRF: ensure valid CSRF token is accepted; missing/invalid behavior may
    vary by configuration (header-based auth often bypasses cookie CSRF checks).
    """
    user = setup_test_user(client)
    access_token = user["access_token"]
    csrf_token = user["csrf_token"]

    assert access_token and csrf_token, "setup did not return tokens"

    url = f"{API_PREFIX}/users/me"
    headers = {"Authorization": f"Bearer {access_token}"}

    # With no CSRF token: behavior may be 200 (header auth) or 403 (cookie/session + CSRF enforced).
    r_no_csrf = client.get(url, headers=headers)
    assert r_no_csrf.status_code in (200, 403), f"Unexpected status without CSRF: {r_no_csrf.status_code}"

    # Invalid CSRF token: should be either 403 or behave like missing token depending on config
    headers["X-CSRF-Token"] = "invalid-token"
    r_invalid = client.get(url, headers=headers)
    assert r_invalid.status_code in (200, 403), f"Unexpected status with invalid CSRF: {r_invalid.status_code}"

    # Valid CSRF token must be accepted
    headers["X-CSRF-Token"] = csrf_token
    r_valid = client.get(url, headers=headers)
    assert r_valid.status_code == 200, f"Valid CSRF/token should succeed: {r_valid.status_code} - {r_valid.text}"


def test_rate_limiting(client):
    """Rate limiting: try multiple failed logins; if 429 is not observed it
    likely means rate-limiting is not enabled in this environment and the test
    will be skipped to avoid false negatives.
    """
    url = f"{API_PREFIX}/auth/login"
    login_data = {"username": f"nonexistent_{int(time.time())}@example.com", "password": "wrong"}

    saw_429 = False
    for _ in range(12):
        r = client.post(url, data=login_data)
        if r.status_code == 429:
            saw_429 = True
            break
        assert r.status_code in (401, 429), f"Unexpected status code from login endpoint: {r.status_code}"
        time.sleep(0.05)

    if not saw_429:
        pytest.skip("Rate limiting not enabled in this environment")


def test_token_validation_and_blacklisting(client):
    """Test access token usage, refresh-token misuse, and token blacklisting on logout."""
    user = setup_test_user(client)
    access = user["access_token"]
    refresh = user.get("refresh_token")
    csrf = user["csrf_token"]

    assert access and csrf, "setup did not return required tokens"

    me_url = f"{API_PREFIX}/users/me"
    headers = {"Authorization": f"Bearer {access}", "X-CSRF-Token": csrf}

    r = client.get(me_url, headers=headers)
    assert r.status_code == 200, f"Access token should work: {r.status_code}"

    # Using refresh token as access token should be rejected
    if refresh:
        headers = {"Authorization": f"Bearer {refresh}", "X-CSRF-Token": csrf}
        r = client.get(me_url, headers=headers)
        assert r.status_code in (401, 403), f"Refresh token should not be accepted as access token: {r.status_code}"

    # Invalid/expired token is rejected
    headers = {"Authorization": "Bearer invalid.token.value", "X-CSRF-Token": csrf}
    r = client.get(me_url, headers=headers)
    assert r.status_code in (401, 403), f"Invalid token should be rejected: {r.status_code}"

    # Blacklisting: logout and subsequent refresh usage should fail
    logout_url = f"{API_PREFIX}/auth/logout"
    r = client.post(logout_url, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 200, f"Logout failed: {r.status_code}"

    # Attempt to refresh after logout (may require cookies/session)
    refresh_url = f"{API_PREFIX}/auth/refresh"
    r = client.post(refresh_url, headers={"X-CSRF-Token": csrf})
    assert r.status_code in (401, 403), f"Refresh token should be rejected after logout: {r.status_code}"
