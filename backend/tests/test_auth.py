import pytest
from datetime import timedelta
from src import auth, crud, schemas

def test_create_access_token():
    """Test creating access token"""
    data = {"sub": "test@example.com"}
    token = auth.create_access_token(data)
    assert token is not None
    assert isinstance(token, str)

def test_create_access_token_with_expiry():
    """Test creating access token with custom expiry"""
    data = {"sub": "test@example.com"}
    expires_delta = timedelta(minutes=15)
    token = auth.create_access_token(data, expires_delta)
    assert token is not None

def test_authenticate_user_success(db_session):
    """Test successful user authentication"""
    user_data = schemas.UserCreate(email="test@example.com", password="testpass123")
    crud.create_user(db_session, user_data)
    
    user = auth.authenticate_user(db_session, "test@example.com", "testpass123")
    assert user is not False
    assert user.email == "test@example.com"

def test_authenticate_user_wrong_password(db_session):
    """Test authentication with wrong password"""
    user_data = schemas.UserCreate(email="test@example.com", password="testpass123")
    crud.create_user(db_session, user_data)
    
    user = auth.authenticate_user(db_session, "test@example.com", "wrongpass")
    assert user is False

def test_authenticate_nonexistent_user(db_session):
    """Test authentication with non-existent user"""
    user = auth.authenticate_user(db_session, "nonexistent@example.com", "pass")
    assert user is False

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session):
    """Test getting current user with invalid token"""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await auth.get_current_user(token="invalidtoken", db=db_session)
    assert exc_info.value.status_code == 401

@pytest.mark.asyncio
async def test_get_current_active_user_inactive(db_session):
    """Test that inactive users are rejected"""
    from fastapi import HTTPException
    from unittest.mock import Mock
    
    inactive_user = Mock()
    inactive_user.is_active = False
    
    with pytest.raises(HTTPException) as exc_info:
        await auth.get_current_active_user(inactive_user)
    assert exc_info.value.status_code == 400
