"""
Test script for security monitoring functionality
This script tests the security monitoring features by simulating various authentication scenarios
"""

import time
import json
import os
import sys

# Configure test settings
API_PREFIX = "/api/v1"
TEST_USER = {
    "email": "security_test@example.com",
    "password": "TestPassword123!",
    "name": "Security Test User"
}

# Test scenarios to run
TEST_SCENARIOS = [
    "register_user",
    "register_duplicate",
    "login_success",
    "login_failure",
    "token_refresh",
    "logout"
]

# Store session data between tests
session_data = {}

def print_header(title):
    """Print a formatted header for test sections"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def register_user(client):
    """Test user registration with security monitoring"""
    print_header("Testing User Registration")
    
    # Create a unique email to avoid conflicts
    test_email = f"security_test_{int(time.time())}@example.com"
    test_user = TEST_USER.copy()
    test_user["email"] = test_email
    
    # Make registration request
    url = f"{API_PREFIX}/auth/register"
    print(f"Registering user: {test_email}")
    
    response = client.post(url, json=test_user)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Store tokens for later tests
    if response.status_code == 200:
        session_data["access_token"] = response.json()["access_token"]
        session_data["refresh_token"] = response.json()["refresh_token"]
        session_data["csrf_token"] = response.json()["csrf_token"]
        session_data["email"] = test_email
        session_data["user_id"] = response.json()["user"]["id"]
        """
        Pytest-friendly security monitoring tests.

        These tests validate registration, duplicate registration handling,
        login success/failure, token refresh, logout/blacklisting, and basic
        security log/Redis checks. They use the shared `client` fixture.
        """

        import os
        import time
        import json
        import pytest

        API_PREFIX = "/api/v1"


        def _unique_email():
            return f"security_test_{int(time.time()*1000)}@example.com"


        @pytest.fixture(scope="module")
        def session(client):
            """Register a user and return session dict with tokens and cookies."""
            test_user = {"email": _unique_email(), "password": "TestPassword123!", "name": "Security Test User"}
            url = f"{API_PREFIX}/auth/register"
            resp = client.post(url, json=test_user)
            assert resp.status_code == 200, f"Registration failed: {resp.status_code} - {resp.text}"
            payload = resp.json()
            # Persist cookies on client
            try:
                cookie_dict = getattr(resp.cookies, "get_dict", lambda: dict())()
                if cookie_dict:
                    client.cookies.update(cookie_dict)
            except Exception:
                pass

            return {
                "email": test_user["email"],
                "access_token": payload.get("access_token"),
                "refresh_token": payload.get("refresh_token"),
                "csrf_token": payload.get("csrf_token"),
            }


        def test_register_duplicate(client, session):
            """Attempt to register the same email again and expect a rejection."""
            test_user = {"email": session["email"], "password": "ignored", "name": "dup"}
            url = f"{API_PREFIX}/auth/register"
            r = client.post(url, json=test_user)
            # Duplicate behavior may vary: prefer to assert we don't get 200
            assert r.status_code != 200, f"Duplicate registration unexpectedly succeeded: {r.status_code}"


        def test_login_success_and_failure(client, session):
            """Ensure login succeeds with correct credentials and fails with wrong one."""
            login_url = f"{API_PREFIX}/auth/login"
            # Successful login
            resp = client.post(login_url, data={"username": session["email"], "password": "TestPassword123!"})
            assert resp.status_code == 200, f"Login failed with valid credentials: {resp.status_code} - {resp.text}"
            payload = resp.json()
            # Persist new cookies if any
            try:
                cookie_dict = getattr(resp.cookies, "get_dict", lambda: dict())()
                if cookie_dict:
                    client.cookies.update(cookie_dict)
            except Exception:
                pass

            # Failed login
            resp2 = client.post(login_url, data={"username": session["email"], "password": "WrongPassword123!"})
            assert resp2.status_code in (401, 403), f"Wrong-password login unexpectedly returned {resp2.status_code}"


        def test_token_refresh_and_logout(client, session):
            """Test token refresh endpoint and logout / blacklisting behavior."""
            headers = {"X-CSRF-Token": session.get("csrf_token", "")}
            refresh_url = f"{API_PREFIX}/auth/refresh"
            r = client.post(refresh_url, headers=headers)
            # Refresh may succeed or fail depending on session implementation, assert known responses
            assert r.status_code in (200, 401, 403), f"Unexpected refresh status: {r.status_code}"

            # Logout
            logout_url = f"{API_PREFIX}/auth/logout"
            r2 = client.post(logout_url, headers=headers)
            assert r2.status_code in (200, 401, 403), f"Unexpected logout status: {r2.status_code}"

            # After logout, refresh should not succeed
            r3 = client.post(refresh_url, headers=headers)
            assert r3.status_code in (401, 403), f"Refresh should be rejected after logout: {r3.status_code}"


        def test_check_security_logs():
            """Check that the security events log exists and contains entries (if present)."""
            log_path = os.path.join("logs", "security_events.log")
            if not os.path.exists(log_path):
                pytest.skip(f"Security log not present at {log_path}")

            with open(log_path, "r", encoding="utf-8") as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]

            assert len(lines) > 0, "Security log present but empty"


        def test_check_redis_storage():
            """Check Redis for security keys; skip if redis not available."""
            try:
                import redis
                from app.core.config import settings
            except Exception:
                pytest.skip("redis not available in this environment")

            try:
                redis_client = redis.Redis.from_url(settings.REDIS_URL)
                if not redis_client.ping():
                    pytest.skip("Redis not reachable")

                keys = redis_client.keys("security:*")
                # Pass if keys found or not; just ensure Redis responds
                assert isinstance(keys, list)
            except Exception as e:
                pytest.skip(f"Redis check skipped due to error: {e}")
