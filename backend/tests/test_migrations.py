import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, inspect
import tempfile
import os

def test_alembic_migration_adds_is_superuser():
    """Test that Alembic migration properly adds is_superuser column"""
    # Create a temporary database
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    
    try:
        # Create Alembic config
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
        
        # Run migrations
        command.upgrade(alembic_cfg, "head")
        
        # Check that is_superuser column exists
        engine = create_engine(f"sqlite:///{db_path}")
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        assert 'is_superuser' in columns, "is_superuser column should be present after migration"
        
        # Check other expected columns
        assert 'id' in columns
        assert 'email' in columns
        assert 'hashed_password' in columns
        assert 'is_active' in columns
        
    finally:
        # Clean up
        if os.path.exists(db_path):
            os.remove(db_path)

def test_alembic_downgrade():
    """Test that Alembic can downgrade migrations"""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    
    try:
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
        
        # Upgrade to head
        command.upgrade(alembic_cfg, "head")
        
        # Downgrade
        command.downgrade(alembic_cfg, "base")
        
        # Check that table is removed
        engine = create_engine(f"sqlite:///{db_path}")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        assert 'users' not in tables, "users table should be removed after downgrade to base"
        
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
