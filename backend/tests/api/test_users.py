import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User

def test_get_users_admin(client: TestClient, admin_token, db: Session):
    """Test getting all users as admin"""
    response = client.get(
        "/api/v1/users/",
        headers=admin_token
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 2  # At least test user and admin user

def test_get_users_regular_user(client: TestClient, test_user_token):
    """Test getting all users as regular user (should fail)"""
    response = client.get(
        "/api/v1/users/",
        headers=test_user_token
    )
    assert response.status_code == 403

def test_create_user_admin(client: TestClient, admin_token, db: Session):
    """Test creating a user as admin"""
    user_data = {
        "email": "newuser@test.com",
        "password": "newuserpass",
        "name": "New Test User",
        "phone_number": "+1234567890",
        "address": "123 New User St"
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**admin_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.post(
        "/api/v1/users/",
        json=user_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == "newuser@test.com"
    assert response.json()["name"] == "New Test User"
    assert "password" not in response.json()  # Password should not be returned
    
    # Verify user was created in database
    user = db.query(User).filter(User.email == "newuser@test.com").first()
    assert user is not None
    assert user.name == "New Test User"
    assert user.is_active == True
    assert user.is_superuser == False

def test_create_user_regular_user(client: TestClient, test_user_token):
    """Test creating a user as regular user (should fail)"""
    user_data = {
        "email": "unauthorized@test.com",
        "password": "testpass",
        "name": "Unauthorized User"
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.post(
        "/api/v1/users/",
        json=user_data,
        headers=headers
    )
    assert response.status_code == 403

def test_get_me(client: TestClient, test_user_token):
    """Test getting current user info"""
    response = client.get(
        "/api/v1/users/me",
        headers=test_user_token
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@test.com"
    assert response.json()["name"] == "Test User"

def test_update_me(client: TestClient, test_user_token, db: Session):
    """Test updating current user info"""
    update_data = {
        "name": "Updated Test User",
        "phone_number": "+9876543210"
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.put(
        "/api/v1/users/me",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Test User"
    assert response.json()["phone_number"] == "+9876543210"
    
    # Verify user was updated in database
    user = db.query(User).filter(User.id == 1).first()
    assert user.name == "Updated Test User"
    assert user.phone_number == "+9876543210"

def test_update_user_password(client: TestClient, test_user_token, db: Session):
    """Test updating user password"""
    password_data = {
        "current_password": "testpass",
        "new_password": "newtestpass"
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.put(
        "/api/v1/users/me/password",
        json=password_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"

def test_get_user_by_id_admin(client: TestClient, admin_token):
    """Test getting user by ID as admin"""
    response = client.get(
        "/api/v1/users/1",  # Get test user
        headers=admin_token
    )
    assert response.status_code == 200
    assert response.json()["id"] == 1
    assert response.json()["email"] == "test@test.com"

def test_get_user_by_id_own_profile(client: TestClient, test_user_token):
    """Test getting own profile by ID"""
    response = client.get(
        "/api/v1/users/1",  # Test user's own ID
        headers=test_user_token
    )
    assert response.status_code == 200
    assert response.json()["id"] == 1
    assert response.json()["email"] == "test@test.com"

def test_get_user_by_id_unauthorized(client: TestClient, test_user_token):
    """Test getting another user's profile by ID (should fail)"""
    response = client.get(
        "/api/v1/users/2",  # Admin user ID
        headers=test_user_token
    )
    assert response.status_code == 403

def test_update_user_admin(client: TestClient, admin_token, db: Session):
    """Test updating a user as admin"""
    update_data = {
        "name": "Admin Updated User",
        "is_active": True
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**admin_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.put(
        "/api/v1/users/1",  # Update test user
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Admin Updated User"
    assert response.json()["is_active"] == True
    
    # Verify user was updated in database
    user = db.query(User).filter(User.id == 1).first()
    assert user.name == "Admin Updated User"

def test_update_user_unauthorized(client: TestClient, test_user_token):
    """Test updating another user as regular user (should fail)"""
    update_data = {
        "name": "Hacked Name"
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.put(
        "/api/v1/users/2",  # Try to update admin user
        json=update_data,
        headers=headers
    )
    assert response.status_code == 403

def test_deactivate_user_admin(client: TestClient, admin_token, db: Session):
    """Test deactivating a user as admin"""
    # Create a user to deactivate
    user = User(
        email="todeactivate@test.com",
        name="To Deactivate",
        hashed_password="$2b$12$XO0lAHZaXLmEYFWBx8bJdeSrWGW/Z6LbGq4qYY2o8P0fLb/xd7EJS",  # password: testpass
        is_active=True
    )
    db.add(user)
    db.commit()
    
    # In test environment, CSRF validation is skipped
    headers = {**admin_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.post(
        f"/api/v1/users/{user.id}/deactivate",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["is_active"] == False
    
    # Verify user was deactivated in database
    db.refresh(user)
    assert user.is_active == False

def test_deactivate_user_unauthorized(client: TestClient, test_user_token):
    """Test deactivating a user as regular user (should fail)"""
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.post(
        "/api/v1/users/3/deactivate",  # Try to deactivate another user
        headers=headers
    )
    assert response.status_code == 403

def test_deactivate_self(client: TestClient, test_user_token):
    """Test deactivating own account (should fail)"""
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.post(
        "/api/v1/users/1/deactivate",  # Try to deactivate self
        headers=headers
    )
    assert response.status_code == 403