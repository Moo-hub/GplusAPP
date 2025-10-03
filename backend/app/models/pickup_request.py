from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base
from app.core.config import settings

class RecurrenceType(str, enum.Enum):
    NONE = "none"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"

class PickupRequest(Base):
    __tablename__ = "pickup_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)  # 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
    materials = Column(JSON, nullable=False)  # ['plastic', 'paper', 'glass', 'metal', etc.]
    weight_estimate = Column(Float, nullable=True)
    weight_actual = Column(Float, nullable=True)
    
    # Enhanced scheduling fields
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    time_slot = Column(String, nullable=True)  # Format: '09:00-12:00', '13:00-16:00', etc.
    recurrence_type = Column(Enum(RecurrenceType), nullable=False, default=RecurrenceType.NONE)
    recurrence_end_date = Column(DateTime(timezone=True), nullable=True)
    is_recurring = Column(Boolean, default=False)
    calendar_event_id = Column(String, nullable=True)  # For external calendar integration
    
    address = Column(String, nullable=False)
    points_estimate = Column(Integer, nullable=True)
    points_earned = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="pickup_requests")