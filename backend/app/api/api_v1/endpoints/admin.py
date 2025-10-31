from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List

from app.api.dependencies.auth import get_current_superuser
from app.models.user import User

router = APIRouter()

@router.get("/users")
async def list_users_admin(current_user: User = Depends(get_current_superuser)) -> Dict[str, Any]:
    """
    Admin: placeholder endpoint to satisfy RBAC tests.
    Returns a simple payload when accessed by admin; guarded by get_current_superuser.
    """
    return {"status": "ok", "endpoint": "admin/users"}

@router.get("/metrics")
async def admin_metrics(current_user: User = Depends(get_current_superuser)) -> Dict[str, Any]:
    """
    Admin: placeholder metrics endpoint.
    """
    return {"status": "ok", "endpoint": "admin/metrics"}

@router.get("/settings")
async def admin_settings(current_user: User = Depends(get_current_superuser)) -> Dict[str, Any]:
    """
    Admin: placeholder settings endpoint.
    """
    return {"status": "ok", "endpoint": "admin/settings"}
