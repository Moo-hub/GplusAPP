"""
Test script for security monitoring functionality
This script tests the security monitoring features by simulating various authentication scenarios
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

def register_user():
    """Test user registration with security monitoring"""
    print_header("Testing User Registration")
    
    # Create a unique email to avoid conflicts
    test_email = f"security_test_{int(time.time())}@example.com"
    test_user = TEST_USER.copy()
    test_user["email"] = test_email
    
    # Make registration request
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/register")
    print(f"Registering user: {test_email}")
    
    response = requests.post(url, json=test_user)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Store tokens for later tests
    if response.status_code == 200:
        session_data["access_token"] = response.json()["access_token"]
        session_data["refresh_token"] = response.json()["refresh_token"]
        session_data["csrf_token"] = response.json()["csrf_token"]
        session_data["email"] = test_email
        session_data["user_id"] = response.json()["user"]["id"]
        
        # Store cookies
        session_data["cookies"] = response.cookies
        
        print("✅ Registration successful, tokens stored for further tests")
    else:
        print("❌ Registration failed")
    
    return response.status_code == 200

def register_duplicate():
    """Test duplicate registration attempt (should trigger security event)"""
    print_header("Testing Duplicate Registration")
    
    if "email" not in session_data:
        print("❌ Cannot test duplicate registration: no previous registration")
        return False
    
    # Use the same email from previous registration
    test_user = TEST_USER.copy()
    test_user["email"] = session_data["email"]
    
    # Make duplicate registration request
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/register")
    print(f"Attempting duplicate registration with: {test_user['email']}")
    
    response = requests.post(url, json=test_user)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("✅ Duplicate registration correctly rejected")
    else:
        print("❌ Duplicate registration unexpectedly succeeded")
    
    return response.status_code == 400

def login_success():
    """Test successful login with security monitoring"""
    print_header("Testing Successful Login")
    
    if "email" not in session_data:
        print("❌ Cannot test login: no user registered")
        return False
    
    # Make login request
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/login")
    login_data = {
        "username": session_data["email"],  # FastAPI OAuth form uses username field
        "password": TEST_USER["password"]
    }
    
    print(f"Logging in with: {session_data['email']}")
    
    response = requests.post(url, data=login_data)  # Use data instead of json for form data
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"User ID: {response.json()['user']['id']}")
        
        # Update tokens
        session_data["access_token"] = response.json()["access_token"]
        session_data["refresh_token"] = response.json()["refresh_token"]
        session_data["csrf_token"] = response.json()["csrf_token"]
        
        # Store cookies
        session_data["cookies"] = response.cookies
        
        print("✅ Login successful, tokens updated")
    else:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("❌ Login failed")
    
    return response.status_code == 200

def login_failure():
    """Test failed login with security monitoring"""
    print_header("Testing Failed Login")
    
    # Make login request with wrong password
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/login")
    login_data = {
        "username": session_data.get("email", TEST_USER["email"]),
        "password": "WrongPassword123!"
    }
    
    print(f"Attempting login with wrong password for: {login_data['username']}")
    
    response = requests.post(url, data=login_data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("✅ Login with wrong password correctly rejected")
    else:
        print("❌ Login with wrong password unexpectedly succeeded")
    
    # Try multiple failed logins to trigger rate limit/suspicious activity detection
    print("\nAttempting multiple failed logins to trigger security monitoring...")
    for i in range(4):  # 5 total attempts including the one above
        response = requests.post(url, data=login_data)
        print(f"Attempt {i+2}: Status Code {response.status_code}")
        time.sleep(0.5)  # Small delay between requests
    
    return response.status_code != 200

def token_refresh():
    """Test token refresh with security monitoring"""
    print_header("Testing Token Refresh")
    
    if "refresh_token" not in session_data:
        print("❌ Cannot test token refresh: no refresh token available")
        return False
    
    # Make refresh token request
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/refresh")
    headers = {
        "X-CSRF-Token": session_data.get("csrf_token", ""),
    }
    
    print("Attempting to refresh token")
    
    # Use cookies from the session for the refresh token
    response = requests.post(
        url, 
        headers=headers, 
        cookies=session_data.get("cookies", {})
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # Update tokens
        session_data["access_token"] = response.json()["access_token"]
        session_data["csrf_token"] = response.json()["csrf_token"]
        
        # Store cookies (for the new refresh token)
        session_data["cookies"] = response.cookies
        
        print("✅ Token refresh successful, tokens updated")
    else:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("❌ Token refresh failed")
    
    return response.status_code == 200

def logout():
    """Test logout with security monitoring"""
    print_header("Testing Logout")
    
    if "csrf_token" not in session_data or "cookies" not in session_data:
        print("❌ Cannot test logout: no session data available")
        return False
    
    # Make logout request
    url = urljoin(BASE_URL, f"{API_PREFIX}/auth/logout")
    headers = {
        "X-CSRF-Token": session_data["csrf_token"],
    }
    
    print("Attempting to logout")
    
    response = requests.post(
        url, 
        headers=headers, 
        cookies=session_data["cookies"]
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Logout successful")
        
        # Try to use the refresh token again (should fail)
        print("\nAttempting to use blacklisted refresh token...")
        refresh_response = requests.post(
            urljoin(BASE_URL, f"{API_PREFIX}/auth/refresh"),
            headers=headers,
            cookies=session_data["cookies"]
        )
        
        print(f"Status Code: {refresh_response.status_code}")
        if refresh_response.status_code != 200:
            print("✅ Refresh token correctly blacklisted")
        else:
            print("❌ Refresh token was not properly blacklisted")
        
    else:
        print("❌ Logout failed")
    
    return response.status_code == 200

def check_security_logs():
    """Check if security logs were created"""
    print_header("Checking Security Logs")
    
    log_path = os.path.join("logs", "security_events.log")
    if not os.path.exists(log_path):
        print(f"❌ Security log file not found at: {log_path}")
        return False
    
    # Read the last few lines of the log file
    with open(log_path, "r") as f:
        lines = f.readlines()
        last_lines = lines[-20:]  # Show last 20 log entries
    
    print(f"Found security log file: {log_path}")
    print("Last log entries:")
    for line in last_lines:
        print(f"  {line.strip()}")
    
    print("\n✅ Security logging is working")
    return True

def check_redis_storage():
    """Check if security events are being stored in Redis"""
    print_header("Checking Redis Storage")
    
    # This requires redis-py to be installed
    try:
        import redis
        from app.core.config import settings
    except ImportError:
        print("❌ Could not import Redis or app settings. Make sure redis-py is installed.")
        return False
    
    try:
        # Connect to Redis
        redis_client = redis.Redis.from_url(settings.REDIS_URL)
        
        # Check if connection works
        if not redis_client.ping():
            print("❌ Redis connection failed")
            return False
        
        print("✅ Connected to Redis successfully")
        
        # Check for security-related keys
        security_keys = redis_client.keys("security:*")
        print(f"\nFound {len(security_keys)} security-related keys in Redis")
        
        if security_keys:
            # Show some sample keys
            print("\nSample security keys:")
            for key in security_keys[:5]:  # Show up to 5 keys
                key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                print(f"  {key_str}")
            
            # Check for TTLs (expiration)
            print("\nChecking TTLs for security keys:")
            for key in security_keys[:3]:  # Check a few keys
                key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                ttl = redis_client.ttl(key)
                if ttl > 0:
                    print(f"  {key_str}: TTL = {ttl} seconds (✅ Has expiration)")
                else:
                    print(f"  {key_str}: TTL = {ttl} (❌ No expiration or permanent)")
            
            return True
        else:
            print("❌ No security-related keys found in Redis")
            return False
            
    except Exception as e:
        print(f"❌ Error accessing Redis: {e}")
        return False

def main():
    """Run the test suite"""
    print_header("Security Monitoring Test Suite")
    
    results = {}
    
    # Run selected test scenarios
    for scenario in TEST_SCENARIOS:
        if scenario in globals() and callable(globals()[scenario]):
            test_func = globals()[scenario]
            results[scenario] = test_func()
        else:
            print(f"❌ Test scenario '{scenario}' not found")
    
    # Check logs and Redis
    check_security_logs()
    check_redis_storage()
    
    # Print summary
    print_header("Test Summary")
    for scenario, result in results.items():
        status = "✅ Passed" if result else "❌ Failed"
        print(f"{status} - {scenario}")

if __name__ == "__main__":
    main()