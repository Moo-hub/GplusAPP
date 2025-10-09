"""
Custom JSON serialization utilities for SQLAlchemy models
"""
from typing import Any, Dict, List, Union
import json
from datetime import datetime, date
from enum import Enum
from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy.orm.collections import InstrumentedList
from sqlalchemy.orm import DeclarativeMeta


class EnhancedSQLAlchemyJSONEncoder(json.JSONEncoder):
    """
    Enhanced JSON encoder for SQLAlchemy objects with additional handling for complex types
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # identity-based set to detect circular references during a single encoding pass
        self._seen_ids = set()
    def default(self, obj: Any) -> Any:
        # Fast path for JSON-native primitives to avoid unnecessary recursion
        if obj is None or isinstance(obj, (str, int, float, bool)):
            return obj
        # Handle SQLAlchemy models first
        if hasattr(obj, "__class__") and hasattr(obj.__class__, "__mapper__"):
            # If SQLAlchemy model has a table
            if hasattr(obj, "__table__"):
                obj_id = id(obj)
                # If we've already visited this instance during this encoding pass,
                # return a short reference (avoid recursive traversal of relationships)
                if obj_id in self._seen_ids:
                    # Prefer an explicit id field when available
                    try:
                        return {"_ref": obj.__class__.__name__, "id": getattr(obj, "id", None)}
                    except Exception:
                        return {"_ref": obj.__class__.__name__}

                # Mark as seen and begin serialization
                self._seen_ids.add(obj_id)

                result = {}
                # Include all table columns
                for c in obj.__table__.columns:
                    result[c.name] = self.default(getattr(obj, c.name))
                
                # Include relationships (attributes in mapper but not in columns)
                if hasattr(obj, "__mapper__") and hasattr(obj.__mapper__, "attrs"):
                    for attr_name, attr in obj.__mapper__.attrs.items():
                        if attr_name not in result and hasattr(obj, attr_name):
                            result[attr_name] = self.default(getattr(obj, attr_name))
                    
                    # Finished serializing this instance; return result.
                    return result
                
        # Handle specific types
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, Enum):
            return obj.value
        elif isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, InstrumentedList):
            return [self.default(item) for item in obj]
        elif isinstance(obj, list):
            return [self.default(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: self.default(value) for key, value in obj.items()}
            
        # Try normal JSON serialization
        try:
            return super().default(obj)
        except Exception:
            # Last resort fallback
            try:
                return str(obj)
            except Exception:
                return None


class CustomJSONResponse(JSONResponse):
    """
    Custom JSON Response that handles SQLAlchemy models
    """
    def render(self, content: Any) -> bytes:
        return json.dumps(
            content,
            cls=EnhancedSQLAlchemyJSONEncoder,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")