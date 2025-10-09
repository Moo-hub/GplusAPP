"""
Test script for role-based access control and protected routes
This script tests role-based security and protected routes access
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
ADMIN_USER = {
    "email": "admin_test@example.com",
    "password": "AdminPassword123!",
    "name": "Admin Test User",
    "role": "admin"  # Note: The API may ignore this and require separate admin creation
}
REGULAR_USER = {
    "email": "regular_test@example.com",
    "password": "UserPassword123!",
    "name": "Regular Test User"
}

# Test scenarios to run
TEST_SCENARIOS = [
    "test_admin_protected_routes",
    "test_user_protected_routes",
    "test_guest_access_limits"
]

# Store session data between tests
admin_session = {}
user_session = {}

def print_header(title):
    """Print a formatted header for test sections"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def setup_users():
    """Register and login as both admin and regular user"""
    print_header("Setting up test users")
    
    # Create unique emails
    timestamp = int(time.time())
    admin_email = f"admin_test_{timestamp}@example.com"
    user_email = f"user_test_{timestamp}@example.com"
    
    # Register admin user (may require special handling)
    admin = ADMIN_USER.copy()
    admin["email"] = admin_email
    
    print(f"Registering admin user: {admin_email}")
    register_url = urljoin(BASE_URL, f"{API_PREFIX}/auth/register")
    admin_response = requests.post(register_url, json=admin)
    
    if admin_response.status_code == 200:
        admin_session["email"] = admin_email
        admin_session["access_token"] = admin_response.json()["access_token"]
        admin_session["refresh_token"] = admin_response.json()["refresh_token"]
        admin_session["csrf_token"] = admin_response.json()["csrf_token"]
        admin_session["cookies"] = admin_response.cookies
        admin_session["user_id"] = admin_response.json()["user"]["id"]
        print("✅ Admin user registered")
        
        # NOTE: The API might not allow setting role during registration
        # You may need to update the user's role through a separate admin API
        # or have pre-created admin user for testing
    else:
        print(f"❌ Failed to register admin user: {admin_response.status_code}")
        print(f"Response: {json.dumps(admin_response.json(), indent=2)}")
    
    # Register regular user
    user = REGULAR_USER.copy()
    user["email"] = user_email
    
    print(f"\nRegistering regular user: {user_email}")
    user_response = requests.post(register_url, json=user)
    
    if user_response.status_code == 200:
        user_session["email"] = user_email
        user_session["access_token"] = user_response.json()["access_token"]
        user_session["refresh_token"] = user_response.json()["refresh_token"]
        user_session["csrf_token"] = user_response.json()["csrf_token"]
        user_session["cookies"] = user_response.cookies
        user_session["user_id"] = user_response.json()["user"]["id"]
        print("✅ Regular user registered")
    else:
        print(f"❌ Failed to register regular user: {user_response.status_code}")
        print(f"Response: {json.dumps(user_response.json(), indent=2)}")
    
    return (admin_response.status_code == 200 and 
            user_response.status_code == 200)

def test_admin_protected_routes():
    """Test access to admin-only protected routes"""
    print_header("Testing Admin Protected Routes")
    
    # Setup users if needed
    if not admin_session or not user_session:
        if not setup_users():
            print("❌ Cannot test admin routes: setup failed")
            return False
    
    # List of admin-only endpoints to test
    admin_endpoints = [
        # Add actual admin endpoints from your API
        f"{API_PREFIX}/admin/users",
        f"{API_PREFIX}/admin/metrics",
        f"{API_PREFIX}/admin/settings"
    ]
    
    all_passed = True
    
    # Test 1: Admin accessing admin routes (should succeed)
    print("Test 1: Admin accessing admin routes")
    for endpoint in admin_endpoints:
        url = urljoin(BASE_URL, endpoint)
        headers = {
            "Authorization": f"Bearer {admin_session['access_token']}",
            "X-CSRF-Token": admin_session["csrf_token"]
        }
        
        print(f"\nTrying to access {endpoint} as admin")
        response = requests.get(url, headers=headers, cookies=admin_session["cookies"])
        
        # Some endpoints might return 404 if they don't exist in test environment
        # We're mainly checking for 403/401 which would indicate permission issues
        if response.status_code == 403 or response.status_code == 401:
            print(f"❌ Admin access denied: {response.status_code}")
            all_passed = False
        else:
            print(f"✅ Admin access allowed (status: {response.status_code})")
    
    # Test 2: Regular user accessing admin routes (should fail)
    print("\nTest 2: Regular user accessing admin routes")
    for endpoint in admin_endpoints:
        url = urljoin(BASE_URL, endpoint)
        headers = {
            "Authorization": f"Bearer {user_session['access_token']}",
            "X-CSRF-Token": user_session["csrf_token"]
        }
        
        print(f"\nTrying to access {endpoint} as regular user")
        response = requests.get(url, headers=headers, cookies=user_session["cookies"])
        
        if response.status_code == 403 or response.status_code == 401:
            print(f"✅ Regular user correctly denied (status: {response.status_code})")
        else:
            print(f"❌ Regular user incorrectly allowed access (status: {response.status_code})")
            all_passed = False
    
    return all_passed

