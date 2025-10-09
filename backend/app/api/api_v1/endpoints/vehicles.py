from fastapi import APIRouter, HTTPException, status, Depends, Header, Request
from typing import Dict, Any, List, Optional

from app.api.dependencies.auth import get_current_user, get_current_superuser
from app.models.user import User
from app.core.security import validate_csrf_token

router = APIRouter()

# Mock data - replace with database queries later
vehicles = [
    {
        "id": 1,
        "name": "Eco Truck 1",
        "type": "electric",
        "capacity": 1000,  # in kg
        "company_id": 1,
        "materials_handled": ["plastic", "paper"],
        "status": "available",
        "current_location": {
            "lat": 34.0522,
            "lng": -118.2437
        }
    },
    {
        "id": 2,
        "name": "Green Collector 2",
        "type": "hybrid",
        "capacity": 800,  # in kg
        "company_id": 2,
        "materials_handled": ["glass", "metal"],
        "status": "on_route",
        "current_location": {
            "lat": 34.0624,
            "lng": -118.3005
        }
    }
]

@router.get("/")
def get_vehicles(current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Get all available recycling vehicles
    Requires authentication
    """
    # If the user has a company role, filter vehicles by company_id
    if hasattr(current_user, "role") and current_user.role == "company":
        company_id = getattr(current_user, "company_id", None)
        if company_id:
            return [v for v in vehicles if v["company_id"] == company_id]
    
    # For regular users or admins, return all vehicles
    return vehicles

@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get details for a specific vehicle
    Requires authentication
    """
    # Find the requested vehicle
    vehicle = None
    for v in vehicles:
        if v["id"] == vehicle_id:
            vehicle = v
            break
            
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "VEHICLE_NOT_FOUND",
                "message": "Vehicle not found"
            }
        )
    
    # Check permissions for company users
    if hasattr(current_user, "role") and current_user.role == "company":
        company_id = getattr(current_user, "company_id", None)
        if company_id and vehicle["company_id"] != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PERMISSION_DENIED",
                    "message": "You don't have permission to access this vehicle"
                }
            )
    
    return vehicle

@router.get("/nearby")
def get_nearby_vehicles(
    lat: float,
    lng: float,
    radius: float = 5.0,
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get vehicles within a certain radius
    Requires authentication
    """
    # In a real implementation, this would use geospatial queries
    nearby_vehicles = [v for v in vehicles if v["status"] == "available"]
    
    # Apply company filtering for company users
    if hasattr(current_user, "role") and current_user.role == "company":
        company_id = getattr(current_user, "company_id", None)
        if company_id:
            nearby_vehicles = [v for v in nearby_vehicles if v["company_id"] == company_id]
    
    return nearby_vehicles
    
@router.post("/{vehicle_id}/update-location")
def update_vehicle_location(
    vehicle_id: int,
    location: Dict[str, float],
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    current_user: User = Depends(get_current_superuser)  # Only superusers or company admins can update location
) -> Dict[str, Any]:
    """
    Update a vehicle's location
    Requires superuser permissions and CSRF protection
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # Find the vehicle
    vehicle = None
    for idx, v in enumerate(vehicles):
        if v["id"] == vehicle_id:
            vehicle = v
            vehicle_idx = idx
            break
            
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "VEHICLE_NOT_FOUND",
                "message": "Vehicle not found"
            }
        )
    
    # Check company permissions if applicable
    if hasattr(current_user, "role") and current_user.role == "company":
        company_id = getattr(current_user, "company_id", None)
        if company_id and vehicle["company_id"] != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PERMISSION_DENIED",
                    "message": "You don't have permission to update this vehicle"
                }
            )
    
    # Update the location
    vehicles[vehicle_idx]["current_location"] = {
        "lat": location.get("lat", vehicle["current_location"]["lat"]),
        "lng": location.get("lng", vehicle["current_location"]["lng"])
    }
    
    return vehicles[vehicle_idx]