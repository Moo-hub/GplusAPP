# templates/backend_fastapi/app/utils/json_encoder.py

from typing import Any, Set
import json


def safe_json_encoder(obj: Any, seen_ids: Set[int] = None) -> Any:
    """
    JSON encoder with recursion prevention and type preservation.
    
    - Fast-path returns primitives unchanged (avoid stringifying numbers/booleans)
    - Tracks seen object ids to prevent RecursionError on cyclic SQLAlchemy relationships
    - Produces short `_ref` placeholders for already-seen ORM instances
    
    Args:
        obj: Object to encode
        seen_ids: Set of object ids already processed (for recursion detection)
    
    Returns:
        JSON-serializable representation of the object
    """
    if seen_ids is None:
        seen_ids = set()
    
    # Fast-path: return primitives unchanged
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj
    
    # Get object id for recursion tracking
    obj_id = id(obj)
    
    # Check for circular reference
    if obj_id in seen_ids:
        # Return a placeholder for already-seen objects
        if hasattr(obj, '__tablename__'):
            # SQLAlchemy model
            return {"_ref": f"{obj.__tablename__}#{obj_id}"}
        return {"_ref": f"circular#{obj_id}"}
    
    # Mark this object as seen
    seen_ids.add(obj_id)
    
    try:
        # Handle common types
        if isinstance(obj, dict):
            return {k: safe_json_encoder(v, seen_ids) for k, v in obj.items()}
        
        if isinstance(obj, (list, tuple)):
            return [safe_json_encoder(item, seen_ids) for item in obj]
        
        # Handle SQLAlchemy models or objects with __dict__
        if hasattr(obj, '__dict__'):
            # Filter out SQLAlchemy internal attributes
            result = {}
            for key, value in obj.__dict__.items():
                if not key.startswith('_'):
                    try:
                        result[key] = safe_json_encoder(value, seen_ids)
                    except (TypeError, ValueError):
                        # Skip attributes that can't be serialized
                        result[key] = str(value)
            return result
        
        # Try to convert to string as last resort
        return str(obj)
    
    finally:
        # Remove from seen set when done processing this branch
        seen_ids.discard(obj_id)


def dumps(obj: Any, **kwargs) -> str:
    """
    JSON dumps with safe encoding.
    
    Args:
        obj: Object to serialize
        **kwargs: Additional arguments passed to json.dumps
    
    Returns:
        JSON string
    """
    encoded = safe_json_encoder(obj)
    return json.dumps(encoded, **kwargs)


def loads(s: str, **kwargs) -> Any:
    """
    JSON loads wrapper for consistency.
    
    Args:
        s: JSON string to parse
        **kwargs: Additional arguments passed to json.loads
    
    Returns:
        Parsed JSON object
    """
    return json.loads(s, **kwargs)
