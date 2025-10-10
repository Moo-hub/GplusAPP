import pytest
from src.models import User
from sqlalchemy import inspect

def test_user_model_fields(db_session):
    """Test that User model has all required fields"""
    user = User(
        email="test@example.com",
        hashed_password="hashedpass",
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.hashed_password == "hashedpass"
    assert user.is_active == True
    assert user.is_superuser == False

def test_user_default_is_active(db_session):
    """Test that is_active defaults to True"""
    user = User(email="test@example.com", hashed_password="pass")
    db_session.add(user)
    db_session.commit()
    assert user.is_active == True

def test_user_default_is_superuser(db_session):
    """Test that is_superuser defaults to False"""
    user = User(email="test@example.com", hashed_password="pass")
    db_session.add(user)
    db_session.commit()
    assert user.is_superuser == False

def test_user_email_unique(db_session):
    """Test that email must be unique"""
    user1 = User(email="test@example.com", hashed_password="pass1")
    db_session.add(user1)
    db_session.commit()
    
    user2 = User(email="test@example.com", hashed_password="pass2")
    db_session.add(user2)
    with pytest.raises(Exception):  # Should raise integrity error
        db_session.commit()

def test_user_table_name():
    """Test that table name is correct"""
    assert User.__tablename__ == "users"

def test_user_has_is_superuser_column(db_session):
    """Test that User model has is_superuser column"""
    inspector = inspect(db_session.bind)
    columns = [col['name'] for col in inspector.get_columns('users')]
    assert 'is_superuser' in columns

def test_create_superuser(db_session):
    """Test creating a superuser"""
    user = User(
        email="admin@example.com",
        hashed_password="hashedpass",
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    db_session.commit()
    assert user.is_superuser == True

def test_user_email_indexed(db_session):
    """Test that email column is indexed"""
    inspector = inspect(db_session.bind)
    indexes = inspector.get_indexes('users')
    email_indexed = any('email' in idx['column_names'] for idx in indexes)
    assert email_indexed == True

def test_user_id_is_primary_key(db_session):
    """Test that id is primary key"""
    inspector = inspect(db_session.bind)
    pk = inspector.get_pk_constraint('users')
    assert 'id' in pk['constrained_columns']
