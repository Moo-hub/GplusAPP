"""Hermetic test to create/ensure a test user exists using the test DB session.

Replaces manual/create_test_user.py which required running a separate script.
"""
from app.models.user import User
from app.core.security import get_password_hash


def test_create_or_get_test_user(db):
    """Ensure a test user with email test@example.com exists in the test DB."""
    test_email = "test@example.com"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        # Sanity checks on the existing row
        assert existing.email == test_email
        assert existing.id is not None
        return

    # Create new test user
    hashed = get_password_hash("password123")
    user = User(email=test_email, hashed_password=hashed, name="Test User", is_active=True, role="admin")
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.email == test_email
