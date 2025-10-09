"""
Test script for API endpoints
"""
import requests
import json
import time
from pprint import pprint
from requests.exceptions import ConnectionError

BASE_URL = "http://localhost:8000/api/v1"

# Helper function to print responses
def print_response(response):
    print(f"Status code: {response.status_code}")
    print("Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
    print("Response:")
    try:
        pprint(response.json())
    except:
        print(response.text)
    print("-" * 80)
    
# Helper function to retry requests
def make_request(method, url, **kwargs):
    max_retries = 5
    retry_delay = 2
    
    for i in range(max_retries):
        try:
            return method(url, **kwargs)
        except ConnectionError:
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