"""
Integration tests for notification service with pickup requests
"""
import pytest
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.user import User
from app.models.pickup_request import PickupRequest, RecurrenceType
from app.models.notification import Notification, NotificationType
from app.services.notification_service import NotificationService
from app.tests.utils.user import create_random_user
from app.tests.utils.pickup_request import create_random_pickup_request


def test_send_pickup_reminder(db: Session):
    """Test sending pickup reminder notification"""
    # Create user
    user = create_random_user(db)
    
    # Create pickup scheduled for tomorrow
    tomorrow = datetime.utcnow() + timedelta(days=1)
    pickup = create_random_pickup_request(
        db=db, 
        user_id=user.id,
        status="scheduled",
        scheduled_date=tomorrow
    )
    
    # Create background tasks
    background_tasks = BackgroundTasks()
    
    # Send reminder
    result = NotificationService.send_pickup_reminder(
        db=db,
        background_tasks=background_tasks,
        pickup=pickup,
        hours_before=24
    )
    
    # Check result
    assert result["success"] is True
    assert "notification_id" in result
    assert "channels" in result
    assert "in_app" in result["channels"]
    
    # Verify notification was created
    notification_id = result["notification_id"]
    notification = db.query(Notification).get(notification_id)
    
    assert notification is not None
    assert notification.user_id == user.id
    assert notification.type == NotificationType.PICKUP_REMINDER
    assert "Pickup Reminder:" in notification.title
    assert pickup.address in notification.message


def test_send_pickup_status_update(db: Session):
    """Test sending pickup status update notification"""
    # Create user
    user = create_random_user(db)
    
    # Create pickup
    pickup = create_random_pickup_request(
        db=db, 
        user_id=user.id,
        status="pending"
    )
    
    # Create background tasks
    background_tasks = BackgroundTasks()
    
    # Send status update notification (pending -> confirmed)
    result = NotificationService.send_pickup_status_update(
        db=db,
        background_tasks=background_tasks,
        pickup=pickup,
        old_status="pending",
        new_status="confirmed"
    )
    
    # Check result
    assert result["success"] is True
    assert "notification_id" in result
    
    # Verify notification was created
    notification_id = result["notification_id"]
    notification = db.query(Notification).get(notification_id)
    
    assert notification is not None
    assert notification.user_id == user.id
    assert notification.type == NotificationType.PICKUP_STATUS
    assert notification.title == "Pickup Confirmed"


def test_send_pickup_status_update_completed(db: Session):
    """Test sending pickup completion notification"""
    # Create user with notification preferences
    user = create_random_user(db)
    user.notification_email = True
    db.add(user)
    db.commit()
    
    # Create pickup
    pickup = create_random_pickup_request(
        db=db, 
        user_id=user.id,
        status="in_progress"
    )
    
    # Create background tasks
    background_tasks = BackgroundTasks()
    
    # Send status update notification (in_progress -> completed)
    result = NotificationService.send_pickup_status_update(
        db=db,
        background_tasks=background_tasks,
        pickup=pickup,
        old_status="in_progress",
        new_status="completed"
    )
    
    # Check result
    assert result["success"] is True
    assert "notification_id" in result
    
    # Verify notification was created
    notification_id = result["notification_id"]
    notification = db.query(Notification).get(notification_id)
    
    assert notification is not None
    assert notification.user_id == user.id
    assert notification.type == NotificationType.PICKUP_STATUS
    assert notification.title == "Pickup Completed"
    assert "Thank you for recycling" in notification.message


def test_send_points_earned_notification(db: Session):
    """Test sending points earned notification"""
    # Create user
    user = create_random_user(db)
    
    # Create completed pickup
    pickup = create_random_pickup_request(
        db=db, 
        user_id=user.id,
        status="completed",
        points_earned=150
    )
    
    # Create background tasks
    background_tasks = BackgroundTasks()
    
    # Send points earned notification
    result = NotificationService.send_points_earned_notification(
        db=db,
        background_tasks=background_tasks,
        user=user,
        points=150,
        source="pickup",
        source_id=pickup.id
    )
    
    # Check result
    assert result["success"] is True
    assert "notification_id" in result
    
    # Verify notification was created
    notification_id = result["notification_id"]
    notification = db.query(Notification).get(notification_id)
    
    assert notification is not None
    assert notification.user_id == user.id
    assert notification.type == NotificationType.POINTS_EARNED
    assert "150" in notification.title  # Points amount should be in the title
    assert "pickup" in notification.message.lower()  # Source should be mentioned


def test_notification_channels(db: Session):
    """Test notification channels based on user preferences"""
    # Create user with email notifications enabled
    user1 = create_random_user(db)
    user1.notification_email = True
    user1.notification_sms = False
    db.add(user1)
    
    # Create user with SMS notifications enabled
    user2 = create_random_user(db)
    user2.notification_email = False
    user2.notification_sms = True
    db.add(user2)
    
    # Create user with both disabled
    user3 = create_random_user(db)
    user3.notification_email = False
    user3.notification_sms = False
    db.add(user3)
    
    db.commit()
    
    # Create pickups
    pickup1 = create_random_pickup_request(db=db, user_id=user1.id, status="scheduled")
    pickup2 = create_random_pickup_request(db=db, user_id=user2.id, status="scheduled")
    pickup3 = create_random_pickup_request(db=db, user_id=user3.id, status="scheduled")
    
    # Create background tasks
    background_tasks = BackgroundTasks()
    
    # Send reminders
    result1 = NotificationService.send_pickup_reminder(
        db=db, background_tasks=background_tasks, pickup=pickup1
    )
    result2 = NotificationService.send_pickup_reminder(
        db=db, background_tasks=background_tasks, pickup=pickup2
    )
    result3 = NotificationService.send_pickup_reminder(
        db=db, background_tasks=background_tasks, pickup=pickup3
    )
    
    # Check channels
    assert "email" in result1["channels"]  # User1 has email enabled
    assert "email" not in result2["channels"]  # User2 has email disabled
    assert "email" not in result3["channels"]  # User3 has all disabled
    
    # All users should have in-app notifications regardless of preferences
    assert "in_app" in result1["channels"]
    assert "in_app" in result2["channels"] 
    assert "in_app" in result3["channels"]