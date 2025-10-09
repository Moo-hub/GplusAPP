"""
API endpoints for notification system
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.api.dependencies.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
    NotificationsList,
    NotificationBatch,
    NotificationPreferences
)
from app.crud import notification as notification_crud
from app.core.redis_fastapi import cached_endpoint

router = APIRouter()

@router.get("/", response_model=NotificationsList)
@cached_endpoint(
    namespace="notifications_user",  # Will be appended with user ID in the dependency
    ttl=60,  # 1 minute cache - short cache for notifications
    cache_by_user=True,
    cache_control="private, max-age=60"
)
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = Query(False, description="Get only unread notifications"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get notifications for the current user.
    
    - **skip**: Number of notifications to skip (pagination)
    - **limit**: Maximum number of notifications to return
    - **unread_only**: If true, return only unread notifications
    """
    notifications = notification_crud.get_notifications(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only
    )
    
    unread_count = notification_crud.get_unread_count(db, current_user.id)
    
    return {
        "items": notifications,
        "unread_count": unread_count
    }

@router.get("/{notification_id}", response_model=Notification)
async def get_notification(
    notification_id: int = Path(..., description="The ID of the notification to get"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a specific notification by ID.
    """
    notification = notification_crud.get_notification(db, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this notification")
        
    return notification

@router.patch("/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: int,
    notification_in: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a notification (mark as read/dismissed).
    """
    notification = notification_crud.get_notification(db, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification")
    
    updated_notification = notification_crud.update_notification(
        db=db,
        db_obj=notification,
        obj_in=notification_in
    )
    
    return updated_notification

@router.post("/batch-update", response_model=Dict[str, Any])
async def batch_update_notifications(
    batch_update: NotificationBatch,
    action: str = Query(..., description="Action to perform: 'read', 'unread', or 'dismiss'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Perform batch operations on notifications.
    
    - **ids**: List of notification IDs to update
    - **action**: Action to perform ('read', 'unread', 'dismiss')
    """
    if action not in ["read", "unread", "dismiss"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'read', 'unread', or 'dismiss'")
    
    # Process each notification in the batch
    processed = 0
    for notification_id in batch_update.ids:
        notification = notification_crud.get_notification(db, notification_id)
        
        if notification and notification.user_id == current_user.id:
            if action == "read":
                notification_crud.update_notification(db, notification, {"read": True})
            elif action == "unread":
                notification_crud.update_notification(db, notification, {"read": False, "read_at": None})
            elif action == "dismiss":
                notification_crud.update_notification(db, notification, {"dismissed": True})
            processed += 1
    
    return {
        "success": True,
        "processed": processed,
        "total": len(batch_update.ids)
    }

@router.post("/mark-all-read", response_model=Dict[str, Any])
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mark all notifications as read for the current user.
    """
    count = notification_crud.mark_all_as_read(db, current_user.id)
    
    return {
        "success": True,
        "marked_read": count
    }

@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current notification preferences for the user.
    """
    return {
        "email": current_user.notification_email,
        "sms": current_user.notification_sms,
        "push": current_user.notification_push,
        # Default settings for specific notification types
        "pickup_reminders": True,
        "status_updates": True,
        "point_changes": True,
        "promotional": False
    }

@router.put("/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences: NotificationPreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update notification preferences for the current user.
    """
    # Update user's notification preferences
    current_user.notification_email = preferences.email
    current_user.notification_sms = preferences.sms
    current_user.notification_push = preferences.push
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    # Return the updated preferences
    return {
        "email": current_user.notification_email,
        "sms": current_user.notification_sms,
        "push": current_user.notification_push,
        "pickup_reminders": preferences.pickup_reminders,
        "status_updates": preferences.status_updates,
        "point_changes": preferences.point_changes,
        "promotional": preferences.promotional
    }