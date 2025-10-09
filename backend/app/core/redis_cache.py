"""
Redis caching module for optimized data access.
This module provides functions for caching frequently accessed data in Redis
with proper key namespacing, TTL management, and cache invalidation strategies.
"""

import json
import logging
import time
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union, Callable
from functools import wraps

import redis
from pydantic import BaseModel

from app.core.config import settings

# Configure logging
logger = logging.getLogger("redis_cache")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis caching log file
file_handler = logging.FileHandler(filename="logs/redis_cache.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Redis client for caching
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL)
    logger.info(f"Connected to Redis cache at {settings.REDIS_URL}")
except Exception as e:
    logger.error(f"Failed to connect to Redis cache: {e}")
    redis_client = None

# Cache configuration
CACHE_CONFIG = {
    # Key namespace prefixes
    "namespaces": {
        "user": "cache:user:",
        "pickup": "cache:pickup:",
        "recycling": "cache:recycling:",
        "points": "cache:points:",
        "stats": "cache:stats:",
        "general": "cache:general:"
    },
    
    # Default TTL values (in seconds)
    "ttl": {
        "user": 3600,           # 1 hour for user data
        "pickup": 300,          # 5 minutes for pickup data
        "recycling": 1800,      # 30 minutes for recycling data
        "points": 1800,         # 30 minutes for points data
        "stats": 300,           # 5 minutes for statistics
        "general": 1800,        # 30 minutes for general data
        "default": 600          # 10 minutes default
    },
    
    # Maximum item sizes (in bytes)
    "max_size": {
        "default": 1024 * 500,  # 500KB max size for any cached item
    },
    
    # Cache metrics
    "metrics": {
        "enabled": True,
        "samples_to_keep": 1000,  # Keep last 1000 operations for hit rate calculation
    }
}


class CacheMetrics(BaseModel):
    """Model for cache metrics"""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    invalidations: int = 0
    errors: int = 0
    hit_rate: float = 0.0
    last_reset: datetime = datetime.utcnow()


# Global metrics object
cache_metrics = CacheMetrics()


