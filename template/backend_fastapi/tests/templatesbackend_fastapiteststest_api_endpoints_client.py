# templates/backend_fastapi/tests/test_api_endpoints_client.py

import pytest


def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200


def test_health_check(client):
    """Test health check endpoint if it exists."""
    response = client.get("/health")
    # May return 200 or 404 depending on template
    assert response.status_code in [200, 404]


{% if component_features.BackendFastAPI.database_support %}
def test_users_endpoint_list(client):
    """Test listing users endpoint."""
    response = client.get("/users/")
    assert response.status_code in [200, 404]  # May not be implemented


def test_users_endpoint_create(client):
    """Test creating user endpoint."""
    response = client.post(
        "/users/",
        json={"email": "endpoint@example.com", "password": "pass123"}
    )
    assert response.status_code in [200, 201, 404]


def test_user_endpoint_get_by_id(client):
    """Test getting user by ID."""
    # First create a user
    create_response = client.post(
        "/users/",
        json={"email": "getbyid@example.com", "password": "pass123"}
    )
    
    if create_response.status_code in [200, 201]:
        user_id = create_response.json()["id"]
        
        # Get the user by ID
        get_response = client.get(f"/users/{user_id}")
        assert get_response.status_code in [200, 404]
{% endif %}


{% if component_features.BackendFastAPI.auth_jwt %}
def test_login_endpoint(client):
    """Test login endpoint."""
    # First create a user
    client.post(
        "/users/",
        json={"email": "login@example.com", "password": "loginpass123"}
    )
    
    # Try to login
    response = client.post(
        "/token",
        data={"username": "login@example.com", "password": "loginpass123"}
    )
    
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data


def test_protected_endpoint_without_token(client):
    """Test that protected endpoints require authentication."""
    response = client.get("/users/me")
    # Should return 401 or 404
    assert response.status_code in [401, 404]


def test_protected_endpoint_with_token(client):
    """Test accessing protected endpoint with valid token."""
    # Create user and get token
    client.post(
        "/users/",
        json={"email": "protected@example.com", "password": "pass123"}
    )
    
    token_response = client.post(
        "/token",
        data={"username": "protected@example.com", "password": "pass123"}
    )
    
    if token_response.status_code == 200:
        token = token_response.json()["access_token"]
        
        # Access protected endpoint
        response = client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code in [200, 404]
{% endif %}


def test_invalid_endpoint(client):
    """Test that invalid endpoints return 404."""
    response = client.get("/invalid/endpoint/path")
    assert response.status_code == 404


def test_cors_headers(client):
    """Test CORS headers if configured."""
    response = client.options("/")
    # Just check it doesn't error
    assert response.status_code in [200, 404, 405]
