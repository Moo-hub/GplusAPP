"""
Redis cache statistics and management endpoint.
This module provides endpoints to retrieve Redis cache statistics
and manage cache entries.
"""

from typing import Dict, List, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_superuser
from app.db.session import SessionLocal
from app.db.session import get_db
from app.core.redis_client import get_redis_client
from app.models.user import User
from app.core.redis_cache import get_cache_stats, clear_cache_namespace, get_cache_keys

router = APIRouter()


@router.get("/stats", summary="Get Redis cache statistics")
async def get_cache_statistics(
    request: Request,
    current_user: User = Depends(get_current_active_superuser),
) -> Dict[str, Any]:
    """
    Get Redis cache usage statistics including hit/miss ratio, memory usage, 
    and cache entry counts per namespace.
    
    Only accessible to admin users.
    """
    redis_client = get_redis_client()
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis connection not available"
        )
        
    try:
        # Get cache statistics
        stats = get_cache_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve cache statistics: {str(e)}"
        )


@router.delete("/{namespace}", summary="Clear cache namespace")
async def clear_cache(
    namespace: str,
    request: Request,
    current_user: User = Depends(get_current_active_superuser),
) -> Dict[str, Any]:
    """
    Clear all cache entries for a specific namespace.
    
    Only accessible to admin users.
    """
    redis_client = get_redis_client()
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis connection not available"
        )
        
    try:
        # Clear the cache for the specified namespace
        deleted_count = clear_cache_namespace(namespace)
        return {
            "namespace": namespace,
            "deleted_keys": deleted_count,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/keys", summary="List cache keys")
async def list_cache_keys(
    namespace: Optional[str] = Query(None, description="Filter by namespace"),
    pattern: Optional[str] = Query(None, description="Key pattern to match"),
    limit: int = Query(100, description="Maximum number of keys to return"),
    current_user: User = Depends(get_current_active_superuser),
) -> Dict[str, Any]:
    """
    List cache keys matching the specified namespace and/or pattern.
    
    Only accessible to admin users.
    """
    redis_client = get_redis_client()
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis connection not available"
        )
        
    try:
        # Get cache keys matching the pattern
        keys = get_cache_keys(namespace, pattern, limit)
        return {
            "namespace": namespace,
            "pattern": pattern,
            "count": len(keys),
            "keys": keys
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list cache keys: {str(e)}"
        )