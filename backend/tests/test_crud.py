import pytest
from src import crud, models, schemas
from src.database import Base

def test_verify_password():
    """Test password verification"""
    plain_password = "testpassword"
    hashed = crud.get_password_hash(plain_password)
    assert crud.verify_password(plain_password, hashed) == True
    assert crud.verify_password("wrongpassword", hashed) == False

def test_get_password_hash():
    """Test password hashing"""
    password = "testpass"
    hashed = crud.get_password_hash(password)
    assert hashed != password
    assert len(hashed) > 0

def test_create_user(db_session):
    """Test creating a user in database"""
    user_data = schemas.UserCreate(email="test@example.com", password="testpass")
    user = crud.create_user(db_session, user_data)
    assert user.email == "test@example.com"
    assert user.id is not None
    assert user.hashed_password != "testpass"

def test_get_user(db_session):
    """Test getting user by ID"""
    user_data = schemas.UserCreate(email="test@example.com", password="testpass")
    created_user = crud.create_user(db_session, user_data)
    
    retrieved_user = crud.get_user(db_session, created_user.id)
    assert retrieved_user.id == created_user.id
    assert retrieved_user.email == created_user.email

def test_get_user_by_email(db_session):
    """Test getting user by email"""
    user_data = schemas.UserCreate(email="test@example.com", password="testpass")
    created_user = crud.create_user(db_session, user_data)
    
    retrieved_user = crud.get_user_by_email(db_session, "test@example.com")
    assert retrieved_user.email == created_user.email

def test_get_users(db_session):
    """Test getting multiple users"""
    for i in range(5):
        user_data = schemas.UserCreate(email=f"user{i}@example.com", password="pass")
        crud.create_user(db_session, user_data)
    
    users = crud.get_users(db_session)
    assert len(users) == 5

def test_get_users_with_skip(db_session):
    """Test getting users with skip parameter"""
    for i in range(5):
        user_data = schemas.UserCreate(email=f"user{i}@example.com", password="pass")
        crud.create_user(db_session, user_data)
    
    users = crud.get_users(db_session, skip=2)
    assert len(users) == 3

def test_get_users_with_limit(db_session):
    """Test getting users with limit parameter"""
    for i in range(5):
        user_data = schemas.UserCreate(email=f"user{i}@example.com", password="pass")
        crud.create_user(db_session, user_data)
    
    users = crud.get_users(db_session, limit=3)
    assert len(users) == 3

def test_nonexistent_user(db_session):
    """Test getting non-existent user returns None"""
    user = crud.get_user(db_session, 9999)
    assert user is None

def test_nonexistent_email(db_session):
    """Test getting non-existent email returns None"""
    user = crud.get_user_by_email(db_session, "nonexistent@example.com")
    assert user is None
