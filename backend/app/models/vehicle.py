from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.core.config import settings

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'electric', 'hybrid', 'gas', etc.
    capacity = Column(Float, nullable=False)  # in kg
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    materials_handled = Column(JSON, nullable=True)  # ['plastic', 'paper', 'glass', 'metal', etc.]
    status = Column(String, nullable=False)  # 'available', 'on_route', 'maintenance', etc.
    current_location = Column(JSON, nullable=True)  # {lat: float, lng: float}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="vehicles")