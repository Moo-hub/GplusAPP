import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate

def test_login_valid_credentials(client: TestClient, db: Session):
    """Test login with valid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@test.com", "password": "testpass"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()
    assert "user" in response.json()
    assert response.json()["user"]["email"] == "test@test.com"

def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@test.com", "password": "wrongpass"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()

def test_register_new_user(client: TestClient, db: Session):
    """Test registering a new user"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "New User",
            "email": "new@test.com",
            "password": "newpass123",
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()
    assert "user" in response.json()
    assert response.json()["user"]["email"] == "new@test.com"
    
    # Verify user was created in database
    user = db.query(User).filter(User.email == "new@test.com").first()
    assert user is not None
    assert user.name == "New User"
    assert user.is_active == True

def test_register_existing_email(client: TestClient, db: Session):
    """Test registering with an existing email"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate User",
            "email": "test@test.com",  # Already exists
            "password": "newpass123",
        },
    )
    assert response.status_code == 400
    assert "detail" in response.json()

def test_get_current_user(client: TestClient, test_user_token):
    """Test getting current user info"""
    response = client.get(
        "/api/v1/auth/me",
        headers=test_user_token,
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@test.com"

def test_get_current_user_invalid_token(client: TestClient):
    """Test getting current user with invalid token"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()

def test_refresh_token(client: TestClient, db: Session):
    """Test refreshing access token"""
    # First, login to get refresh token
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@test.com", "password": "testpass"},
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Use refresh token to get new access token
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "token_type" in response.json()
    assert "user" in response.json()
    assert response.json()["user"]["email"] == "test@test.com"