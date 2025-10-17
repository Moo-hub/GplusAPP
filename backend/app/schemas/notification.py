"""
Schemas for notification system
"""
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum

try:
    from pydantic import ConfigDict as _ConfigDict
except Exception:
    _ConfigDict = None

class NotificationType(str, Enum):
    PICKUP_REMINDER = "pickup_reminder"
    PICKUP_STATUS = "pickup_status"
    POINTS_EARNED = "points_earned"
    POINTS_REDEEMED = "points_redeemed"
    SYSTEM = "system"
    PROMOTIONAL = "promotional"

class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"

class NotificationBase(BaseModel):
    """Base schema for notification data"""
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    action_url: Optional[str] = None

class NotificationCreate(NotificationBase):
    """Schema for creating a new notification"""
    user_id: int

class NotificationUpdate(BaseModel):
    """Schema for updating a notification"""
    read: Optional[bool] = None
    dismissed: Optional[bool] = None

class Notification(NotificationBase):
    """Schema for notification responses"""
    id: int
    user_id: int
    read: bool
    dismissed: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    if _ConfigDict is not None:
        model_config = _ConfigDict(from_attributes=True)
    else:
        model_config = {"orm_mode": True}

class NotificationBatch(BaseModel):
    """Schema for batch notification operations"""
    ids: List[int]

class NotificationsList(BaseModel):
    """Schema for list of notifications"""
    items: List[Notification]
    unread_count: int

class NotificationPreferences(BaseModel):
    """Schema for user notification preferences"""
    email: bool = True
    sms: bool = False
    push: bool = True
    
    pickup_reminders: bool = True
    status_updates: bool = True
    point_changes: bool = True
    promotional: bool = False