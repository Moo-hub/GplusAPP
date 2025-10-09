"""
Utilities for testing pickup requests
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.pickup_request import PickupRequest, RecurrenceType
from app.crud.pickup_request import create_pickup_request
from app.schemas.pickup_request import PickupRequestCreate


def create_random_pickup_request(
    db: Session,
    user_id: int,
    status: str = "pending",
    scheduled_date: Optional[datetime] = None,
    materials: Optional[List[str]] = None,
    address: Optional[str] = None,
    weight_estimate: Optional[float] = None,
    points_estimate: Optional[int] = None,
    points_earned: Optional[int] = None,
    is_recurring: bool = False,
    recurrence_type: RecurrenceType = RecurrenceType.NONE
) -> PickupRequest:
    """
    Create a random pickup request for testing
    """
    if scheduled_date is None:
        scheduled_date = datetime.utcnow()
        
    if materials is None:
        materials = ["plastic", "paper", "glass"]
        
    if address is None:
        address = "123 Test Street, Test City"
        
    if weight_estimate is None:
        weight_estimate = 10.5
        
    if points_estimate is None:
        points_estimate = 100
    
    pickup_request_in = PickupRequestCreate(
        user_id=user_id,
        status=status,
        materials=materials,
        weight_estimate=weight_estimate,
        scheduled_date=scheduled_date,
        time_slot="09:00-12:00",
        address=address,
        points_estimate=points_estimate,
        is_recurring=is_recurring,
        recurrence_type=recurrence_type
    )
    
    pickup_request = create_pickup_request(db=db, obj_in=pickup_request_in)
    
    # Set fields not covered by the schema
    if points_earned is not None:
        pickup_request.points_earned = points_earned
        db.add(pickup_request)
        db.commit()
        db.refresh(pickup_request)
    
    return pickup_request