"""
CRUD operations for notifications
"""
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
from datetime import datetime

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationUpdate

def get_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False
) -> List[Notification]:
    """
    Get notifications for a user
    
    Args:
        db: Database session
        user_id: ID of the user
        skip: Number of records to skip
        limit: Maximum number of records to return
        unread_only: Whether to return only unread notifications
        
    Returns:
        List of notifications
    """
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.read == False)
        
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def get_unread_count(db: Session, user_id: int) -> int:
    """
    Count unread notifications for a user
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Count of unread notifications
    """
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False,
        Notification.dismissed == False
    ).count()

def create_notification(db: Session, notification: NotificationCreate) -> Notification:
    """
    Create a new notification
    
    Args:
        db: Database session
        notification: Notification data
        
    Returns:
        Created notification
    """
    db_notification = Notification(
        user_id=notification.user_id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        priority=notification.priority,
        action_url=notification.action_url
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def update_notification(
    db: Session,
    db_obj: Notification,
    obj_in: Union[NotificationUpdate, Dict[str, Any]]
) -> Notification:
    """
    Update a notification
    
    Args:
        db: Database session
        db_obj: Existing notification object
        obj_in: Update data
        
    Returns:
        Updated notification
    """
    obj_data = jsonable_encoder(db_obj)
    
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
        
    # Handle special cases
    if update_data.get("read") and not db_obj.read:
        update_data["read_at"] = datetime.utcnow()
        
    # Update fields
    for field in obj_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_notification(db: Session, notification_id: int) -> Optional[Notification]:
    """
    Get a notification by ID
    
    Args:
        db: Database session
        notification_id: ID of the notification
        
    Returns:
        Notification if found, None otherwise
    """
    return db.query(Notification).filter(Notification.id == notification_id).first()

def delete_notification(db: Session, notification_id: int) -> bool:
    """
    Delete a notification
    
    Args:
        db: Database session
        notification_id: ID of the notification to delete
        
    Returns:
        True if deleted, False if not found
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if notification:
        db.delete(notification)
        db.commit()
        return True
    return False

def mark_all_as_read(db: Session, user_id: int) -> int:
    """
    Mark all notifications for a user as read
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Number of notifications marked as read
    """
    now = datetime.utcnow()
    result = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).update({"read": True, "read_at": now})
    
    db.commit()
    return result

def delete_old_notifications(db: Session, days_old: int = 30) -> int:
    """
    Delete notifications older than specified days
    
    Args:
        db: Database session
        days_old: Delete notifications older than this many days
        
    Returns:
        Number of notifications deleted
    """
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    result = db.query(Notification).filter(
        Notification.created_at < cutoff_date,
        Notification.dismissed == True
    ).delete()
    
    db.commit()
    return result