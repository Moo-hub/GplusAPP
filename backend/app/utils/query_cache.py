"""
Query caching utilities for improved performance
"""
from typing import Any, Dict, List, Optional, Callable, TypeVar, cast
from functools import wraps
import hashlib
import json
import logging
import time
from datetime import timedelta

from sqlalchemy.orm import Session

# Configure logging
logger = logging.getLogger("query_cache")
logger.setLevel(logging.INFO)

# Add a handler to write to query cache log file
file_handler = logging.FileHandler(filename="logs/query_cache.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Redis client setup - reusing existing Redis connection from app.core.redis_cache
try:
    from app.core.redis_cache import redis_client
    CACHE_ENABLED = True
except ImportError:
    logger.warning("Redis client not available. Query caching disabled.")
    CACHE_ENABLED = False

# Define type variables
T = TypeVar('T')
FuncType = Callable[..., T]

def cached_query(ttl: int = 300) -> Callable[[FuncType[T]], FuncType[T]]:
    """
    Decorator for caching expensive database queries
    
    Args:
        ttl: Time to live for cached results in seconds (default: 5 minutes)
        
    Returns:
        Decorated function
        
    Example:
    ```python
    @cached_query(ttl=600)  # Cache for 10 minutes
    def get_user_stats(db: Session, user_id: int) -> Dict:
        # Expensive query...
        return stats
    ```
    """
    def decorator(func: FuncType[T]) -> FuncType[T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            if not CACHE_ENABLED:
                return func(*args, **kwargs)
                
            # Create cache key from function name and arguments
            cache_key = f"query_cache:{func.__name__}:{_generate_args_hash(args, kwargs)}"
            
            # Try to get from cache first
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for {func.__name__}")
                return json.loads(cached_result)
                
            # Cache miss - execute query and store result
            start_time = time.time()
            result = func(*args, **kwargs)
            query_time = time.time() - start_time
            
            try:
                # Serialize and store in cache
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result)
                )
                logger.info(f"Cached query {func.__name__} ({query_time:.4f}s)")
            except Exception as e:
                logger.error(f"Error caching query result: {e}")
                
            return result
        return cast(FuncType[T], wrapper)
    return decorator

def _generate_args_hash(args: tuple, kwargs: Dict[str, Any]) -> str:
    """
    Generate a hash from function arguments
    
    Args:
        args: Positional arguments
        kwargs: Keyword arguments
        
    Returns:
        Hash string representing the arguments
    """
    # Convert args and kwargs to a string representation
    args_str = json.dumps([str(arg) for arg in args], sort_keys=True)
    kwargs_str = json.dumps({k: str(v) for k, v in kwargs.items()}, sort_keys=True)
    
    # Create hash
    hash_input = f"{args_str}:{kwargs_str}"
    return hashlib.md5(hash_input.encode()).hexdigest()

def invalidate_query_cache(prefix: str) -> int:
    """
    Invalidate cached query results by prefix
    
    Args:
        prefix: Cache key prefix to invalidate
        
    Returns:
        Number of keys invalidated
    """
    if not CACHE_ENABLED:
        return 0
        
    # Find all matching keys
    pattern = f"query_cache:{prefix}*"
    keys = redis_client.keys(pattern)
    
    # Delete keys
    if keys:
        count = len(keys)
        redis_client.delete(*keys)
        logger.info(f"Invalidated {count} cached queries with prefix: {prefix}")
        return count
    return 0

class QueryTimer:
    """
    Context manager for timing database queries
    
    Example:
    ```python
    with QueryTimer("get_user_stats"):
        result = db.query(User).filter(User.id == user_id).first()
    ```
    """
    def __init__(self, query_name: str):
        self.query_name = query_name
        self.start_time = 0
        
    def __enter__(self) -> "QueryTimer":
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        duration = time.time() - self.start_time
        logger.info(f"Query [{self.query_name}] took {duration:.4f} seconds")
        
        # Log slow queries
        if duration > 1.0:
            logger.warning(f"SLOW QUERY: [{self.query_name}] took {duration:.4f} seconds")