from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class RecurrenceType(str, Enum):
    NONE = "none"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"

class TimeSlot(str, Enum):
    MORNING = "09:00-12:00"
    AFTERNOON = "13:00-16:00"
    EVENING = "17:00-20:00"

class PickupRequestBase(BaseModel):
    materials: List[str]
    weight_estimate: Optional[float] = None
    scheduled_date: Optional[datetime] = None
    address: str
    
    # Enhanced scheduling fields
    time_slot: Optional[str] = None  # Format: '09:00-12:00', '13:00-16:00', etc.
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_end_date: Optional[datetime] = None
    is_recurring: bool = False
    calendar_event_id: Optional[str] = None

class PickupRequestCreate(PickupRequestBase):
    pass

class PickupRequestUpdate(BaseModel):
    materials: Optional[List[str]] = None
    weight_estimate: Optional[float] = None
    scheduled_date: Optional[datetime] = None
    address: Optional[str] = None
    status: Optional[str] = None
    
    # Enhanced scheduling fields
    time_slot: Optional[str] = None
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_end_date: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    calendar_event_id: Optional[str] = None

class PickupRequest(PickupRequestBase):
    id: int
    user_id: int
    status: str
    points_estimate: Optional[int] = None
    points_earned: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    weight_actual: Optional[float] = None
    
    class Config:
        from_attributes = True

class AvailableTimeSlot(BaseModel):
    slot: str  # Format: '09:00-12:00'
    available: bool
    
class AvailableTimeSlots(BaseModel):
    date: str  # Format: 'YYYY-MM-DD'
    slots: List[AvailableTimeSlot]