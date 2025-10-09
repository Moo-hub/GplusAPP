"""
JSON encoder utilities with Pydantic v2 compatibility.

This module provides safe JSON encoding for common Python types,
compatible with Pydantic v2's serialization approach.
"""
import json
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from enum import Enum
from pathlib import Path
from typing import Any
from uuid import UUID


def safe_json_encoder(obj: Any) -> Any:
    """
    Custom JSON encoder that safely handles common Python types.
    
    This encoder is compatible with Pydantic v2 and handles types
    that are not natively JSON serializable.
    
    Args:
        obj: The object to encode
        
    Returns:
        A JSON-serializable representation of the object
        
    Raises:
        TypeError: If the object type is not supported
    """
    # Handle datetime objects
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()
    
    # Handle timedelta
    if isinstance(obj, timedelta):
        return obj.total_seconds()
    
    # Handle Decimal
    if isinstance(obj, Decimal):
        # Return int if no decimal places, otherwise float
        if obj == obj.to_integral_value():
            return int(obj)
        return float(obj)
    
    # Handle UUID
    if isinstance(obj, UUID):
        return str(obj)
    
    # Handle Path
    if isinstance(obj, Path):
        return str(obj)
    
    # Handle Enum
    if isinstance(obj, Enum):
        return obj.value
    
    # Handle sets and frozensets
    if isinstance(obj, (set, frozenset)):
        return list(obj)
    
    # Handle bytes
    if isinstance(obj, bytes):
        return obj.decode('utf-8')
    
    # If we can't handle it, raise TypeError
    raise TypeError(f"Object of type '{type(obj).__name__}' is not JSON serializable")


def to_json(obj: Any, **kwargs) -> str:
    """
    Convert a Python object to JSON string using safe encoding.
    
    Args:
        obj: The object to serialize
        **kwargs: Additional arguments passed to json.dumps
        
    Returns:
        JSON string representation
    """
    return json.dumps(obj, default=safe_json_encoder, **kwargs)


def to_json_dict(obj: Any) -> dict:
    """
    Convert a Python object to a JSON-compatible dictionary.
    
    This is useful for preparing objects for JSON serialization
    without actually serializing to a string.
    
    Args:
        obj: The object to convert
        
    Returns:
        A dictionary with JSON-compatible values
    """
    if hasattr(obj, 'model_dump'):
        # Pydantic v2 models - get dict then recursively convert
        data = obj.model_dump(mode='json')
        return {k: _convert_value(v) for k, v in data.items()}
    elif hasattr(obj, 'dict'):
        # Pydantic v1 models (backward compatibility)
        data = obj.dict()
        return {k: _convert_value(v) for k, v in data.items()}
    elif isinstance(obj, dict):
        return {k: _convert_value(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_convert_value(item) for item in obj]
    else:
        return _convert_value(obj)


def _convert_value(value: Any) -> Any:
    """Helper to convert individual values to JSON-compatible types."""
    if isinstance(value, dict):
        return {k: _convert_value(v) for k, v in value.items()}
    elif isinstance(value, (list, tuple)):
        return [_convert_value(item) for item in value]
    elif isinstance(value, (str, int, float, bool, type(None))):
        return value
    else:
        # Use the encoder for complex types
        try:
            return safe_json_encoder(value)
        except TypeError:
            return value
