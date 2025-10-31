from pydantic import BaseModel
from pydantic import ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

# Match the enum definitions from the model
class TransactionType(str, Enum):
    EARN = "earn"
    SPEND = "spend"

class TransactionSource(str, Enum):
    PICKUP = "pickup"
    REWARD = "reward"
    REFERRAL = "referral"
    SYSTEM = "system"
    MANUAL = "manual"
    REDEMPTION = "redemption"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PointTransactionBase(BaseModel):
    points: int
    type: TransactionType
    description: Optional[str] = None
    source: Optional[TransactionSource] = None
    status: TransactionStatus = TransactionStatus.COMPLETED
    redemption_id: Optional[int] = None

class PointTransactionCreate(PointTransactionBase):
    user_id: int

class PointTransaction(PointTransactionBase):
    id: int
    user_id: int
    created_at: datetime
    
    # Pydantic v2 style config
    model_config = ConfigDict(from_attributes=True)
        
# Properties for transaction with relationships
class PointTransactionWithRedemption(PointTransaction):
    redemption: Optional["PointRedemption"] = None


# Import at the end to avoid circular imports
from app.schemas.point_redemption import PointRedemption
PointTransactionWithRedemption.model_rebuild()