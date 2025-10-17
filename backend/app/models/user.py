from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    points = Column(Integer, default=0)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    # Backwards-compatible property: some code/schemas use `phone_number` while
    # the DB column is named `phone`. Provide a property with a setter so
    # Pydantic (from_attributes) and CRUD setattr calls work with
    # `phone_number` transparently.
    @property
    def phone_number(self):
        return self.phone

    @phone_number.setter
    def phone_number(self, value):
        self.phone = value
    is_active = Column(Boolean, default=True)
    # is_superuser field removed as it doesn't exist in the database
    email_verified = Column(Boolean, default=False)
    role = Column(String, default="user")  # user, company, admin
    notification_email = Column(Boolean, default=True)  # User preference for email notifications
    notification_sms = Column(Boolean, default=False)  # User preference for SMS notifications 
    notification_push = Column(Boolean, default=True)  # User preference for push notifications
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transactions = relationship("PointTransaction", back_populates="user")
    pickup_requests = relationship("PickupRequest", back_populates="user")
    redemptions = relationship("PointRedemption", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")