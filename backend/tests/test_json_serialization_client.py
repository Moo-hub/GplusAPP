import json
from typing import Any, Dict
import pytest

from app.utils.json_encoder import EnhancedSQLAlchemyJSONEncoder
from app.models.user import User
from app.models.pickup_request import PickupRequest


def _serialize_and_decode(obj: Any) -> Dict[str, Any]:
    s = json.dumps(obj, cls=EnhancedSQLAlchemyJSONEncoder)
    return json.loads(s)


def _ensure_user(session):
    user = session.query(User).first()
    if user:
        return user
    user = User(email="test-serial@test.com", name="Serial User", hashed_password="x", is_active=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _ensure_pickup(session, user_id: int):
    pickup = session.query(PickupRequest).first()
    if pickup:
        return pickup
    # Minimal valid pickup request based on model fields
    pr = PickupRequest(
        user_id=user_id,
        status="pending",
        materials=["plastic"],
        address="123 Test St",
    )
    session.add(pr)
    session.commit()
    session.refresh(pr)
    return pr


def test_user_serialization(db):
    user = _ensure_user(db)

    decoded = _serialize_and_decode(user)

    # Basic assertions about serialized shape
    assert "id" in decoded
    assert "email" in decoded
    assert decoded.get("email") == user.email


def test_pickup_serialization(db):
    user = _ensure_user(db)
    pickup = _ensure_pickup(db, user.id)

    decoded = _serialize_and_decode(pickup)

    assert "id" in decoded
    assert "user_id" in decoded
    assert decoded.get("user_id") == pickup.user_id
