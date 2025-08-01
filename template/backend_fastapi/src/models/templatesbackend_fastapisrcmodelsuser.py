# templates/backend_fastapi/src/models/user.py
{% if component_features.BackendFastAPI.database_support %}
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    # Example relationship (if you had items, for instance)
    # items = relationship("Item", back_populates="owner")
{% endif %}
