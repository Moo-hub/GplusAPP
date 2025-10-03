"""
Test script for authentication security features
This script tests CSRF protection, rate limiting, and token validation
"""

import requests
import time
import json
import os
import sys
from urllib.parse import urljoin

# Configure test settings
BASE_URL = "http://localhost:8000"  # Update if your API runs on a different URL
API_PREFIX = "/api/v1"
TEST_USER = {
    "email": "auth_security_test@example.com",
    "password": "TestPassword123!",
    "name": "Auth Security Test User"
}

# Test scenarios to run
TEST_SCENARIOS = [
    "test_csrf_protection",
    "test_rate_limiting",
    "test_token_validation",
    "test_token_blacklisting"
]

# Store session data between tests
session_data = {}

def print_header(title):
    """Print a formatted header for test sections"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def setup_test_user():
    """Register a test user and login to get valid tokens"""
    print_header("Setting up test user")
    
    # Create a unique email to avoid conflicts
    test_email = f"auth_security_test_{int(time.time())}@example.com"
    test_user = TEST_USER.copy()
    test_user["email"] = test_email
    
    # Register user
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/register")
    print(f"Registering user: {test_email}")
    
    response = requests.post(url, json=test_user)
    
    if response.status_code == 200:
        session_data["access_token"] = response.json()["access_token"]
        session_data["refresh_token"] = response.json()["refresh_token"]
        session_data["csrf_token"] = response.json()["csrf_token"]
        session_data["email"] = test_email
        session_data["user_id"] = response.json()["user"]["id"]
        session_data["cookies"] = response.cookies
        
        print("✅ Test user created successfully")
        return True
    else:
        print(f"❌ Failed to create test user: {response.status_code}")
        return False

def test_csrf_protection():
    """Test CSRF protection on protected endpoints"""
    print_header("Testing CSRF Protection")
    
    if "access_token" not in session_data or "csrf_token" not in session_data:
        if not setup_test_user():
            print("❌ Cannot test CSRF protection: setup failed")
            return False
    
    # Test 1: Call protected endpoint without CSRF token (should fail)
    url = urljoin(BASE_URL, f"{API_PREFIX}/users/me")
    headers = {
        "Authorization": f"Bearer {session_data['access_token']}",
        # No CSRF token included
    }
    
    print("Test 1: Calling protected endpoint without CSRF token")
    response = requests.get(url, headers=headers, cookies=session_data["cookies"])
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 403:
        print("✅ CSRF protection working: request rejected without CSRF token")
        test1_passed = True
    else:
        print("❌ CSRF protection failed: request allowed without CSRF token")
        test1_passed = False
    
    # Test 2: Call protected endpoint with invalid CSRF token (should fail)
    headers = {
        "Authorization": f"Bearer {session_data['access_token']}",
        "X-CSRF-Token": "invalid_token_value"
    }
    
    print("\nTest 2: Calling protected endpoint with invalid CSRF token")
    response = requests.get(url, headers=headers, cookies=session_data["cookies"])
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 403:
        print("✅ CSRF protection working: request rejected with invalid CSRF token")
        test2_passed = True
    else:
        print("❌ CSRF protection failed: request allowed with invalid CSRF token")
        test2_passed = False
    
    # Test 3: Call protected endpoint with valid CSRF token (should succeed)
    headers = {
        "Authorization": f"Bearer {session_data['access_token']}",
        "X-CSRF-Token": session_data["csrf_token"]
    }
    
    print("\nTest 3: Calling protected endpoint with valid CSRF token")
    response = requests.get(url, headers=headers, cookies=session_data["cookies"])
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ CSRF validation working: request allowed with valid CSRF token")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        test3_passed = True
    else:
        print("❌ CSRF validation failed: request rejected despite valid CSRF token")
        test3_passed = False
    
    return test1_passed and test2_passed and test3_passed

def test_rate_limiting():
    """Test rate limiting on authentication endpoints"""
    print_header("Testing Rate Limiting")
    
    # Test login endpoint rate limiting
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/login")
    login_data = {
        "username": f"nonexistent_user_{int(time.time())}@example.com",
        "password": "WrongPassword123!"
    }
    
    print(f"Sending multiple login requests to test rate limiting")
    
    # Track status codes to detect rate limiting
    status_codes = []
    rate_limited = False
    
    for i in range(10):  # Try 10 times, should hit rate limit
        response = requests.post(url, data=login_data)
        status_codes.append(response.status_code)
        print(f"Request {i+1}: Status Code {response.status_code}")
        
        if response.status_code == 429:
            rate_limited = True
            print(f"✅ Rate limiting detected after {i+1} requests")
            break
            
        time.sleep(0.2)  # Small delay between requests
    
    if not rate_limited:
        print("❌ Rate limiting not detected after multiple requests")
    
    # Allow time for rate limit to reset
    print("\nWaiting 5 seconds for rate limit to reset...")
    time.sleep(5)
    
    return rate_limited

def test_token_validation():
    """Test token validation and type verification"""
    print_header("Testing Token Validation")
    
    if "access_token" not in session_data:
        if not setup_test_user():
            print("❌ Cannot test token validation: setup failed")
            return False
    
    # Test 1: Use access token on protected endpoint (should succeed)
    url = urljoin(BASE_URL, f"{API_PREFIX}/users/me")
    headers = {
        "Authorization": f"Bearer {session_data['access_token']}",
        "X-CSRF-Token": session_data["csrf_token"]
    }
    
    print("Test 1: Using access token on protected endpoint")
    response = requests.get(url, headers=headers, cookies=session_data["cookies"])
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Access token validation working")
        test1_passed = True
    else:
        print("❌ Access token validation failed")
        test1_passed = False
    
    # Test 2: Try to use refresh token as access token (should fail)
    if "refresh_token" in session_data:
        headers = {
            "Authorization": f"Bearer {session_data['refresh_token']}",
            "X-CSRF-Token": session_data["csrf_token"]
        }
        
        print("\nTest 2: Trying to use refresh token as access token")
        response = requests.get(url, headers=headers, cookies=session_data["cookies"])
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 401:
            print("✅ Token type verification working: refresh token rejected as access token")
            test2_passed = True
        else:
            print("❌ Token type verification failed: refresh token accepted as access token")
            test2_passed = False
    else:
        print("\nTest 2: Skipped (no refresh token available)")
        test2_passed = True
    
    # Test 3: Try to use expired/invalid token
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        "X-CSRF-Token": session_data["csrf_token"]
    }
    
    print("\nTest 3: Using invalid/expired token")
    response = requests.get(url, headers=headers, cookies=session_data["cookies"])
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 401:
        print("✅ Invalid token correctly rejected")
        test3_passed = True
    else:
        print("❌ Invalid token validation failed")
        test3_passed = False
    
    return test1_passed and test2_passed and test3_passed

def test_token_blacklisting():
    """Test token blacklisting after logout"""
    print_header("Testing Token Blacklisting")
    
    if "access_token" not in session_data or "csrf_token" not in session_data:
        if not setup_test_user():
            print("❌ Cannot test token blacklisting: setup failed")
            return False
    
    # First, make a successful request to verify token works
    url = urljoin(BASE_URL, f"{API_PREFIX}/users/me")
    headers = {
        "Authorization": f"Bearer {session_data['access_token']}",
        "X-CSRF-Token": session_data["csrf_token"]
    }
    
    print("Verifying token works before logout")
    response = requests.get(url, headers=headers, cookies=session_data["cookies"])
    
    if response.status_code != 200:
        print(f"❌ Token not working before logout: {response.status_code}")
        return False
    
    print("✅ Token working before logout")
    
    # Now logout to blacklist the token
    logout_url = urljoin(BASE_URL, f"{API_PREFIX}/auth/logout")
    logout_headers = {
        "X-CSRF-Token": session_data["csrf_token"]
    }
    
    print("\nLogging out to blacklist tokens")
    logout_response = requests.post(
        logout_url, 
        headers=logout_headers, 
        cookies=session_data["cookies"]
    )
    
    if logout_response.status_code != 200:
        print(f"❌ Logout failed: {logout_response.status_code}")
        return False
    
    print("✅ Logout successful")
    
    # Try to use the refresh token again (should fail due to blacklisting)
    refresh_url = urljoin(BASE_URL, f"{API_PREFIX}/auth/refresh")
    refresh_headers = {
        "X-CSRF-Token": session_data["csrf_token"]
    }
    
    print("\nTrying to use blacklisted refresh token")
    refresh_response = requests.post(
        refresh_url,
        headers=refresh_headers,
        cookies=session_data["cookies"]
    )
    
    print(f"Status Code: {refresh_response.status_code}")
    if refresh_response.status_code == 401:
        print("✅ Token blacklisting working: refresh token rejected after logout")
        return True
    else:
        print("❌ Token blacklisting failed: refresh token still working after logout")
        return False

def main():
    """Run the test suite"""
    print_header("Authentication Security Test Suite")
    
    results = {}
    
    # Run selected test scenarios
    for scenario in TEST_SCENARIOS:
        if scenario in globals() and callable(globals()[scenario]):
            test_func = globals()[scenario]
            results[scenario] = test_func()
        else:
            print(f"❌ Test scenario '{scenario}' not found")
    
    # Print summary
    print_header("Test Summary")
    for scenario, result in results.items():
        status = "✅ Passed" if result else "❌ Failed"
        print(f"{status} - {scenario}")

if __name__ == "__main__":
    main()