def generate_cache_key(namespace: str, identifier: str, params: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate a standardized cache key with namespace and optional parameters hash
    
    Args:
        namespace: The cache namespace (e.g., "user", "pickup")
        identifier: The primary identifier (e.g., user_id, pickup_id)
        params: Optional parameters to include in the key (for query variations)
        
    Returns:
        A properly formatted cache key
    """
    # Get the namespace prefix
    prefix = CACHE_CONFIG["namespaces"].get(namespace, CACHE_CONFIG["namespaces"]["general"])
    
    # Base key with namespace and identifier
    key = f"{prefix}{identifier}"
    
    # If we have params, append a hash of them
    if params:
        # Convert params to a sorted, deterministic string representation and hash
        params_str = json.dumps(params, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        key = f"{key}:{params_hash}"
    
    return key


def set_cache_value(
    key: str, 
    value: Any, 
    ttl: Optional[int] = None,
    namespace: Optional[str] = None
) -> bool:
    """
    Store a value in the Redis cache with appropriate TTL
    
    Args:
        key: The cache key (will be used as-is if namespace is None)
        value: The value to store (will be JSON serialized)
        ttl: Time-to-live in seconds, or None to use default for namespace
        namespace: Optional namespace to determine default TTL
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
        
    try:
        # Determine the TTL to use
        if ttl is None and namespace:
            ttl = CACHE_CONFIG["ttl"].get(namespace, CACHE_CONFIG["ttl"]["default"])
        elif ttl is None:
            ttl = CACHE_CONFIG["ttl"]["default"]
        
        # Serialize the value to JSON
        serialized_value = json.dumps(value)
        
        # Check if size exceeds maximum
        value_size = len(serialized_value.encode('utf-8'))
        if value_size > CACHE_CONFIG["max_size"]["default"]:
            logger.warning(f"Cache value for key '{key}' exceeds maximum size ({value_size} bytes)")
            return False
        
        # Store in Redis with TTL
        redis_client.setex(key, ttl, serialized_value)
        
        # Update metrics
        if CACHE_CONFIG["metrics"]["enabled"]:
            cache_metrics.sets += 1
        
        return True
    except Exception as e:
        logger.error(f"Error setting cache value for key '{key}': {e}")
        if CACHE_CONFIG["metrics"]["enabled"]:
            cache_metrics.errors += 1
        return False


def get_cache_value(key: str) -> Tuple[bool, Any]:
    """
    Retrieve a value from the Redis cache
    
    Args:
        key: The cache key
        
    Returns:
        Tuple of (success, value)
        If success is False, value will be None
    """
    if not redis_client:
        return False, None
        
    try:
        # Get the value from Redis
        cached_value = redis_client.get(key)
        
        if cached_value:
            # Update metrics
            if CACHE_CONFIG["metrics"]["enabled"]:
                cache_metrics.hits += 1
            
            # Parse JSON and return
            return True, json.loads(cached_value)
        else:
            # Update metrics
            if CACHE_CONFIG["metrics"]["enabled"]:
                cache_metrics.misses += 1
            
            return False, None
    except Exception as e:
        logger.error(f"Error getting cache value for key '{key}': {e}")
        if CACHE_CONFIG["metrics"]["enabled"]:
            cache_metrics.errors += 1
        return False, None


def invalidate_cache(key: str) -> bool:
    """
    Invalidate (delete) a specific cache key
    
    Args:
        key: The cache key to invalidate
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
        
    try:
        result = redis_client.delete(key)
        
        # Update metrics
        if CACHE_CONFIG["metrics"]["enabled"] and result > 0:
            cache_metrics.invalidations += 1
            
        return result > 0
    except Exception as e:
        logger.error(f"Error invalidating cache key '{key}': {e}")
        if CACHE_CONFIG["metrics"]["enabled"]:
            cache_metrics.errors += 1
        return False


def invalidate_namespace(namespace: str) -> int:
    """
    Invalidate all keys in a namespace
    
    Args:
        namespace: The namespace to invalidate
        
    Returns:
        Number of keys invalidated
    """
    if not redis_client:
        return 0
        
    try:
        # Get the namespace prefix
        prefix = CACHE_CONFIG["namespaces"].get(namespace, CACHE_CONFIG["namespaces"]["general"])
        
        # Find all keys with this prefix
        cursor = '0'
        deleted_count = 0
        
        while cursor != 0:
            cursor, keys = redis_client.scan(cursor=cursor, match=f"{prefix}*", count=1000)
            if keys:
                deleted_count += redis_client.delete(*keys)
        
        # Update metrics
        if CACHE_CONFIG["metrics"]["enabled"] and deleted_count > 0:
            cache_metrics.invalidations += deleted_count
            
        logger.info(f"Invalidated {deleted_count} keys in namespace '{namespace}'")
        return deleted_count
    except Exception as e:
        logger.error(f"Error invalidating namespace '{namespace}': {e}")
        if CACHE_CONFIG["metrics"]["enabled"]:
            cache_metrics.errors += 1
        return 0


def get_cache_metrics() -> Dict[str, Any]:
    """
    Get current cache metrics
    
    Returns:
        Dictionary with cache metrics
    """
    if CACHE_CONFIG["metrics"]["enabled"]:
        total_ops = cache_metrics.hits + cache_metrics.misses
        hit_rate = (cache_metrics.hits / total_ops) * 100 if total_ops > 0 else 0
        
        return {
            "hits": cache_metrics.hits,
            "misses": cache_metrics.misses, 
            "hit_rate": hit_rate,
            "sets": cache_metrics.sets,
            "invalidations": cache_metrics.invalidations,
            "errors": cache_metrics.errors,
            "last_reset": cache_metrics.last_reset.isoformat()
        }
    else:
        return {"enabled": False}


def reset_cache_metrics() -> None:
    """Reset all cache metrics"""
    global cache_metrics
    cache_metrics = CacheMetrics(last_reset=datetime.utcnow())
    logger.info("Cache metrics have been reset")


def cached(
    namespace: str,
    ttl: Optional[int] = None,
    key_builder: Optional[Callable] = None
):
    """
    Decorator for caching function results in Redis
    
    Args:
        namespace: The cache namespace to use
        ttl: Optional override for TTL (seconds)
        key_builder: Optional function to build cache key from function arguments
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate the cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key format: namespace:function_name:args_hash
                func_name = func.__name__
                all_args = list(args) + list(kwargs.items())
                args_str = json.dumps(str(all_args), sort_keys=True)
                args_hash = hashlib.md5(args_str.encode()).hexdigest()[:8]
                cache_key = generate_cache_key(namespace, f"{func_name}", {"args": args_hash})
            
            # Try to get from cache first
            found, cached_result = get_cache_value(cache_key)
            if found:
                return cached_result
            
            # Execute the function
            result = await func(*args, **kwargs)
            
            # Cache the result
            set_cache_value(cache_key, result, ttl, namespace)
            
            return result
            
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate the cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key format: namespace:function_name:args_hash
                func_name = func.__name__
                all_args = list(args) + list(kwargs.items())
                args_str = json.dumps(str(all_args), sort_keys=True)
                args_hash = hashlib.md5(args_str.encode()).hexdigest()[:8]
                cache_key = generate_cache_key(namespace, f"{func_name}", {"args": args_hash})
            
            # Try to get from cache first
            found, cached_result = get_cache_value(cache_key)
            if found:
                return cached_result
            
            # Execute the function
            result = func(*args, **kwargs)
            
            # Cache the result
            set_cache_value(cache_key, result, ttl, namespace)
            
            return result
        
        # Return the appropriate wrapper based on whether the function is async
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
            
    return decorator


def get_cache_stats() -> Dict[str, Any]:
    """
    Get Redis cache usage statistics.
    
    Returns:
        Dictionary with cache statistics including hit rate, memory usage, etc.
    """
    if not redis_client:
        logger.error("Redis client not available")
        return {
            "status": "error",
            "message": "Redis client not available"
        }
        
    try:
        # Get Redis info
        info = redis_client.info()
        
        # Get hit/miss stats
        hits = redis_client.info().get("keyspace_hits", 0)
        misses = redis_client.info().get("keyspace_misses", 0)
        total_ops = hits + misses
        hit_rate = (hits / total_ops) * 100 if total_ops > 0 else 0
        
        # Get memory usage
        used_memory = info.get("used_memory", 0)
        used_memory_human = info.get("used_memory_human", "unknown")
        
        # Get key counts by namespace
        namespaces = CACHE_CONFIG["namespaces"]
        namespace_counts = {}
        
        for ns_name, ns_prefix in namespaces.items():
            key_count = len(redis_client.keys(f"{ns_prefix}*"))
            namespace_counts[ns_name] = key_count
            
        # Return stats dictionary
        return {
            "status": "success",
            "hit_rate": round(hit_rate, 2),
            "hits": hits,
            "misses": misses,
            "memory_used": used_memory,
            "memory_used_human": used_memory_human,
            "total_keys": redis_client.dbsize(),
            "namespaces": namespace_counts,
            "uptime": info.get("uptime_in_seconds", 0)
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def clear_cache_namespace(namespace: str) -> int:
    """
    Clear all cache entries for a specific namespace.
    
    Args:
        namespace: The cache namespace to clear
        
    Returns:
        Number of keys deleted
    """
    if not redis_client:
        logger.error("Redis client not available")
        return 0
        
    try:
        # Get the namespace prefix
        ns_prefix = CACHE_CONFIG["namespaces"].get(namespace)
        if not ns_prefix:
            logger.warning(f"Unknown namespace: {namespace}")
            return 0
            
        # Get all keys in namespace
        pattern = f"{ns_prefix}*"
        keys = redis_client.keys(pattern)
        
        # Delete keys if any found
        if keys:
            deleted = redis_client.delete(*keys)
            logger.info(f"Deleted {deleted} keys from namespace {namespace}")
            return deleted
        return 0
    except Exception as e:
        logger.error(f"Error clearing cache namespace {namespace}: {e}")
        return 0


def get_cache_keys(namespace: Optional[str] = None, pattern: Optional[str] = None, limit: int = 100) -> List[str]:
    """
    Get cache keys matching the specified namespace and/or pattern.
    
    Args:
        namespace: Optional namespace to filter by
        pattern: Optional pattern to match within keys
        limit: Maximum number of keys to return
        
    Returns:
        List of matching keys
    """
    if not redis_client:
        logger.error("Redis client not available")
        return []
        
    try:
        # Determine the search pattern
        search_pattern = "*"
        
        if namespace:
            ns_prefix = CACHE_CONFIG["namespaces"].get(namespace)
            if ns_prefix:
                search_pattern = f"{ns_prefix}*"
            else:
                logger.warning(f"Unknown namespace: {namespace}")
                return []
                
        if pattern:
            if namespace:
                search_pattern = f"{ns_prefix}*{pattern}*"
            else:
                search_pattern = f"*{pattern}*"
                
        # Get keys matching the pattern
        keys = redis_client.keys(search_pattern)
        
        # Limit the number of keys returned
        return [key.decode('utf-8') if isinstance(key, bytes) else key for key in keys[:limit]]
    except Exception as e:
        logger.error(f"Error getting cache keys: {e}")
        return []