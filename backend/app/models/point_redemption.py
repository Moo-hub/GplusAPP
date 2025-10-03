from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base


class RedemptionStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PointRedemption(Base):
    __tablename__ = "point_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("redemption_options.id"), nullable=False)
    points_spent = Column(Integer, nullable=False)
    status = Column(Enum(RedemptionStatus), default=RedemptionStatus.PENDING, nullable=False)
    redemption_code = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="redemptions")
    option = relationship("RedemptionOption", back_populates="redemptions")
    transaction = relationship("PointTransaction", uselist=False, back_populates="redemption")