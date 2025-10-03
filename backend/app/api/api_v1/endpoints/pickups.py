from fastapi import APIRouter, HTTPException, status, Depends, Request, Header, Query, Path
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.api.dependencies.auth import get_current_user, get_current_superuser
from app.core.security import validate_csrf_token
from app.db.session import get_db
from app.models.user import User
from app.models.pickup_request import PickupRequest
from app.schemas.pickup_request import (
    PickupRequest as PickupRequestSchema, 
    PickupRequestCreate, 
    PickupRequestUpdate,
    AvailableTimeSlots,
    AvailableTimeSlot
)
from app.crud import pickup_request as pickup_crud
from app.core.redis_fastapi import cached_endpoint
from app.core.redis_cache import invalidate_namespace

router = APIRouter()

@router.post("/")
async def create_pickup_request(
    pickup_in: PickupRequestCreate,
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new pickup request.
    
    - **materials**: List of materials to be picked up (e.g., ['plastic', 'paper'])
    - **weight_estimate**: Estimated weight of materials in kg
    - **scheduled_date**: Requested pickup date and time
    - **address**: Pickup address
    - **time_slot**: Optional time slot for pickup (e.g., '09:00-12:00')
    - **is_recurring**: Whether this is a recurring pickup
    - **recurrence_type**: For recurring pickups: 'none', 'weekly', 'bi_weekly', 'monthly'
    - **recurrence_end_date**: End date for recurring pickups
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # Create pickup request
    pickup = pickup_crud.create(db, obj_in=pickup_in, user_id=current_user.id)
    
    # Invalidate cache
    invalidate_namespace(f"pickups_user_{current_user.id}")
    invalidate_namespace("pickups_admin")
    
    # Convert SQLAlchemy model to Pydantic model
    # This is now handled by our custom JSON encoder
    return pickup

@router.get("/")
@cached_endpoint(
    namespace="pickups_user",  # Will be appended with user ID in the dependency
    ttl=300,  # 5 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=300"
)
async def get_user_pickup_requests(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Any]:
    """
    Get all pickup requests for the current user.
    Optionally filter by status.
    
    - **status**: Optional filter by pickup status ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')
    """
    # Get user's pickup requests
    pickups = pickup_crud.get_by_user(db, user_id=current_user.id)
    
    # Filter by status if provided
    if status:
        pickups = [p for p in pickups if p.status == status]
    
    # Convert SQLAlchemy models to Pydantic models
    # This is now handled by our custom JSON encoder
    return pickups

@router.get("/admin")
@cached_endpoint(
    namespace="pickups_admin",
    ttl=300,  # 5 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=300"
)
async def get_all_pickup_requests(
    request: Request,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> List[Any]:
    """
    Get all pickup requests (admin only).
    Optionally filter by status and/or user_id.
    
    - **status**: Optional filter by pickup status
    - **user_id**: Optional filter by user ID
    """
    # Get all pickup requests from database
    query = db.query(PickupRequest)
    
    # Apply filters
    if status:
        query = query.filter(PickupRequest.status == status)
    
    if user_id:
        query = query.filter(PickupRequest.user_id == user_id)
    
    # Convert SQLAlchemy models to Pydantic models
    # This is now handled by our custom JSON encoder
    return query.all()

@router.get("/timeslots", response_model=List[AvailableTimeSlots])
async def get_available_timeslots(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    days: int = Query(7, description="Number of days to check availability"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[AvailableTimeSlots]:
    """
    Get available time slots for scheduling pickups.
    
    - **start_date**: Start date to check availability (format: YYYY-MM-DD)
    - **days**: Number of days to check, default is 7
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Generate mock availability data
    # In a real application, this would check against existing appointments
    result = []
    for i in range(days):
        current_date = start + timedelta(days=i)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Get all pickup requests scheduled for this date
        scheduled_pickups = db.query(PickupRequest).filter(
            PickupRequest.scheduled_date >= current_date.replace(hour=0, minute=0, second=0),
            PickupRequest.scheduled_date < current_date.replace(hour=0, minute=0, second=0) + timedelta(days=1)
        ).all()
        
        # Count pickups per time slot
        slot_counts = {
            "09:00-12:00": 0,
            "13:00-16:00": 0,
            "17:00-20:00": 0
        }
        
        for pickup in scheduled_pickups:
            if pickup.time_slot in slot_counts:
                slot_counts[pickup.time_slot] += 1
        
        # Maximum 5 pickups per time slot
        slots = [
            AvailableTimeSlot(slot="09:00-12:00", available=slot_counts["09:00-12:00"] < 5),
            AvailableTimeSlot(slot="13:00-16:00", available=slot_counts["13:00-16:00"] < 5),
            AvailableTimeSlot(slot="17:00-20:00", available=slot_counts["17:00-20:00"] < 5)
        ]
        
        result.append(AvailableTimeSlots(date=date_str, slots=slots))
    
    return result

@router.get("/{pickup_id}")
async def get_pickup_request(
    pickup_id: int = Path(..., title="The ID of the pickup request"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a specific pickup request by ID.
    Regular users can only access their own pickup requests.
    Admin users can access any pickup request.
    """
    pickup = pickup_crud.get(db, pickup_id=pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found")
    
    # Check if user has permission to access this pickup request
    if pickup.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Convert SQLAlchemy model to Pydantic model
    # This is now handled by our custom JSON encoder
    return pickup

@router.put("/{pickup_id}")
async def update_pickup_request(
    pickup_id: int,
    pickup_in: PickupRequestUpdate,
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a pickup request.
    Regular users can only update their own pickup requests and only certain fields.
    Admin users can update any pickup request and all fields.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # Get the pickup request
    pickup = pickup_crud.get(db, pickup_id=pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found")
    
    # Check permissions
    if pickup.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If not admin, restrict fields that can be updated
    if current_user.role != 'admin':
        # Regular users can only update these fields
        allowed_fields = {"materials", "weight_estimate", "scheduled_date", "address", "time_slot",
                         "is_recurring", "recurrence_type", "recurrence_end_date"}
        
        # Remove restricted fields
        update_data = pickup_in.model_dump(exclude_unset=True)
        restricted_fields = set(update_data.keys()) - allowed_fields
        if restricted_fields:
            for field in restricted_fields:
                setattr(pickup_in, field, None)
    
    # Update pickup request
    pickup = pickup_crud.update(db, db_obj=pickup, obj_in=pickup_in)
    
    # Invalidate cache
    invalidate_namespace(f"pickups_user_{pickup.user_id}")
    invalidate_namespace("pickups_admin")
    
    # Convert SQLAlchemy model to Pydantic model
    # This is now handled by our custom JSON encoder
    return pickup

@router.delete("/{pickup_id}")
async def delete_pickup_request(
    pickup_id: int,
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Delete a pickup request.
    Regular users can only delete their own pickup requests.
    Admin users can delete any pickup request.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # Get the pickup request
    pickup = pickup_crud.get(db, pickup_id=pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found")
    
    # Check permissions
    if pickup.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Store user_id for cache invalidation
    user_id = pickup.user_id
    
    # Delete pickup request
    pickup_crud.delete(db, pickup_id=pickup_id)
    
    # Invalidate cache
    invalidate_namespace(f"pickups_user_{user_id}")
    invalidate_namespace("pickups_admin")
    
    return {"message": "Pickup request successfully deleted"}