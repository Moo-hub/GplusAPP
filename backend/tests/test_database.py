import pytest
from src.database import Base, get_db, engine, SessionLocal

def test_base_exists():
    """Test that Base is defined"""
    assert Base is not None

def test_engine_exists():
    """Test that engine is created"""
    assert engine is not None

def test_session_local_exists():
    """Test that SessionLocal is created"""
    assert SessionLocal is not None

def test_get_db_generator():
    """Test that get_db is a generator"""
    db_gen = get_db()
    assert hasattr(db_gen, '__next__')

def test_get_db_yields_session():
    """Test that get_db yields a session"""
    db_gen = get_db()
    db = next(db_gen)
    assert db is not None
    try:
        db_gen.close()
    except StopIteration:
        pass
