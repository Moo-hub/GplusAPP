from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import Dict, Any, Optional

from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.core.security import validate_csrf_token
from app.core.redis_fastapi import cached_endpoint
from app.core.redis_cache import invalidate_namespace

router = APIRouter()

@router.get("/")
@cached_endpoint(
    namespace="user",
    ttl=1800,  # 30 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=1800, stale-while-revalidate=1800"
)
async def get_profile(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get user profile of the currently authenticated user
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "points": current_user.points,
        "address": getattr(current_user, "address", ""),
        "phone": getattr(current_user, "phone", "")
    }

@router.put("/")
async def update_profile(
    request: Request,
    profile_data: Dict[str, Any],
    x_csrf_token: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update user profile of the currently authenticated user
    Requires CSRF protection for mutation operations
    """
    # Validate CSRF token
    validate_csrf_token(request, x_csrf_token)
    
    # In a real implementation, we would update the database with the current user's data
    # For now, just return the data that was sent
    
    # Invalidate user cache after profile update
    invalidate_namespace("user")
    
    return {
        "id": current_user.id,
        "name": profile_data.get("name", current_user.name),
        "email": current_user.email,  # Email typically can't be changed this way
        "points": current_user.points,
        "address": profile_data.get("address", getattr(current_user, "address", "")),
        "phone": profile_data.get("phone", getattr(current_user, "phone", ""))
    }