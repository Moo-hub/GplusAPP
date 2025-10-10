#!/usr/bin/env python3
"""
Demonstration script showing how the is_superuser migration prevents OperationalErrors.

This script simulates what happens when trying to query user data:
- Without the migration: Would get OperationalError (no such column: is_superuser)
- With the migration: Works correctly and returns user data including is_superuser field
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User

def test_user_query():
    """Test querying users with is_superuser field."""
    print("=" * 70)
    print("Testing User Query with is_superuser Field")
    print("=" * 70)
    
    # Create a session
    db = SessionLocal()
    
    try:
        # Create a test user
        test_user = User(
            email="test@example.com",
            hashed_password="hashed_password_here",
            is_active=True,
            is_superuser=False
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"\n✅ Successfully created user:")
        print(f"   ID: {test_user.id}")
        print(f"   Email: {test_user.email}")
        print(f"   Is Active: {test_user.is_active}")
        print(f"   Is Superuser: {test_user.is_superuser}")
        
        # Query the user (simulating a login endpoint)
        queried_user = db.query(User).filter(User.email == "test@example.com").first()
        
        if queried_user:
            print(f"\n✅ Successfully queried user:")
            print(f"   ID: {queried_user.id}")
            print(f"   Email: {queried_user.email}")
            print(f"   Is Active: {queried_user.is_active}")
            print(f"   Is Superuser: {queried_user.is_superuser}")
            
            print("\n" + "=" * 70)
            print("SUCCESS: No OperationalError!")
            print("The is_superuser column exists and can be queried.")
            print("=" * 70)
            return True
        else:
            print("\n❌ User not found after creation")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        print("\nThis error would occur if the migration was not applied.")
        print("Run: cd backend && alembic upgrade head")
        return False
    finally:
        # Clean up test data
        db.query(User).filter(User.email == "test@example.com").delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    success = test_user_query()
    sys.exit(0 if success else 1)
