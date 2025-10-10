import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, inspect
from pathlib import Path

@pytest.fixture
def alembic_config():
    """Create alembic configuration for testing"""
    config = Config("alembic.ini")
    return config


def test_alembic_migrations_run():
    """Test that alembic migrations can be applied successfully"""
    # Create a temporary test database
    test_db_url = "sqlite:///./test_migrations.db"
    
    # Create engine and run migrations
    engine = create_engine(test_db_url)
    
    # Run migrations using alembic
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", test_db_url)
    
    # Upgrade to head
    command.upgrade(config, "head")
    
    # Verify the users table exists and has expected columns
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    assert 'id' in columns
    assert 'email' in columns
    assert 'hashed_password' in columns
    assert 'is_active' in columns
    assert 'is_superuser' in columns
    
    # Clean up
    import os
    if os.path.exists("test_migrations.db"):
        os.remove("test_migrations.db")


def test_migration_002_adds_is_superuser():
    """Test that migration 002 successfully adds is_superuser column"""
    test_db_url = "sqlite:///./test_migration_002.db"
    engine = create_engine(test_db_url)
    
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", test_db_url)
    
    # Upgrade to 001_initial only
    command.upgrade(config, "001_initial")
    
    # Verify is_superuser doesn't exist yet
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    assert 'is_superuser' not in columns
    
    # Upgrade to 002_add_is_superuser
    command.upgrade(config, "002_add_is_superuser")
    
    # Verify is_superuser now exists
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    assert 'is_superuser' in columns
    
    # Clean up
    import os
    if os.path.exists("test_migration_002.db"):
        os.remove("test_migration_002.db")
