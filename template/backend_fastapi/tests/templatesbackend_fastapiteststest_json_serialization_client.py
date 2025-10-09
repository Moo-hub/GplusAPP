# templates/backend_fastapi/tests/test_json_serialization_client.py

import pytest
from app.utils.json_encoder import safe_json_encoder, dumps

{% if component_features.BackendFastAPI.database_support %}
from src.crud import create_user
from src.schemas import UserCreate


def test_user_json_serialization(db):
    """Test that User models can be JSON serialized without recursion errors."""
    user_data = UserCreate(email="json@example.com", password="pass123")
    user = create_user(db, user_data)
    
    # Should not raise RecursionError
    result = safe_json_encoder(user)
    
    assert result["email"] == "json@example.com"
    assert result["id"] is not None
    assert result["is_active"] is True


def test_user_list_serialization(db):
    """Test serializing a list of users."""
    users = [
        create_user(db, UserCreate(email=f"user{i}@example.com", password="pass123"))
        for i in range(3)
    ]
    
    # Should not raise RecursionError
    result = safe_json_encoder(users)
    
    assert len(result) == 3
    assert all("email" in u for u in result)
    assert all("id" in u for u in result)


def test_user_api_response_serialization(client):
    """Test that API responses properly serialize user objects."""
    response = client.post(
        "/users/",
        json={"email": "api_json@example.com", "password": "pass123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Response should be properly serialized JSON
    assert isinstance(data, dict)
    assert "email" in data
    assert "id" in data
    assert data["email"] == "api_json@example.com"


def test_dumps_with_user_object(db):
    """Test dumps function with User object."""
    user_data = UserCreate(email="dumps@example.com", password="pass123")
    user = create_user(db, user_data)
    
    # Should produce valid JSON string
    json_str = dumps(user)
    
    assert isinstance(json_str, str)
    assert "dumps@example.com" in json_str
    
    # Should be valid JSON
    import json
    parsed = json.loads(json_str)
    assert parsed["email"] == "dumps@example.com"
{% else %}
def test_basic_json_serialization():
    """Test basic JSON serialization."""
    data = {"name": "test", "value": 123}
    result = safe_json_encoder(data)
    assert result == data
{% endif %}
