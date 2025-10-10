import pytest
from src.config import DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

def test_database_url_exists():
    """Test that DATABASE_URL is configured"""
    assert DATABASE_URL is not None
    assert len(DATABASE_URL) > 0

def test_secret_key_exists():
    """Test that SECRET_KEY is configured"""
    assert SECRET_KEY is not None
    assert len(SECRET_KEY) > 0

def test_algorithm_exists():
    """Test that ALGORITHM is configured"""
    assert ALGORITHM is not None
    assert ALGORITHM == "HS256"

def test_access_token_expire_minutes():
    """Test that ACCESS_TOKEN_EXPIRE_MINUTES is configured"""
    assert ACCESS_TOKEN_EXPIRE_MINUTES is not None
    assert isinstance(ACCESS_TOKEN_EXPIRE_MINUTES, int)
    assert ACCESS_TOKEN_EXPIRE_MINUTES > 0