def test_user_protected_routes():
    """Test access to user protected routes"""
    print_header("Testing User Protected Routes")
    
    # Setup users if needed
    if not admin_session or not user_session:
        if not setup_users():
            print("❌ Cannot test user routes: setup failed")
            return False
    
    # List of user endpoints to test
    user_endpoints = [
        # Add actual user endpoints from your API
        f"{API_PREFIX}/users/me",
        f"{API_PREFIX}/pickups",
        f"{API_PREFIX}/vehicles"
    ]
    
    all_passed = True
    
    # Test 1: Regular user accessing user routes (should succeed)
    print("Test 1: Regular user accessing user routes")
    for endpoint in user_endpoints:
        url = urljoin(BASE_URL, endpoint)
        headers = {
            "Authorization": f"Bearer {user_session['access_token']}",
            "X-CSRF-Token": user_session["csrf_token"]
        }
        
        print(f"\nTrying to access {endpoint} as regular user")
        response = requests.get(url, headers=headers, cookies=user_session["cookies"])
        
        # 404 is acceptable if endpoint doesn't exist in test env
        # We're mainly checking for 403/401 which would indicate permission issues
        if response.status_code == 403 or response.status_code == 401:
            print(f"❌ User access denied: {response.status_code}")
            all_passed = False
        else:
            print(f"✅ User access allowed (status: {response.status_code})")
    
    # Test 2: Admin accessing user routes (should succeed - admin can do everything)
    print("\nTest 2: Admin accessing user routes")
    for endpoint in user_endpoints:
        url = urljoin(BASE_URL, endpoint)
        headers = {
            "Authorization": f"Bearer {admin_session['access_token']}",
            "X-CSRF-Token": admin_session["csrf_token"]
        }
        
        print(f"\nTrying to access {endpoint} as admin")
        response = requests.get(url, headers=headers, cookies=admin_session["cookies"])
        
        # Admin should be able to access all routes
        if response.status_code == 403 or response.status_code == 401:
            print(f"❌ Admin access denied: {response.status_code}")
            all_passed = False
        else:
            print(f"✅ Admin access allowed (status: {response.status_code})")
    
    return all_passed

def test_guest_access_limits():
    """Test guest (unauthenticated) access to protected routes"""
    print_header("Testing Guest Access Limits")
    
    # List of endpoints that should require authentication
    protected_endpoints = [
        f"{API_PREFIX}/users/me",
        f"{API_PREFIX}/pickups",
        f"{API_PREFIX}/vehicles",
        f"{API_PREFIX}/admin/users"
    ]
    
    # List of endpoints that should be accessible without authentication
    public_endpoints = [
        f"{API_PREFIX}/companies",  # Assuming company list is public
        f"{API_PREFIX}/auth/login",
        f"{API_PREFIX}/auth/register"
    ]
    
    all_passed = True
    
    # Test 1: Guest accessing protected routes (should fail)
    print("Test 1: Guest accessing protected routes")
    for endpoint in protected_endpoints:
        url = urljoin(BASE_URL, endpoint)
        
        print(f"\nTrying to access {endpoint} as guest")
        response = requests.get(url)
        
        if response.status_code == 401 or response.status_code == 403:
            print(f"✅ Guest correctly denied access (status: {response.status_code})")
        else:
            print(f"❌ Guest incorrectly allowed access (status: {response.status_code})")
            all_passed = False
    
    # Test 2: Guest accessing public routes (should succeed)
    print("\nTest 2: Guest accessing public routes")
    for endpoint in public_endpoints:
        url = urljoin(BASE_URL, endpoint)
        
        print(f"\nTrying to access {endpoint} as guest")
        if endpoint.endswith("/login") or endpoint.endswith("/register"):
            # For auth endpoints, just check OPTIONS or GET
            response = requests.options(url)
        else:
            response = requests.get(url)
        
        if response.status_code == 401 or response.status_code == 403:
            print(f"❌ Guest incorrectly denied access (status: {response.status_code})")
            all_passed = False
        else:
            print(f"✅ Guest access allowed as expected (status: {response.status_code})")
    
    return all_passed

def main():
    """Run the test suite"""
    print_header("Role-Based Security Test Suite")
    
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