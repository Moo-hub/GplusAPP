from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel

try:
    from pydantic import ConfigDict as _ConfigDict
except Exception:
    _ConfigDict = None


class RedemptionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

 


# Shared properties
class PointRedemptionBase(BaseModel):
    user_id: int
    option_id: int
    points_spent: int
    status: RedemptionStatus = RedemptionStatus.PENDING
    redemption_code: Optional[str] = None
    notes: Optional[str] = None


# Properties to receive on point redemption creation
class PointRedemptionCreate(BaseModel):
    option_id: int


# Properties to receive on point redemption update
class PointRedemptionUpdate(BaseModel):
    status: Optional[RedemptionStatus] = None
    redemption_code: Optional[str] = None
    notes: Optional[str] = None


# Properties shared by models stored in DB
class PointRedemptionInDBBase(PointRedemptionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    if _ConfigDict is not None:
        model_config = _ConfigDict(from_attributes=True)
    else:
        model_config = {"orm_mode": True}


# Properties to return to client
class PointRedemption(PointRedemptionInDBBase):

    pass


# Properties stored in DB, not returned by API
class PointRedemptionInDB(PointRedemptionInDBBase):
    pass


# Properties for point redemption with relationships
class PointRedemptionWithOption(PointRedemption):
    option: "RedemptionOption"


# Import at the end to avoid circular imports
from app.schemas.redemption_option import RedemptionOption
try:
    PointRedemptionWithOption.model_rebuild()
except Exception:
    PointRedemptionWithOption.update_forward_refs()