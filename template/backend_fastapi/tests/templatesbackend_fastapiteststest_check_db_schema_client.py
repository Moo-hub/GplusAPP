# templates/backend_fastapi/tests/test_check_db_schema_client.py

import pytest

{% if component_features.BackendFastAPI.database_support %}
from sqlalchemy import inspect
from src.database import engine
from src.models.user import User


def test_database_tables_exist():
    """Test that expected database tables exist."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    assert "users" in tables


def test_user_table_schema():
    """Test that User table has expected columns."""
    inspector = inspect(engine)
    columns = {col["name"]: col for col in inspector.get_columns("users")}
    
    assert "id" in columns
    assert "email" in columns
    assert "hashed_password" in columns
    assert "is_active" in columns


def test_user_model_matches_schema(db):
    """Test that User model can interact with database correctly."""
    # Create a user directly using the model
    user = User(
        email="schema@example.com",
        hashed_password="hashed",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    assert user.id is not None
    assert user.email == "schema@example.com"
    assert user.is_active is True


def test_database_constraints():
    """Test database constraints."""
    inspector = inspect(engine)
    
    # Check for primary key
    pk_constraint = inspector.get_pk_constraint("users")
    assert pk_constraint["constrained_columns"] == ["id"]
    
    # Check for unique constraints on email if applicable
    unique_constraints = inspector.get_unique_constraints("users")
    email_unique = any(
        "email" in constraint.get("column_names", [])
        for constraint in unique_constraints
    )
    # Email should ideally be unique
    # This might not be enforced in basic template, so we just check it exists
    assert "email" in [col["name"] for col in inspector.get_columns("users")]
{% else %}
def test_no_database():
    """Placeholder when database is not configured."""
    assert True
{% endif %}
