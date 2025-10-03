"""
Create a test user for API testing
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the path so we can import our app modules
backend_dir = Path(__file__).resolve().parent.parent.parent  # Go up to backend directory
sys.path.append(str(backend_dir))

from sqlalchemy.orm import Session
from sqlalchemy import Table, MetaData
from app.db.session import SessionLocal
from app.db.base_class import Base
from app.core.security import get_password_hash
from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import datetime

# Create a custom User model that matches the database schema
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    points = Column(Integer, default=0)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    # is_superuser field is removed as it doesn't exist in the database
    email_verified = Column(Boolean, default=False)
    role = Column(String, default="user")  # user, company, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

def create_test_user(db: Session):
    # Check if test user exists
    test_email = "test@example.com"
    existing_user = db.query(User).filter(User.email == test_email).first()
    if existing_user:
        print(f"Test user already exists with ID: {existing_user.id}")
        return existing_user
    
    # Create new test user
    hashed_password = get_password_hash("password123")
    test_user = User(
        email=test_email,
        hashed_password=hashed_password,
        name="Test User",
        is_active=True,
        # is_superuser removed as it doesn't exist in the database
        role="admin"
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print(f"Created new test user with ID: {test_user.id}")
    return test_user

if __name__ == "__main__":
    print("Creating test user for API testing...")
    db = SessionLocal()
    try:
        user = create_test_user(db)
        print(f"Test user ready: {user.email} (ID: {user.id})")
        print("You can use these credentials for API testing:")
        print("  Username: test@example.com")
        print("  Password: password123")
    finally:
        db.close()