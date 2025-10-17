"""
In-app notification system and models
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Any, Dict
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class NotificationType(str, Enum):
    """Types of notifications"""
    PICKUP_REMINDER = "pickup_reminder"
    PICKUP_STATUS = "pickup_status"
    POINTS_EARNED = "points_earned"
    POINTS_REDEEMED = "points_redeemed"
    SYSTEM = "system"
    PROMOTIONAL = "promotional"

class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"

class Notification(Base):
    """Notification model for in-app notifications"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default=NotificationPriority.NORMAL)
    read = Column(Boolean, default=False)
    dismissed = Column(Boolean, default=False)
    action_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    @property
    def age_minutes(self) -> float:
        """Get notification age in minutes"""
        delta = datetime.utcnow() - self.created_at
        return delta.total_seconds() / 60
    
    def mark_as_read(self) -> None:
        """Mark notification as read"""
        if not self.read:
            self.read = True
            self.read_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert notification to dictionary"""
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "priority": self.priority,
            "read": self.read,
            "dismissed": self.dismissed,
            "action_url": self.action_url,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None
        }