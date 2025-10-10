import pytest
from pydantic import ValidationError
from src import schemas

def test_user_base_schema():
    """Test UserBase schema"""
    user = schemas.UserBase(email="test@example.com")
    assert user.email == "test@example.com"

def test_user_base_invalid_email():
    """Test UserBase with invalid email"""
    with pytest.raises(ValidationError):
        schemas.UserBase(email="invalid-email")

def test_user_create_schema():
    """Test UserCreate schema"""
    user = schemas.UserCreate(email="test@example.com", password="testpass")
    assert user.email == "test@example.com"
    assert user.password == "testpass"

def test_user_schema():
    """Test User schema"""
    user = schemas.User(
        id=1,
        email="test@example.com",
        is_active=True,
        is_superuser=False
    )
    assert user.id == 1
    assert user.email == "test@example.com"
    assert user.is_active == True
    assert user.is_superuser == False

def test_user_schema_has_is_superuser():
    """Test that User schema has is_superuser field"""
    user = schemas.User(
        id=1,
        email="test@example.com",
        is_active=True,
        is_superuser=True
    )
    assert hasattr(user, 'is_superuser')
    assert user.is_superuser == True

def test_token_schema():
    """Test Token schema"""
    token = schemas.Token(access_token="abc123", token_type="bearer")
    assert token.access_token == "abc123"
    assert token.token_type == "bearer"

def test_token_data_schema():
    """Test TokenData schema"""
    token_data = schemas.TokenData(email="test@example.com")
    assert token_data.email == "test@example.com"

def test_token_data_optional_email():
    """Test TokenData with optional email"""
    token_data = schemas.TokenData()
    assert token_data.email is None

def test_user_schema_config():
    """Test User schema has from_attributes config"""
    assert schemas.User.model_config.get('from_attributes') == True

def test_user_create_missing_password():
    """Test UserCreate without password fails"""
    with pytest.raises(ValidationError):
        schemas.UserCreate(email="test@example.com")

def test_user_create_missing_email():
    """Test UserCreate without email fails"""
    with pytest.raises(ValidationError):
        schemas.UserCreate(password="testpass")

def test_user_missing_required_fields():
    """Test User schema without required fields fails"""
    with pytest.raises(ValidationError):
        schemas.User(email="test@example.com")
