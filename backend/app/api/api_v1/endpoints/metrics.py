"""
API performance and Redis metrics endpoint.
This module provides endpoints to retrieve Redis monitoring data
and API performance metrics for visualization in dashboards.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.dependencies import auth
from app.core.redis_monitoring import RedisMonitoringAlerts
from app.core.redis_memory_monitor import get_memory_pressure_level, get_memory_trend
from app.core.redis_client import get_redis_client
from app.core.redis_monitor import get_memory_usage_by_key_pattern, get_redis_info, get_redis_stats
from app.core.config import settings
from app.core.redis_fastapi import cached_endpoint

router = APIRouter()


@router.get("/redis/memory", summary="Get Redis memory metrics")
@cached_endpoint(
    namespace="metrics",
    ttl=300,  # Cache for 5 minutes
    cache_by_user=False,  # Public metrics
    public_cache=True,
    cache_control="public, max-age=300"
)
def get_redis_memory_metrics(request: Request) -> Dict[str, Any]:
    """
    Get Redis memory usage metrics including pressure level and trends.
    """
    redis_client = get_redis_client()
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis connection not available"
        )
        
    try:
        # Get Redis info
        info = get_redis_info()
        stats = get_redis_stats()
        
        if not info or not stats:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get Redis metrics"
            )
            
        # Calculate memory metrics
        memory_pressure = get_memory_pressure_level()
        trend_direction, trend_rate = get_memory_trend()
        
        # Format memory values
        used_memory_gb = float(info.get("used_memory", 0)) / (1024 * 1024 * 1024)
        max_memory_gb = float(info.get("maxmemory", 0)) / (1024 * 1024 * 1024)
        used_percent = (used_memory_gb / max_memory_gb) * 100 if max_memory_gb > 0 else 0
        
        return {
            "used_memory_gb": round(used_memory_gb, 2),
            "max_memory_gb": round(max_memory_gb, 2),
            "used_percent": round(used_percent, 2),
            "fragmentation_ratio": info.get("mem_fragmentation_ratio", 0),
            "connected_clients": info.get("connected_clients", 0),
            "pressure_level": memory_pressure,
            "trend": {
                "direction": trend_direction,
                "rate": trend_rate
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving Redis memory metrics: {str(e)}"
        )


@router.get("/redis/keys", summary="Get Redis key patterns usage")
def get_redis_key_patterns() -> Dict[str, Any]:
    """
    Get Redis memory usage by key pattern.
    """
    try:
        pattern_usage = get_memory_usage_by_key_pattern()
        
        # Convert bytes to MB for better visualization
        result = {}
        for pattern, bytes_usage in pattern_usage.items():
            result[pattern] = round(bytes_usage / (1024 * 1024), 2)  # MB
        
        return {
            "patterns": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving Redis key pattern usage: {str(e)}"
        )


@router.get("/api/performance", summary="Get API performance metrics")
def get_api_performance(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get API performance metrics including average response times,
    cache hit ratios, and endpoint performance.
    """
    try:
        # Placeholder for actual log parsing and metric collection
        # In a real implementation, we would parse the cache_performance.log file
        # and aggregate metrics by endpoint
        
        # Example of returning the data we'd extract from logs
        return {
            "overall": {
                "avg_response_time": 45.3,  # ms
                "cache_hit_ratio": 0.78,   # 78%
                "requests_per_minute": 120
            },
            "endpoints": [
                {
                    "path": "/api/v1/companies",
                    "avg_response_time": 38.2,
                    "cache_hit_ratio": 0.92,
                    "requests_count": 1520
                },
                {
                    "path": "/api/v1/pickups",
                    "avg_response_time": 67.4,
                    "cache_hit_ratio": 0.64,
                    "requests_count": 945
                },
                {
                    "path": "/api/v1/points",
                    "avg_response_time": 29.8,
                    "cache_hit_ratio": 0.88,
                    "requests_count": 2130
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving API performance metrics: {str(e)}"
        )


@router.get("/system/health", summary="Get system health metrics")
def get_system_health() -> Dict[str, Any]:
    """
    Get overall system health metrics including Redis and API status.
    """
    try:
        redis_client = get_redis_client()
        redis_connected = redis_client is not None
        
        # Perform a basic Redis operation to test connectivity
        if redis_connected:
            try:
                redis_client.ping()
                redis_status = "healthy"
            except:
                redis_status = "degraded"
        else:
            redis_status = "unavailable"
            
        # Return overall system health
        return {
            "services": {
                "redis": {
                    "status": redis_status,
                    "latency": 1.2  # ms, example value
                },
                "database": {
                    "status": "healthy",
                    "connections": 8,  # example value
                    "latency": 3.5  # ms, example value
                },
                "api": {
                    "status": "healthy"
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving system health metrics: {str(e)}"
        )