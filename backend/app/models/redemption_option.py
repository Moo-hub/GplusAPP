from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class RedemptionOption(Base):
    __tablename__ = "redemption_options"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    points_required = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    image_url = Column(String, nullable=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    category = Column(String, nullable=True)
    stock = Column(Integer, default=-1, nullable=False)  # -1 means unlimited
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    partner = relationship("Partner", back_populates="redemption_options")
    redemptions = relationship("PointRedemption", back_populates="option")