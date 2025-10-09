"""
Tests for notification API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.main import app
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.tests.utils.utils import random_lower_string
from app.tests.utils.user import create_random_user, user_authentication_headers
from app.crud.notification import create_notification
from app.schemas.notification import NotificationCreate



def create_sample_notification(db: Session, user_id: int):
    """Create a sample notification for testing"""
    notification_in = NotificationCreate(
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title="Test notification",
        message="This is a test notification",
        priority=NotificationPriority.NORMAL,
        action_url="/test"
    )
    return create_notification(db, notification_in)


def test_get_notifications(client: TestClient, db: Session):
    """Test retrieving user notifications"""
    # Create a user
    user = create_random_user(db)
    
    # Create some notifications for the user
    for i in range(5):
        notification_in = NotificationCreate(
            user_id=user.id,
            type=NotificationType.SYSTEM,
            title=f"Test notification {i}",
            message=f"This is test notification {i}",
            priority=NotificationPriority.NORMAL
        )
        create_notification(db, notification_in)
    
    # Get auth headers
    headers = user_authentication_headers(client, user.email, "testpassword")
    
    # Test getting all notifications
    response = client.get("/api/v1/notifications/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert "items" in data
    assert "unread_count" in data
    assert len(data["items"]) == 5
    assert data["unread_count"] == 5


def test_get_unread_count(client: TestClient, db: Session):
    """Test retrieving unread notification count"""
    # Create a user
    user = create_random_user(db)
    
    # Create some notifications for the user
    for i in range(3):
        notification_in = NotificationCreate(
            user_id=user.id,
            type=NotificationType.SYSTEM,
            title=f"Test notification {i}",
            message=f"This is test notification {i}",
            priority=NotificationPriority.NORMAL
        )
        create_notification(db, notification_in)
    
    # Get auth headers
    headers = user_authentication_headers(client, user.email, "testpassword")
    
    # Test getting unread count
    response = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["count"] == 3


def test_mark_notification_read(client: TestClient, db: Session):
    """Test marking a notification as read"""
    # Create a user
    user = create_random_user(db)
    
    # Create a notification
    notification = create_sample_notification(db, user.id)
    
    # Get auth headers
    headers = user_authentication_headers(client, user.email, "testpassword")
    
    # Mark notification as read
    response = client.patch(
        f"/api/v1/notifications/{notification.id}", 
        json={"read": True},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == notification.id
    assert data["read"] is True
    assert data["read_at"] is not None


def test_mark_all_read(client: TestClient, db: Session):
    """Test marking all notifications as read"""
    # Create a user
    user = create_random_user(db)
    
    # Create some notifications for the user
    for i in range(3):
        notification_in = NotificationCreate(
            user_id=user.id,
            type=NotificationType.SYSTEM,
            title=f"Test notification {i}",
            message=f"This is test notification {i}",
            priority=NotificationPriority.NORMAL
        )
        create_notification(db, notification_in)
    
    # Get auth headers
    headers = user_authentication_headers(client, user.email, "testpassword")
    
    # Mark all notifications as read
    response = client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["marked_read"] == 3
    
    # Check that all notifications are actually marked as read
    response = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert response.json()["count"] == 0


def test_notification_preferences(client: TestClient, db: Session):
    """Test getting and updating notification preferences"""
    # Create a user
    user = create_random_user(db)
    
    # Get auth headers
    headers = user_authentication_headers(client, user.email, "testpassword")
    
    # Get preferences (defaults)
    response = client.get("/api/v1/notifications/preferences", headers=headers)
    assert response.status_code == 200
    prefs = response.json()
    
    assert prefs["email"] is True  # Default value
    
    # Update preferences
    new_prefs = {
        "email": False,
        "sms": True,
        "push": True,
        "pickup_reminders": True,
        "status_updates": False,
        "point_changes": True,
        "promotional": False
    }
    
    response = client.put(
        "/api/v1/notifications/preferences", 
        json=new_prefs,
        headers=headers
    )
    assert response.status_code == 200
    updated = response.json()
    
    assert updated["email"] is False
    assert updated["sms"] is True
    
    # Verify preferences were actually saved
    response = client.get("/api/v1/notifications/preferences", headers=headers)
    saved = response.json()
    
    assert saved["email"] is False
    assert saved["sms"] is True


def test_unauthorized_access(client: TestClient, db: Session):
    """Test unauthorized access to notifications"""
    # Try without auth
    response = client.get("/api/v1/notifications/")
    assert response.status_code == 401
    
    # Create two users
    user1 = create_random_user(db)
    user2 = create_random_user(db)
    
    # Create notification for user1
    notification = create_sample_notification(db, user1.id)
    
    # Get auth headers for user2
    headers = user_authentication_headers(client, user2.email, "testpassword")
    
    # Try to access user1's notification
    response = client.get(f"/api/v1/notifications/{notification.id}", headers=headers)
    assert response.status_code == 404  # Should not be found for this user
    
    # Try to update user1's notification
    response = client.patch(
        f"/api/v1/notifications/{notification.id}", 
        json={"read": True},
        headers=headers
    )
    assert response.status_code == 404  # Should not be found for this user