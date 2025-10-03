from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.pickup_request import PickupRequest
from app.schemas.pickup_request import PickupRequestCreate, PickupRequestUpdate

def calculate_points(weight: float) -> int:
    """
    Calculate points based on weight
    Simple formula: 50 points per kg
    """
    return int(weight * 50)

def get_by_user(db: Session, user_id: int) -> List[PickupRequest]:
    """
    Get all pickup requests for a user
    """
    return db.query(PickupRequest).filter(PickupRequest.user_id == user_id).all()

def get(db: Session, pickup_id: int) -> Optional[PickupRequest]:
    """
    Get a pickup request by ID
    """
    return db.query(PickupRequest).filter(PickupRequest.id == pickup_id).first()

def create(db: Session, obj_in: PickupRequestCreate, user_id: int) -> PickupRequest:
    """
    Create a new pickup request
    """
    points_estimate = calculate_points(obj_in.weight_estimate) if obj_in.weight_estimate else None
    
    # Create pickup request object with enhanced scheduling fields
    db_obj = PickupRequest(
        user_id=user_id,
        status="pending",
        materials=obj_in.materials,
        weight_estimate=obj_in.weight_estimate,
        scheduled_date=obj_in.scheduled_date,
        address=obj_in.address,
        points_estimate=points_estimate,
        
        # Enhanced scheduling fields
        time_slot=obj_in.time_slot,
        is_recurring=obj_in.is_recurring,
        recurrence_type=obj_in.recurrence_type,
        recurrence_end_date=obj_in.recurrence_end_date,
        calendar_event_id=obj_in.calendar_event_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, db_obj: PickupRequest, obj_in: PickupRequestUpdate) -> PickupRequest:
    """
    Update a pickup request
    """
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # If weight_actual is provided and status is being set to completed, 
    # calculate and set points_earned
    if update_data.get("status") == "completed" and "weight_actual" in update_data:
        update_data["points_earned"] = calculate_points(update_data["weight_actual"])
        update_data["completed_at"] = datetime.now()
    
    # If weight_estimate is updated, recalculate points_estimate
    if "weight_estimate" in update_data:
        update_data["points_estimate"] = calculate_points(update_data["weight_estimate"])
    
    # Update fields
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, pickup_id: int) -> bool:
    """
    Delete a pickup request
    """
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id).first()
    if not pickup:
        return False
    
    db.delete(pickup)
    db.commit()
    return True