"""
Redis cache preloading module.
This module provides functions for preloading frequently accessed data into the Redis cache
to improve response times for common queries.
"""

import logging
import asyncio
from typing import Any, Dict, List, Optional, Set, Union, Callable, Tuple

from app.core.redis_cache import set_cache_value, generate_cache_key
from app.core.config import settings

# Configure logging
logger = logging.getLogger("redis_cache_preload")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis cache preload log file
file_handler = logging.FileHandler(filename="logs/redis_cache_preload.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Preload configuration for different entity types
PRELOAD_CONFIG = {
    "pickup_request": {
        "enabled": True,
        "limit": 100,  # Only preload the most recent 100 pickup requests
        "ttl": 3600,   # Cache for 1 hour
    },
    "recycling_item": {
        "enabled": True,
        "limit": 100,  # Only preload the most recent 100 recycling items
        "ttl": 3600,   # Cache for 1 hour
    },
    "user": {
        "enabled": True,
        "limit": 100,  # Only preload the most active 100 users
        "ttl": 7200,   # Cache for 2 hours
    },
    "points_summary": {
        "enabled": True,
        "limit": 50,   # Only preload the top 50 users by points
        "ttl": 3600,   # Cache for 1 hour
    }
}


async def preload_pickup_requests():
    """
    Preload recent pickup requests into cache
    """
    if not PRELOAD_CONFIG["pickup_request"]["enabled"]:
        return 0
        
    preloaded_count = 0
    
    try:
        from app.crud.crud_pickup_request import crud_pickup_request
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            # Get recent pickup requests
            recent_requests = crud_pickup_request.get_multi(
                db, 
                limit=PRELOAD_CONFIG["pickup_request"]["limit"],
                order_by="created_at",
                order_direction="desc"
            )
            
            # Cache each pickup request
            for request in recent_requests:
                # Convert to dict
                request_dict = request.__dict__.copy()
                if "_sa_instance_state" in request_dict:
                    del request_dict["_sa_instance_state"]
                
                # Cache the pickup request
                key = generate_cache_key("pickup", str(request.id))
                if set_cache_value(
                    key, 
                    request_dict, 
                    ttl=PRELOAD_CONFIG["pickup_request"]["ttl"],
                    namespace="pickup"
                ):
                    preloaded_count += 1
            
            logger.info(f"Preloaded {preloaded_count} recent pickup requests into cache")
            return preloaded_count
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error preloading pickup requests: {e}")
        return 0


async def preload_active_users():
    """
    Preload active users into cache
    """
    if not PRELOAD_CONFIG["user"]["enabled"]:
        return 0
        
    preloaded_count = 0
    
    try:
        from app.crud.crud_user import crud_user
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            # Get active users (this would depend on your specific activity metrics)
            active_users = crud_user.get_multi(
                db, 
                limit=PRELOAD_CONFIG["user"]["limit"]
            )
            
            # Cache each user
            for user in active_users:
                # Convert to dict
                user_dict = user.__dict__.copy()
                if "_sa_instance_state" in user_dict:
                    del user_dict["_sa_instance_state"]
                
                # Remove sensitive information
                if "hashed_password" in user_dict:
                    del user_dict["hashed_password"]
                
                # Cache the user
                key = generate_cache_key("user", str(user.id))
                if set_cache_value(
                    key, 
                    user_dict,
                    ttl=PRELOAD_CONFIG["user"]["ttl"],
                    namespace="user"
                ):
                    preloaded_count += 1
            
            logger.info(f"Preloaded {preloaded_count} active users into cache")
            return preloaded_count
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error preloading active users: {e}")
        return 0


async def preload_recycling_items():
    """
    Preload recent recycling items into cache
    """
    if not PRELOAD_CONFIG["recycling_item"]["enabled"]:
        return 0
        
    preloaded_count = 0
    
    try:
        from app.crud.crud_recycling_item import crud_recycling_item
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            # Get recent recycling items
            recent_items = crud_recycling_item.get_multi(
                db, 
                limit=PRELOAD_CONFIG["recycling_item"]["limit"],
                order_by="created_at",
                order_direction="desc"
            )
            
            # Cache each item
            for item in recent_items:
                # Convert to dict
                item_dict = item.__dict__.copy()
                if "_sa_instance_state" in item_dict:
                    del item_dict["_sa_instance_state"]
                
                # Cache the item
                key = generate_cache_key("recycling", str(item.id))
                if set_cache_value(
                    key, 
                    item_dict,
                    ttl=PRELOAD_CONFIG["recycling_item"]["ttl"],
                    namespace="recycling"
                ):
                    preloaded_count += 1
            
            logger.info(f"Preloaded {preloaded_count} recent recycling items into cache")
            return preloaded_count
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error preloading recycling items: {e}")
        return 0


async def preload_points_summary():
    """
    Preload points summary for top users
    """
    if not PRELOAD_CONFIG["points_summary"]["enabled"]:
        return 0
        
    preloaded_count = 0
    
    try:
        from app.crud.crud_points import crud_points
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            # Get top users by points
            top_users = crud_points.get_top_users(
                db, 
                limit=PRELOAD_CONFIG["points_summary"]["limit"]
            )
            
            # Cache the points summary
            key = generate_cache_key("points", "summary")
            if set_cache_value(
                key, 
                top_users,
                ttl=PRELOAD_CONFIG["points_summary"]["ttl"],
                namespace="points"
            ):
                preloaded_count = 1
            
            # Also cache individual point summaries for each top user
            for user_id, points in top_users:
                user_points_key = generate_cache_key("points", f"user:{user_id}")
                if set_cache_value(
                    user_points_key,
                    {"user_id": user_id, "points": points},
                    ttl=PRELOAD_CONFIG["points_summary"]["ttl"],
                    namespace="points"
                ):
                    preloaded_count += 1
            
            logger.info(f"Preloaded points summary and {preloaded_count-1} user point entries into cache")
            return preloaded_count
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error preloading points summary: {e}")
        return 0


async def run_cache_preload():
    """
    Run a full cache preload
    """
    logger.info("Starting full cache preload")
    start_time = asyncio.get_event_loop().time()
    
    # Run all preload tasks
    pickup_count = await preload_pickup_requests()
    user_count = await preload_active_users()
    recycling_count = await preload_recycling_items()
    points_count = await preload_points_summary()
    
    total_count = pickup_count + user_count + recycling_count + points_count
    duration = asyncio.get_event_loop().time() - start_time
    
    logger.info(f"Cache preload completed in {duration:.2f} seconds. Preloaded {total_count} items.")
    return total_count


def schedule_cache_preload(app=None):
    """
    Schedule regular cache preloading tasks
    This function should be called at application startup
    """
    logger.info("Setting up cache preload scheduler")
    
    # This would typically be done using a background task system
    # For now, we'll just log that it was called
    
    async def preload_task():
        while True:
            try:
                await run_cache_preload()
            except Exception as e:
                logger.error(f"Error in scheduled preload task: {e}")
            
            # Wait for the next scheduled run (every 30 minutes)
            await asyncio.sleep(30 * 60)
    
    # If we have an app with lifespan support
    if app:
        @app.on_event("startup")
        async def start_preload_scheduler():
            asyncio.create_task(preload_task())
    
    logger.info("Cache preload scheduler configured")