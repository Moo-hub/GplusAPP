"""
Redis cache invalidation module.
This module provides functions for automatically invalidating cache entries
when underlying data changes in the database.
"""

import logging
from typing import Any, Dict, List, Optional, Set, Union, Callable

from app.core.redis_cache import invalidate_cache, invalidate_namespace, generate_cache_key, redis_client
from app.core.config import settings

# Configure logging
logger = logging.getLogger("redis_cache_invalidation")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis cache invalidation log file
file_handler = logging.FileHandler(filename="logs/redis_cache_invalidation.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Mapping of model/entity types to affected cache keys
# This helps determine which cache keys to invalidate when a specific entity changes
INVALIDATION_MAPPING = {
    "user": {
        "namespaces": ["user"],
        "related": ["points"],
        "dependencies": []
    },
    "pickup_request": {
        "namespaces": ["pickup"],
        "related": ["user", "stats"],
        "dependencies": ["user"]
    },
    "recycling_item": {
        "namespaces": ["recycling"],
        "related": ["stats"],
        "dependencies": []
    },
    "points_transaction": {
        "namespaces": ["points"],
        "related": ["user", "stats"],
        "dependencies": ["user"]
    }
}


def invalidate_entity(entity_type: str, entity_id: str, invalidate_related: bool = True) -> int:
    """
    Invalidate cache entries for a specific entity
    
    Args:
        entity_type: Type of entity (e.g., "user", "pickup_request")
        entity_id: ID of the entity
        invalidate_related: Whether to invalidate related cache entries
        
    Returns:
        Number of cache entries invalidated
    """
    invalidated_count = 0
    
    try:
        # Check if we have invalidation mapping for this entity type
        if entity_type not in INVALIDATION_MAPPING:
            logger.warning(f"No invalidation mapping for entity type '{entity_type}'")
            return 0
        
        mapping = INVALIDATION_MAPPING[entity_type]
        
        # Invalidate primary namespace cache keys
        for namespace in mapping["namespaces"]:
            key = generate_cache_key(namespace, entity_id)
            if invalidate_cache(key):
                invalidated_count += 1
            
            # Also invalidate any keys with this entity_id as prefix (for variations)
            prefix_key = f"{key}:"
            cursor = '0'
            while cursor != 0:
                cursor, keys = redis_client.scan(cursor=cursor, match=f"{prefix_key}*", count=100)
                if keys:
                    for key in keys:
                        if invalidate_cache(key.decode('utf-8')):
                            invalidated_count += 1
        
        # Invalidate related namespaces if requested
        if invalidate_related:
            for related_namespace in mapping["related"]:
                # We don't invalidate the entire namespace, just specific keys that might be affected
                # For stats, we invalidate all stats that might be affected
                if related_namespace == "stats":
                    stats_key = generate_cache_key("stats", entity_type)
                    if invalidate_cache(stats_key):
                        invalidated_count += 1
                
                    # Also invalidate any variations
                    stats_prefix = f"{stats_key}:"
                    cursor = '0'
                    while cursor != 0:
                        cursor, keys = redis_client.scan(cursor=cursor, match=f"{stats_prefix}*", count=100)
                        if keys:
                            for key in keys:
                                if invalidate_cache(key.decode('utf-8')):
                                    invalidated_count += 1
        
        logger.info(f"Invalidated {invalidated_count} cache entries for {entity_type} {entity_id}")
        return invalidated_count
    except Exception as e:
        logger.error(f"Error invalidating cache for {entity_type} {entity_id}: {e}")
        return invalidated_count


def register_db_event_handlers(app=None):
    """
    Register database event handlers for automatic cache invalidation
    This function should be called at application startup
    
    Different ORMs have different event systems, so we'll need to adapt this
    for the specific ORM being used in the application.
    """
    logger.info("Setting up cache invalidation event handlers")
    
    # SQLAlchemy specific implementation would go here
    # For example, listening for after_update and after_delete events
    
    try:
        from sqlalchemy import event
        from app.db.base_class import Base
        from app.models.user import User
        from app.models.pickup_request import PickupRequest
        from app.models.recycling_item import RecyclingItem
        from app.models.points_transaction import PointsTransaction
        
        # Map SQLAlchemy models to entity types
        model_to_entity = {
            User: "user",
            PickupRequest: "pickup_request",
            RecyclingItem: "recycling_item",
            PointsTransaction: "points_transaction"
        }
        
        def after_update_handler(mapper, connection, target):
            """Handle after_update events"""
            entity_type = model_to_entity.get(target.__class__, None)
            if entity_type:
                entity_id = str(target.id)
                invalidate_entity(entity_type, entity_id)
        
        def after_delete_handler(mapper, connection, target):
            """Handle after_delete events"""
            entity_type = model_to_entity.get(target.__class__, None)
            if entity_type:
                entity_id = str(target.id)
                invalidate_entity(entity_type, entity_id)
        
        # Register events for each model
        for model, entity_type in model_to_entity.items():
            event.listen(model, 'after_update', after_update_handler)
            event.listen(model, 'after_delete', after_delete_handler)
            logger.info(f"Registered cache invalidation handlers for {entity_type}")
        
        logger.info("Cache invalidation event handlers registered successfully")
    except Exception as e:
        logger.error(f"Failed to register cache invalidation event handlers: {e}")