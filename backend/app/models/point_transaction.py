from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

# Define Enums for transaction properties
class TransactionType(str, enum.Enum):
    EARN = "earn"
    SPEND = "spend"

class TransactionSource(str, enum.Enum):
    PICKUP = "pickup"
    REWARD = "reward"
    REFERRAL = "referral"
    SYSTEM = "system"
    MANUAL = "manual"
    REDEMPTION = "redemption"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(String, nullable=True)
    source = Column(Enum(TransactionSource), nullable=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED, nullable=False)
    redemption_id = Column(Integer, ForeignKey("point_redemptions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    redemption = relationship("PointRedemption", back_populates="transaction")