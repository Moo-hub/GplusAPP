import pytest

def test_user_creation_edge_cases(client):
    """Test user creation with edge cases"""
    # Test with very long email
    response = client.post(
        "/users/",
        json={"email": "a" * 100 + "@example.com", "password": "testpass"}
    )
    assert response.status_code == 200

def test_user_creation_special_characters(client):
    """Test user creation with special characters in email"""
    response = client.post(
        "/users/",
        json={"email": "test+tag@example.com", "password": "testpass"}
    )
    assert response.status_code == 200

def test_pagination_edge_cases(client):
    """Test pagination with edge cases"""
    # Create some users
    for i in range(3):
        client.post("/users/", json={"email": f"user{i}@example.com", "password": "pass"})
    
    # Test skip beyond available records
    response = client.get("/users/?skip=10")
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_pagination_zero_limit(client):
    """Test pagination with zero limit"""
    client.post("/users/", json={"email": "test@example.com", "password": "pass"})
    response = client.get("/users/?limit=0")
    assert response.status_code == 200

def test_user_list_empty_database(client):
    """Test getting users from empty database"""
    response = client.get("/users/")
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_multiple_token_requests(client):
    """Test multiple token requests for same user"""
    client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    
    response1 = client.post("/token", data={"username": "test@example.com", "password": "testpass123"})
    response2 = client.post("/token", data={"username": "test@example.com", "password": "testpass123"})
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    # Tokens should be different (different timestamps)
    assert response1.json()["access_token"] != response2.json()["access_token"]

def test_concurrent_user_access(client):
    """Test concurrent access to user endpoints"""
    # Create user
    client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    
    # Get token
    token_response = client.post("/token", data={"username": "test@example.com", "password": "testpass123"})
    token = token_response.json()["access_token"]
    
    # Multiple concurrent requests
    responses = []
    for _ in range(3):
        response = client.get("/users/me/", headers={"Authorization": f"Bearer {token}"})
        responses.append(response)
    
    assert all(r.status_code == 200 for r in responses)

def test_user_with_uppercase_email(client):
    """Test user creation with uppercase email"""
    response = client.post(
        "/users/",
        json={"email": "TEST@EXAMPLE.COM", "password": "testpass"}
    )
    assert response.status_code == 200

def test_token_with_missing_fields(client):
    """Test token endpoint with missing fields"""
    response = client.post("/token", data={"username": "test@example.com"})
    assert response.status_code == 422  # Validation error

def test_api_version_in_root_response(client):
    """Test that API version is returned in root response"""
    response = client.get("/")
    assert response.status_code == 200
    assert "version" in response.json()
    assert response.json()["version"] == "1.0.0"
