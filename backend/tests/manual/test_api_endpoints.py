"""
Test script for API endpoints
"""
import requests
"""
Manual API endpoint smoke tests.

These tests exercise a running instance of the API at http://localhost:8000
and are intentionally marked as `manual` because they require external
services (database, Redis, mail) and a running server. They are excluded
from default test runs via the `manual` pytest marker.
"""

import requests
import pytest

BASE_URL = "http://localhost:8000"

import os

# By default these are manual integration tests that require a running
# API server at http://localhost:8000. Skip them in automated runs unless
# the caller explicitly opts in by setting RUN_MANUAL_TESTS=1 in the env.
if os.environ.get("RUN_MANUAL_TESTS") != "1":
    pytest.skip("Skipping manual integration tests (set RUN_MANUAL_TESTS=1 to enable)", allow_module_level=True)

# Mark the whole module as manual so individual tests don't need per-test decorators
pytestmark = pytest.mark.manual

import time

def print_response(resp):
    try:
        print(f"STATUS: {resp.status_code}")
        print(resp.text)
    except Exception:
        print("(unable to print response)")
def make_request(method, url, **kwargs):
    max_retries = 5
    retry_delay = 2

    for i in range(max_retries):
        try:
            return method(url, **kwargs)
        except requests.exceptions.RequestException:
            if i < max_retries - 1:
                print(f"Connection failed, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print(f"Failed to connect to {url} after {max_retries} attempts")
                raise

def test_root_endpoint():
    """Test the root endpoint"""
    print("\nTesting root endpoint...")
    response = make_request(requests.get, "http://localhost:8000/")
    print_response(response)

def test_health_check():
    """Test the health check endpoint"""
    print("\nTesting health check endpoint...")
    response = make_request(requests.get, f"{BASE_URL}/health")
    print_response(response)

def get_auth_token():
    """Get auth token for test user"""
    # This assumes you have a test user with these credentials
    auth_data = {
        "username": "test@example.com", 
        "password": "password123"
    }
    response = make_request(requests.post, f"{BASE_URL}/auth/login", data=auth_data)
    if response.status_code != 200:
        print("Failed to get auth token!")
        print_response(response)
        return None
    return response.json().get("access_token")

def test_user_endpoints():
    """Test user endpoints with authentication"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get current user
    print("\nTesting get current user endpoint...")
    response = make_request(requests.get, f"{BASE_URL}/users/me", headers=headers)
    print_response(response)

def create_test_pickup(token):
    """Create a test pickup request"""
    if not token:
        return None
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Sample pickup request data
    pickup_data = {
        "materials": ["plastic", "glass", "paper"],
        "weight_estimate": 5.5,
        "scheduled_date": "2025-10-01T14:00:00Z",
        "address": "123 Test Street, Test City",
        "time_slot": "13:00-16:00",
        "is_recurring": False
    }
    
    print("\nCreating test pickup request...")
    response = make_request(
        requests.post, 
        f"{BASE_URL}/pickups/", 
        headers=headers,
        json=pickup_data
    )
    print_response(response)
    
    if response.status_code == 200 or response.status_code == 201:
        return response.json()
    return None

def test_pickup_endpoints():
    """Test pickup endpoints with authentication"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get user pickups
    print("\nTesting get user pickups endpoint...")
    response = make_request(requests.get, f"{BASE_URL}/pickups/", headers=headers)
    print_response(response)
    
    # Create a test pickup if none exists
    pickups = response.json() if response.status_code == 200 else []
    if not pickups:
        test_pickup = create_test_pickup(token)
        if test_pickup:
            pickups = [test_pickup]
    
    # Test get pickup by ID if there are pickups
    if pickups:
        pickup_id = pickups[0]["id"]
        print(f"\nTesting get pickup by ID endpoint for ID {pickup_id}...")
        response = make_request(requests.get, f"{BASE_URL}/pickups/{pickup_id}", headers=headers)
        print_response(response)

if __name__ == "__main__":
    print("Starting API endpoint tests...")
    test_root_endpoint()
    test_health_check()
    test_user_endpoints()
    test_pickup_endpoints()
    print("Finished API endpoint tests.")