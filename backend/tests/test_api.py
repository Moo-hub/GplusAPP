import pytest
from src import models

def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "version" in response.json()

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_user(client):
    """Test creating a new user"""
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["is_active"] == True
    assert data["is_superuser"] == False

def test_create_duplicate_user(client):
    """Test creating a duplicate user fails"""
    client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    response = client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_read_users(client):
    """Test reading users list"""
    client.post("/users/", json={"email": "user1@example.com", "password": "pass1"})
    client.post("/users/", json={"email": "user2@example.com", "password": "pass2"})
    
    response = client.get("/users/")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_read_user_by_id(client):
    """Test reading a specific user by ID"""
    create_response = client.post("/users/", json={"email": "test@example.com", "password": "testpass"})
    user_id = create_response.json()["id"]
    
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_read_nonexistent_user(client):
    """Test reading a non-existent user returns 404"""
    response = client.get("/users/9999")
    assert response.status_code == 404

def test_user_pagination(client):
    """Test user list pagination"""
    for i in range(5):
        client.post("/users/", json={"email": f"user{i}@example.com", "password": "pass"})
    
    response = client.get("/users/?skip=0&limit=3")
    assert response.status_code == 200
    assert len(response.json()) == 3

def test_login_success(client):
    """Test successful login"""
    client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    
    response = client.post("/token", data={"username": "test@example.com", "password": "testpass123"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_wrong_password(client):
    """Test login with wrong password"""
    client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    
    response = client.post("/token", data={"username": "test@example.com", "password": "wrongpass"})
    assert response.status_code == 401

def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    response = client.post("/token", data={"username": "nonexistent@example.com", "password": "pass"})
    assert response.status_code == 401

def test_get_current_user(client):
    """Test getting current authenticated user"""
    client.post("/users/", json={"email": "test@example.com", "password": "testpass123"})
    login_response = client.post("/token", data={"username": "test@example.com", "password": "testpass123"})
    token = login_response.json()["access_token"]
    
    response = client.get("/users/me/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_unauthorized_access(client):
    """Test accessing protected endpoint without token"""
    response = client.get("/users/me/")
    assert response.status_code == 401

def test_invalid_token(client):
    """Test accessing protected endpoint with invalid token"""
    response = client.get("/users/me/", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401
