"""
FastAPI-specific Redis caching utilities.
This module provides decorators and tools for caching FastAPI endpoint responses.
"""

import json
import hashlib
import inspect
import logging
from typing import Any, Callable, Dict, List, Optional, Type, Union
from functools import wraps
from datetime import datetime

from fastapi import Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import DeclarativeMeta
from starlette.responses import Response as StarletteResponse
from pydantic import BaseModel

from app.core.redis_cache import (
    generate_cache_key,
    get_cache_value,
    set_cache_value,
    CACHE_CONFIG
)

# Configure logging
logger = logging.getLogger("redis_fastapi")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis caching log file
file_handler = logging.FileHandler(filename="logs/redis_cache.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

class SQLAlchemyJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that can handle SQLAlchemy model instances."""
    def default(self, obj):
        # Check if object is a SQLAlchemy model instance
        if hasattr(obj, "__class__") and hasattr(obj.__class__, "__mapper__"):
            result = {}
            for column in obj.__table__.columns:
                value = getattr(obj, column.name)
                # Handle datetime objects specially
                if isinstance(value, datetime):
                    result[column.name] = value.isoformat()
                else:
                    result[column.name] = value
            return result
        # Handle datetime objects
        elif isinstance(obj, datetime):
            return obj.isoformat()
        # Let the base encoder handle it otherwise
        return super().default(obj)

def convert_sqlalchemy_to_dict(obj):
    """Convert SQLAlchemy model instances to dictionaries."""
    if isinstance(obj, list):
        return [convert_sqlalchemy_to_dict(item) for item in obj]
    
    # Check if object is a SQLAlchemy model instance
    if hasattr(obj, "__class__") and hasattr(obj.__class__, "__mapper__"):
        result = {}
        for column in obj.__table__.columns:
            value = getattr(obj, column.name)
            # Handle datetime objects specially
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result
    
    return obj


def cached_endpoint(
    namespace: str,
    ttl: Optional[int] = None,
    vary_headers: Optional[List[str]] = None,
    vary_query_params: Optional[List[str]] = None,
    exclude_from_cache: Optional[List[str]] = None,
    cache_by_user: bool = True,
    response_model: Optional[Type[BaseModel]] = None,
    cache_control: Optional[str] = None,
    public_cache: bool = False,
):
    """
    Decorator for caching FastAPI endpoint responses.
    
    Args:
        namespace: The cache namespace to use (e.g. "pickup", "user")
        ttl: Optional override for TTL (seconds)
        vary_headers: List of HTTP headers to vary cache by
        vary_query_params: List of query parameters to vary cache by
        exclude_from_cache: List of query parameters to exclude from cache key
        cache_by_user: Whether to vary cache by user ID (default: True)
        response_model: Optional Pydantic model to validate and convert cached data
        cache_control: Optional explicit cache-control header to set
        public_cache: Whether the cache should be public (True) or private (False)
        
    Returns:
        Decorated endpoint function
    """
    def decorator(func: Callable) -> Callable:
        # Store original response_model to use for validation when retrieving from cache
        endpoint_response_model = response_model
        
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract request and response objects from kwargs
            request = kwargs.get('request')
            if not request:
                # Find request in args
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if not request:
                logger.warning(f"No request object found for endpoint {func.__name__}, caching disabled")
                return await func(*args, **kwargs)
            
            # Get user ID for cache key if enabled
            user_id = None
            if cache_by_user:
                # Try to get current_user from kwargs
                current_user = kwargs.get('current_user')
                if current_user and hasattr(current_user, 'id'):
                    user_id = current_user.id
            
            # Build cache key components
            cache_key_parts = {
                "endpoint": func.__name__,
            }
            
            # Add path params to cache key
            path_params = request.path_params
            if path_params:
                cache_key_parts["path"] = path_params
            
            # Add specified query params to cache key if they exist
            if vary_query_params:
                query_params = {}
                for param in vary_query_params:
                    value = request.query_params.get(param)
                    if value is not None:
                        query_params[param] = value
                
                if query_params:
                    cache_key_parts["query"] = query_params
            
            # Add specified headers to cache key if they exist
            if vary_headers:
                headers = {}
                for header in vary_headers:
                    value = request.headers.get(header)
                    if value is not None:
                        headers[header] = value
                
                if headers:
                    cache_key_parts["headers"] = headers
            
            # Add user ID to cache key if available and enabled
            if user_id:
                cache_key_parts["user_id"] = str(user_id)
            
            # Generate final cache key
            cache_key_str = json.dumps(cache_key_parts, sort_keys=True)
            cache_key_hash = hashlib.md5(cache_key_str.encode()).hexdigest()
            cache_key = generate_cache_key(namespace, f"endpoint:{func.__name__}", {"key": cache_key_hash})
            
            # Try to get from cache first
            found, cached_data = get_cache_value(cache_key)
            if found:
                logger.debug(f"Cache hit for {func.__name__} - key: {cache_key}")
                
                # For FastAPI responses, add cache hit header
                response = Response(content=None, media_type="application/json")
                response.headers["X-Cache-Hit"] = "true"
                
                # Use JSONResponse for cached data
                response = JSONResponse(content=cached_data)
                response.headers["X-Cache-Hit"] = "true"
                
                # Set cache-control headers if specified
                if cache_control:
                    response.headers["Cache-Control"] = cache_control
                elif ttl:
                    # Set cache-control based on TTL
                    cache_visibility = "public" if public_cache else "private"
                    response.headers["Cache-Control"] = f"{cache_visibility}, max-age={ttl}, stale-while-revalidate={ttl//2}"
                
                return response
                
                # Otherwise, return the cached data directly as JSONResponse
                response = JSONResponse(content=cached_data)
                response.headers["X-Cache-Hit"] = "true"
                
                # Set cache-control headers if specified
                if cache_control:
                    response.headers["Cache-Control"] = cache_control
                elif ttl:
                    # Set cache-control based on TTL
                    cache_visibility = "public" if public_cache else "private"
                    response.headers["Cache-Control"] = f"{cache_visibility}, max-age={ttl}, stale-while-revalidate={ttl//2}"
                    
                return response
            
            # Cache miss, execute the endpoint
            logger.debug(f"Cache miss for {func.__name__} - key: {cache_key}")
            response = await func(*args, **kwargs)
            
            # Only cache if the response is successful (status_code < 400)
            if isinstance(response, (dict, list, BaseModel, StarletteResponse, JSONResponse)):
                status_code = 200
                response_data = response
                
                # Handle different response types
                if isinstance(response, StarletteResponse):
                    status_code = response.status_code
                    # Try to extract JSON from response if possible
                    try:
                        response_data = json.loads(response.body)
                    except:
                        # If we can't extract data, we can't cache it
                        response.headers["X-Cache-Hit"] = "false"
                        return response
                
                if status_code < 400:
                    try:
                        # Try to use the custom JSON encoder for SQLAlchemy models
                        if hasattr(response_data, "__class__") and hasattr(response_data.__class__, "__mapper__"):
                            response_json = json.dumps(response_data, cls=SQLAlchemyJSONEncoder)
                            response_data = json.loads(response_json)
                        elif isinstance(response_data, list) and response_data and hasattr(response_data[0].__class__, "__mapper__"):
                            response_json = json.dumps(response_data, cls=SQLAlchemyJSONEncoder)
                            response_data = json.loads(response_json)
                        # Convert Pydantic models to dict for caching
                        elif isinstance(response_data, BaseModel):
                            # Pydantic v2
                            if hasattr(response_data, "model_dump"):
                                response_data = response_data.model_dump()
                            else:
                                response_data = response_data.dict()
                    except Exception as e:
                        logger.error(f"Error serializing response for cache: {e}")
                        # Fall back to direct conversion for non-SQLAlchemy objects
                        response_data = convert_sqlalchemy_to_dict(response_data)
                    
                    # Cache the response
                    set_cache_value(cache_key, response_data, ttl, namespace)
            
            # Add cache miss header and cache control if needed
            if isinstance(response, StarletteResponse):
                response.headers["X-Cache-Hit"] = "false"
                
                # Set cache-control headers if specified and not already set
                if "Cache-Control" not in response.headers:
                    if cache_control:
                        response.headers["Cache-Control"] = cache_control
                    elif ttl:
                        # Set cache-control based on TTL
                        cache_visibility = "public" if public_cache else "private"
                        response.headers["Cache-Control"] = f"{cache_visibility}, max-age={ttl}, stale-while-revalidate={ttl//2}"
            elif isinstance(response, (dict, list, BaseModel)):
                try:
                    # Try to convert SQLAlchemy models to dict first
                    if hasattr(response, "__class__") and hasattr(response.__class__, "__mapper__"):
                        response_json = json.dumps(response, cls=SQLAlchemyJSONEncoder)
                        response_data = json.loads(response_json)
                    elif isinstance(response, list) and response and hasattr(response[0].__class__, "__mapper__"):
                        response_json = json.dumps(response, cls=SQLAlchemyJSONEncoder)
                        response_data = json.loads(response_json)
                    else:
                        response_data = response
                        
                        # Convert Pydantic models to dict
                        if isinstance(response_data, BaseModel):
                            response_data = (
                                response_data.model_dump() if hasattr(response_data, "model_dump") else response_data.dict()
                            )
                    
                    # Create JSONResponse
                    response = JSONResponse(content=response_data)
                except Exception as e:
                    logger.error(f"Error converting response to JSON: {e}")
                    # Fall back to direct conversion for non-SQLAlchemy objects
                    if isinstance(response, BaseModel):
                        payload = response.model_dump() if hasattr(response, "model_dump") else response.dict()
                        response = JSONResponse(content=payload)
                    else:
                        response = JSONResponse(content=convert_sqlalchemy_to_dict(response))
                
                response.headers["X-Cache-Hit"] = "false"
                
                # Set cache-control headers
                if cache_control:
                    response.headers["Cache-Control"] = cache_control
                elif ttl:
                    # Set cache-control based on TTL
                    cache_visibility = "public" if public_cache else "private"
                    response.headers["Cache-Control"] = f"{cache_visibility}, max-age={ttl}, stale-while-revalidate={ttl//2}"
            
            return response
        
        # Check if the endpoint is async or not
        if not inspect.iscoroutinefunction(func):
            # If it's not async, we need to wrap it differently
            @wraps(func)
            def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                logger.warning(f"Sync endpoint {func.__name__} detected, caching may not work as expected")
                return func(*args, **kwargs)
            
            return sync_wrapper
        
        return wrapper
    return decorator