import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token, create_refresh_token, generate_csrf_token

client = TestClient(app)

def test_login_endpoint():
    """Test the login endpoint with valid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    
    # Check response status and structure
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "csrf_token" in data
    assert "user" in data
    
    # Check cookies are set
    cookies = response.cookies
    assert "refresh_token" in cookies
    assert "csrf_token" in cookies

def test_refresh_token_endpoint():
    """Test the refresh token endpoint"""
    # First login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    
    # Get the cookies from login response
    cookies = login_response.cookies
    csrf_token = login_response.json()["csrf_token"]
    
    # Call refresh endpoint with the cookies
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": csrf_token},
        cookies=cookies
    )
    
    # Check response status and structure
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data
    assert "csrf_token" in data
    assert "user" in data
    
    # Check new cookies are set
    new_cookies = refresh_response.cookies
    assert "refresh_token" in new_cookies
    assert "csrf_token" in new_cookies
    
def test_logout_endpoint():
    """Test the logout endpoint"""
    # First login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    
    # Get the cookies from login response
    cookies = login_response.cookies
    csrf_token = login_response.json()["csrf_token"]
    
    # Call logout endpoint with the cookies
    logout_response = client.post(
        "/api/v1/auth/logout",
        headers={"X-CSRF-Token": csrf_token},
        cookies=cookies
    )
    
    # Check response status
    assert logout_response.status_code == 200
    assert logout_response.json()["code"] == "LOGOUT_SUCCESS"
    
    # Check cookies are cleared
    assert "refresh_token" not in logout_response.cookies
    assert "csrf_token" not in logout_response.cookies
    
def test_protected_endpoint_with_csrf():
    """Test a protected endpoint that requires CSRF protection"""
    # First login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    
    # Get tokens and cookies
    access_token = login_response.json()["access_token"]
    csrf_token = login_response.json()["csrf_token"]
    cookies = login_response.cookies
    
    # Call a protected endpoint that requires CSRF
    profile_response = client.put(
        "/api/v1/profile/",
        json={"name": "Updated Name", "address": "123 New St"},
        headers={
            "Authorization": f"Bearer {access_token}",
            "X-CSRF-Token": csrf_token
        },
        cookies=cookies
    )
    
    # Check response status
    assert profile_response.status_code == 200
    data = profile_response.json()
    assert data["name"] == "Updated Name"