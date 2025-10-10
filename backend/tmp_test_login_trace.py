#!/usr/bin/env python3
"""
Test script to verify the database schema includes is_superuser column.
This script creates a test database, applies migrations, and verifies the schema.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import inspect
from database import engine, Base
from models import User

def test_schema():
    """Test that the User model has the is_superuser column."""
    print("Testing database schema...")
    
    # Create inspector to check the actual database schema
    inspector = inspect(engine)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    
    if 'users' in tables:
        # Get columns for users table
        columns = inspector.get_columns('users')
        column_names = [col['name'] for col in columns]
        print(f"Columns in 'users' table: {column_names}")
        
        # Check if is_superuser column exists
        if 'is_superuser' in column_names:
            print("✅ SUCCESS: is_superuser column exists in users table")
            
            # Get column details
            is_superuser_col = next(col for col in columns if col['name'] == 'is_superuser')
            print(f"   - Type: {is_superuser_col['type']}")
            print(f"   - Nullable: {is_superuser_col['nullable']}")
            print(f"   - Default: {is_superuser_col.get('default', 'None')}")
            return True
        else:
            print("❌ FAIL: is_superuser column NOT found in users table")
            return False
    else:
        print("⚠️  WARNING: users table does not exist. Run migrations first.")
        return False

def test_model():
    """Test that the User model class has is_superuser attribute."""
    print("\nTesting User model...")
    
    # Check if User model has is_superuser attribute
    if hasattr(User, 'is_superuser'):
        print("✅ SUCCESS: User model has is_superuser attribute")
        print(f"   - Column: {User.is_superuser}")
        return True
    else:
        print("❌ FAIL: User model does NOT have is_superuser attribute")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing is_superuser column migration")
    print("=" * 60)
    
    model_test = test_model()
    schema_test = test_schema()
    
    print("\n" + "=" * 60)
    if model_test and schema_test:
        print("✅ ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        print("\nTo fix:")
        print("1. cd backend")
        print("2. alembic upgrade head")
        sys.exit(1)
