"""
Manual tests for SQLAlchemy JSON serialization.

These tests require a populated test database and are marked as manual
so they don't run in CI by default.
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the path so we can import our app modules
backend_dir = Path(__file__).resolve().parent.parent.parent  # Go up to backend directory
sys.path.append(str(backend_dir))

import json
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.pickup_request import PickupRequest
from app.utils.json_encoder import EnhancedSQLAlchemyJSONEncoder

# Mark module as manual (requires running DB)
import pytest
pytestmark = pytest.mark.manual

def test_user_serialization():
    db = SessionLocal()
    try:
        # Get a user from the database
        user = db.query(User).first()
        if not user:
            print("No users found in database")
            return
        
        # Try to serialize with standard JSON encoder
        try:
            standard_json = json.dumps(user.__dict__)
            print("Standard JSON serialization succeeded (unusual):")
            print(standard_json)
        except TypeError as e:
            print(f"Standard JSON serialization failed as expected: {e}")
        
        # Try with our enhanced encoder
        try:
            enhanced_json = json.dumps(user, cls=EnhancedSQLAlchemyJSONEncoder)
            print("\nEnhanced JSON serialization succeeded:")
            print(enhanced_json)
            print("\nDecoded JSON:")
            decoded = json.loads(enhanced_json)
            for key, value in decoded.items():
                print(f"  {key}: {value}")
        except Exception as e:
            print(f"Enhanced JSON serialization failed: {e}")
    finally:
        db.close()

def test_pickup_serialization():
    db = SessionLocal()
    try:
        # Get a pickup request from the database
        pickup = db.query(PickupRequest).first()
        if not pickup:
            print("No pickup requests found in database")
            return
        
        # Try with our enhanced encoder
        try:
            enhanced_json = json.dumps(pickup, cls=EnhancedSQLAlchemyJSONEncoder)
            print("\nEnhanced JSON serialization of pickup succeeded:")
            print(enhanced_json)
        except Exception as e:
            print(f"Enhanced JSON serialization failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Testing SQLAlchemy JSON serialization...")
    test_user_serialization()
    test_pickup_serialization()