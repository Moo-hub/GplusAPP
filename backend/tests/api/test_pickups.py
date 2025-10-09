import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.pickup_request import PickupRequest, RecurrenceType

def test_get_user_pickup_requests(client: TestClient, test_user_token, db: Session):
    """Test getting user's pickup requests"""
    # Create test pickup requests for the test user
    pickup1 = PickupRequest(
        user_id=1,  # Test user ID
        status="pending",
        materials=["plastic", "paper"],
        weight_estimate=5.0,
        address="123 Test St",
        scheduled_date=datetime.now() + timedelta(days=1),
        time_slot="09:00-12:00"
    )
    
    pickup2 = PickupRequest(
        user_id=1,  # Test user ID
        status="completed",
        materials=["glass", "metal"],
        weight_estimate=3.0,
        weight_actual=2.8,
        address="456 Test Ave",
        scheduled_date=datetime.now() - timedelta(days=2),
        time_slot="13:00-16:00",
        completed_at=datetime.now() - timedelta(days=1)
    )
    
    db.add(pickup1)
    db.add(pickup2)
    db.commit()
    
    response = client.get(
        "/api/v1/pickups/",
        headers=test_user_token
    )
    assert response.status_code == 200
    assert len(response.json()) == 2
    
    # Test filtering by status
    response = client.get(
        "/api/v1/pickups/?status=pending",
        headers=test_user_token
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "pending"

def test_create_pickup_request(client: TestClient, test_user_token, db: Session):
    """Test creating a pickup request"""
    pickup_data = {
        "materials": ["plastic", "paper"],
        "weight_estimate": 4.5,
        "scheduled_date": (datetime.now() + timedelta(days=3)).isoformat(),
        "address": "789 New St",
        "time_slot": "17:00-20:00",
        "is_recurring": True,
        "recurrence_type": "weekly",
        "recurrence_end_date": (datetime.now() + timedelta(days=31)).isoformat()
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.post(
        "/api/v1/pickups/",
        json=pickup_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["materials"] == ["plastic", "paper"]
    assert response.json()["address"] == "789 New St"
    assert response.json()["is_recurring"] == True
    assert response.json()["recurrence_type"] == "weekly"
    
    # Verify pickup was created in database
    pickup = db.query(PickupRequest).filter(PickupRequest.address == "789 New St").first()
    assert pickup is not None
    assert pickup.status == "pending"
    assert pickup.is_recurring == True
    assert pickup.recurrence_type == RecurrenceType.WEEKLY

def test_get_all_pickup_requests_admin(client: TestClient, admin_token, db: Session):
    """Test getting all pickup requests as admin"""
    # Create a pickup request for another user
    pickup = PickupRequest(
        user_id=3,  # Another user ID
        status="scheduled",
        materials=["electronic"],
        weight_estimate=10.0,
        address="987 Admin St",
        scheduled_date=datetime.now() + timedelta(days=5),
        time_slot="09:00-12:00"
    )
    db.add(pickup)
    db.commit()
    
    response = client.get(
        "/api/v1/pickups/admin",
        headers=admin_token
    )
    assert response.status_code == 200
    assert len(response.json()) >= 3  # At least 3 pickup requests
    
    # Test filtering by user_id
    response = client.get(
        "/api/v1/pickups/admin?user_id=3",
        headers=admin_token
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["address"] == "987 Admin St"

def test_get_all_pickup_requests_user(client: TestClient, test_user_token):
    """Test getting all pickup requests as regular user (should fail)"""
    response = client.get(
        "/api/v1/pickups/admin",
        headers=test_user_token
    )
    assert response.status_code == 403

def test_get_available_timeslots(client: TestClient, test_user_token):
    """Test getting available timeslots"""
    today = datetime.now().date()
    response = client.get(
        f"/api/v1/pickups/timeslots?start_date={today}&days=3",
        headers=test_user_token
    )
    assert response.status_code == 200
    assert len(response.json()) == 3  # 3 days of timeslots
    
    # Each day should have 3 time slots
    for day in response.json():
        assert len(day["slots"]) == 3
        assert "date" in day
        # Each slot should have availability information
        for slot in day["slots"]:
            assert "slot" in slot
            assert "available" in slot

def test_get_specific_pickup(client: TestClient, test_user_token, db: Session):
    """Test getting a specific pickup request"""
    # Get the first pickup request for the test user
    pickup = db.query(PickupRequest).filter(PickupRequest.user_id == 1).first()
    
    response = client.get(
        f"/api/v1/pickups/{pickup.id}",
        headers=test_user_token
    )
    assert response.status_code == 200
    assert response.json()["id"] == pickup.id

def test_update_pickup_request(client: TestClient, test_user_token, db: Session):
    """Test updating a pickup request"""
    # Get the first pickup request for the test user
    pickup = db.query(PickupRequest).filter(PickupRequest.user_id == 1).first()
    
    update_data = {
        "materials": ["plastic", "paper", "glass"],
        "weight_estimate": 6.0,
        "address": "Updated Address"
    }
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.put(
        f"/api/v1/pickups/{pickup.id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["address"] == "Updated Address"
    assert response.json()["weight_estimate"] == 6.0
    assert len(response.json()["materials"]) == 3
    
    # Verify pickup was updated in database
    updated_pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup.id).first()
    assert updated_pickup.address == "Updated Address"
    assert updated_pickup.weight_estimate == 6.0
    assert len(updated_pickup.materials) == 3

def test_delete_pickup_request(client: TestClient, test_user_token, db: Session):
    """Test deleting a pickup request"""
    # Create a new pickup request for deletion
    pickup = PickupRequest(
        user_id=1,  # Test user ID
        status="pending",
        materials=["plastic"],
        weight_estimate=1.0,
        address="Delete Me St",
        scheduled_date=datetime.now() + timedelta(days=7)
    )
    db.add(pickup)
    db.commit()
    
    # Get the ID of the newly created pickup
    pickup_id = pickup.id
    
    # In test environment, CSRF validation is skipped
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    
    response = client.delete(
        f"/api/v1/pickups/{pickup_id}",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Pickup request successfully deleted"
    
    # Verify pickup was deleted from database
    deleted_pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id).first()
    assert deleted_pickup is None

def test_unauthorized_pickup_access(client: TestClient, test_user_token, db: Session):
    """Test accessing another user's pickup request (should fail)"""
    # Create a pickup request for another user
    pickup = PickupRequest(
        user_id=3,  # Another user ID
        status="pending",
        materials=["plastic"],
        weight_estimate=2.0,
        address="Unauthorized St",
        scheduled_date=datetime.now() + timedelta(days=1)
    )
    db.add(pickup)
    db.commit()
    
    # Try to access the pickup
    response = client.get(
        f"/api/v1/pickups/{pickup.id}",
        headers=test_user_token
    )
    assert response.status_code == 403
    
    # Try to update the pickup
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    response = client.put(
        f"/api/v1/pickups/{pickup.id}",
        json={"address": "Hacked Address"},
        headers=headers
    )
    assert response.status_code == 403
    
    # Try to delete the pickup
    headers = {**test_user_token, "X-CSRF-Token": "test-csrf-token"}
    response = client.delete(
        f"/api/v1/pickups/{pickup.id}",
        headers=headers
    )
    assert response.status_code == 403