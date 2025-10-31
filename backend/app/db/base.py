"""
Centralized SQLAlchemy Base and model imports so that mappers are configured
for all models (required for Alembic autogenerate and runtime relationships).
"""

# Import the shared Base from our declarative base_class
from app.db.base_class import Base

# Import all ORM models to ensure they are registered with the Base metadata
# NOTE: Import order can matter if there are interdependent relationships.
from app.models.user import User
from app.models.notification import Notification
from app.models.point_transaction import PointTransaction
from app.models.point_redemption import PointRedemption
from app.models.redemption_option import RedemptionOption
from app.models.partner import Partner
from app.models.pickup_request import PickupRequest
from app.models.company import Company
from app.models.vehicle import Vehicle

__all__ = [
	"Base",
	"User",
	"Notification",
	"PointTransaction",
	"PointRedemption",
	"RedemptionOption",
	"Partner",
	"PickupRequest",
	"Company",
	"Vehicle",
]
