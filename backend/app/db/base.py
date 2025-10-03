from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here so that Alembic can detect them
from app.db.base_class import Base
from app.models.user import User
from app.models.point_transaction import PointTransaction
from app.models.pickup_request import PickupRequest
from app.models.company import Company
from app.models.vehicle import Vehicle
