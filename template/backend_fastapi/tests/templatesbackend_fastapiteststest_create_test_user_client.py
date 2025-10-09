# templates/backend_fastapi/tests/test_create_test_user_client.py

import pytest

{% if component_features.BackendFastAPI.database_support %}
from src.crud import create_user
from src.schemas import UserCreate


def test_create_user_via_crud(db):
    """Test creating a user via CRUD operations."""
    user_data = UserCreate(email="test@example.com", password="testpass123")
    user = create_user(db, user_data)
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_active is True


def test_create_user_via_api(client):
    """Test creating a user via API endpoint."""
    response = client.post(
        "/users/",
        json={"email": "api@example.com", "password": "apipass123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "api@example.com"
    assert "id" in data
    assert data["is_active"] is True


def test_create_duplicate_user(client):
    """Test that creating a duplicate user fails appropriately."""
    user_data = {"email": "duplicate@example.com", "password": "pass123"}
    
    # Create first user
    response1 = client.post("/users/", json=user_data)
    assert response1.status_code == 200
    
    # Try to create duplicate
    response2 = client.post("/users/", json=user_data)
    # Should fail with 400 Bad Request or similar
    assert response2.status_code in [400, 409]
{% else %}
def test_placeholder():
    """Placeholder test when database support is not enabled."""
    assert True
{% endif %}
