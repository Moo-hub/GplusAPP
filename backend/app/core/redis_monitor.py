"""
Redis performance monitoring and optimization module.
This module provides functions for monitoring Redis performance, setting retention policies,
and optimizing memory usage for security events storage.
"""

import logging
from pathlib import Path
import time
import redis
from app.core.redis_client import get_redis_client
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel

from app.core.config import settings

# Configure logging
logger = logging.getLogger("redis_monitor")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis monitoring log file
# Ensure logs directory exists and add handler
logs_dir = Path(__file__).resolve().parents[2].joinpath('..').resolve() / 'logs'
try:
    logs_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    logs_dir = Path.cwd() / 'logs'

log_file_path = logs_dir / 'redis_monitor.log'
file_handler = logging.FileHandler(filename=str(log_file_path))
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Redis client for monitoring - prefer get_redis_client() which may provide
# an in-memory fallback in tests when real Redis is not available.
redis_client = get_redis_client()
if redis_client is None:
    try:
        redis_client = redis.Redis.from_url(settings.REDIS_URL)
        logger.info(f"Connected to Redis at {settings.REDIS_URL}")
    except Exception as e:
        logger.warning(f"Redis unavailable for monitor ({e}); continuing without it")
        redis_client = None

# Define retention policies by key pattern
RETENTION_POLICIES = {
    "security:event:*": {
        "ttl": 60 * 60 * 24 * 30,  # 30 days for security events
        "description": "Security events"
    },
    "security:ip:*": {
        "ttl": 60 * 60 * 24 * 7,  # 7 days for IP tracking
        "description": "IP-based security tracking"
    },
    "security:user:*": {
        "ttl": 60 * 60 * 24 * 30,  # 30 days for user tracking
        "description": "User-based security tracking"
    },
    "security:login:*": {
        "ttl": 60 * 60 * 24 * 7,  # 7 days for login attempts
        "description": "Login attempt tracking"
    },
    "security:login_ip:*": {
        "ttl": 60 * 60 * 24 * 7,  # 7 days for IP login attempts
        "description": "IP-based login attempt tracking"
    },
    "token:blacklist:*": {
        "ttl": 60 * 60 * 24 * 7,  # 7 days for blacklisted tokens
        "description": "Token blacklist"
    }
}

# Maximum list lengths for various key types
MAX_LIST_LENGTHS = {
    "security:ip:*": 100,  # Keep last 100 events per IP
    "security:user:*": 100,  # Keep last 100 events per user
    "security:login:*": 20,  # Keep last 20 login attempts per email
    "security:login_ip:*": 20  # Keep last 20 login attempts per IP
}


class RedisStats(BaseModel):
    """Model for Redis statistics"""
    timestamp: datetime = datetime.utcnow()
    used_memory: int
    used_memory_peak: int
    used_memory_rss: int
    total_keys: int
    expired_keys: int
    evicted_keys: int
    connected_clients: int
    uptime_in_seconds: int
    security_keys_count: int
    token_keys_count: int


def get_redis_info() -> Dict[str, Any]:
    """
    Get Redis server information
    """
    if not redis_client:
        logger.error("Redis client not initialized")
        return {}
    
    try:
        info = redis_client.info()
        return info
    except Exception as e:
        logger.error(f"Error getting Redis info: {e}")
        return {}


def get_key_count_by_pattern(pattern: str) -> int:
    """
    Get count of keys matching a pattern
    """
    if not redis_client:
        return 0
    
    try:
        # SCAN is more efficient than KEYS for production use
        count = 0
        cursor = '0'
        while cursor != 0:
            cursor, keys = redis_client.scan(cursor=cursor, match=pattern, count=1000)
            count += len(keys)
        return count
    except Exception as e:
        logger.error(f"Error counting keys for pattern '{pattern}': {e}")
        return 0


def get_redis_stats() -> Optional[RedisStats]:
    """
    Get comprehensive Redis statistics
    """
    if not redis_client:
        return None
    
    try:
        info = get_redis_info()
        if not info:
            return None
        
        # Count security-related keys
        security_keys_count = get_key_count_by_pattern("security:*")
        token_keys_count = get_key_count_by_pattern("token:*")
        
        stats = RedisStats(
            used_memory=info.get('used_memory', 0),
            used_memory_peak=info.get('used_memory_peak', 0),
            used_memory_rss=info.get('used_memory_rss', 0),
            total_keys=info.get('db0', {}).get('keys', 0) if 'db0' in info else 0,
            expired_keys=info.get('expired_keys', 0),
            evicted_keys=info.get('evicted_keys', 0),
            connected_clients=info.get('connected_clients', 0),
            uptime_in_seconds=info.get('uptime_in_seconds', 0),
            security_keys_count=security_keys_count,
            token_keys_count=token_keys_count
        )
        return stats
    except Exception as e:
        logger.error(f"Error getting Redis statistics: {e}")
        return None


def log_redis_stats():
    """
    Log Redis statistics for monitoring
    """
    stats = get_redis_stats()
    if not stats:
        return
    
    # Convert to JSON for logging
    stats_json = stats.model_dump_json()
    logger.info(f"Redis Stats: {stats_json}")
    
    # Store in Redis for historical tracking (expire after 7 days)
    if redis_client:
        try:
            key = f"monitoring:redis_stats:{int(time.time())}"
            redis_client.setex(key, 60 * 60 * 24 * 7, stats_json)
        except Exception as e:
            logger.error(f"Error storing Redis stats: {e}")


def apply_retention_policy(key_pattern: str, ttl: int, description: str) -> Tuple[int, int]:
    """
    Apply retention policy to keys matching pattern
    Returns: (keys_checked, keys_updated)
    """
    if not redis_client:
        return 0, 0
    
    keys_checked = 0
    keys_updated = 0
    
    try:
        cursor = '0'
        while cursor != 0:
            cursor, keys = redis_client.scan(cursor=cursor, match=key_pattern, count=1000)
            keys_checked += len(keys)
            
            for key in keys:
                # Check if key already has TTL
                existing_ttl = redis_client.ttl(key)
                if existing_ttl == -1:  # No expiry set
                    redis_client.expire(key, ttl)
                    keys_updated += 1
        
        logger.info(f"Applied retention policy to {keys_updated}/{keys_checked} {description} keys")
        return keys_checked, keys_updated
    except Exception as e:
        logger.error(f"Error applying retention policy to {description}: {e}")
        return keys_checked, keys_updated


def enforce_max_list_length(key_pattern: str, max_length: int) -> Tuple[int, int]:
    """
    Ensure Redis lists don't exceed max length
    Returns: (lists_checked, lists_trimmed)
    """
    if not redis_client:
        return 0, 0
    
    lists_checked = 0
    lists_trimmed = 0
    
    try:
        cursor = '0'
        while cursor != 0:
            cursor, keys = redis_client.scan(cursor=cursor, match=key_pattern, count=1000)
            
            for key in keys:
                key_type = redis_client.type(key)
                if key_type == b'list':
                    lists_checked += 1
                    list_length = redis_client.llen(key)
                    
                    if list_length > max_length:
                        # Trim the list to max_length (keep newest elements)
                        redis_client.ltrim(key, 0, max_length - 1)
                        lists_trimmed += 1
        
        logger.info(f"Trimmed {lists_trimmed}/{lists_checked} lists matching '{key_pattern}' to max length {max_length}")
        return lists_checked, lists_trimmed
    except Exception as e:
        logger.error(f"Error enforcing max list length for pattern '{key_pattern}': {e}")
        return lists_checked, lists_trimmed


def run_retention_policy_enforcement():
    """
    Run all retention policies
    """
    if not redis_client:
        logger.error("Cannot enforce retention policies: Redis client not initialized")
        return
    
    start_time = time.time()
    logger.info("Starting Redis retention policy enforcement")
    
    total_keys_checked = 0
    total_keys_updated = 0
    
    # Apply TTL to keys
    for key_pattern, policy in RETENTION_POLICIES.items():
        keys_checked, keys_updated = apply_retention_policy(
            key_pattern, 
            policy["ttl"], 
            policy["description"]
        )
        total_keys_checked += keys_checked
        total_keys_updated += keys_updated
    
    # Enforce max list lengths
    total_lists_checked = 0
    total_lists_trimmed = 0
    
    for key_pattern, max_length in MAX_LIST_LENGTHS.items():
        lists_checked, lists_trimmed = enforce_max_list_length(key_pattern, max_length)
        total_lists_checked += lists_checked
        total_lists_trimmed += lists_trimmed
    
    duration = time.time() - start_time
    logger.info(
        f"Completed Redis retention policy enforcement in {duration:.2f} seconds. "
        f"Keys: {total_keys_checked} checked, {total_keys_updated} updated. "
        f"Lists: {total_lists_checked} checked, {total_lists_trimmed} trimmed."
    )


def get_keys_without_expiry(limit: int = 100) -> List[Dict[str, Any]]:
    """
    Find keys without expiration
    """
    if not redis_client:
        return []
    
    keys_without_expiry = []
    try:
        cursor = '0'
        count = 0
        
        while cursor != 0 and count < limit:
            cursor, keys = redis_client.scan(cursor=cursor, count=1000)
            
            for key in keys:
                if count >= limit:
                    break
                    
                ttl = redis_client.ttl(key)
                if ttl == -1:  # No expiry set
                    key_type = redis_client.type(key).decode('utf-8')
                    size = 0
                    
                    # Get size info based on key type
                    if key_type == 'string':
                        size = len(redis_client.get(key) or b'')
                    elif key_type == 'list':
                        size = redis_client.llen(key)
                    elif key_type == 'hash':
                        size = redis_client.hlen(key)
                    elif key_type == 'set':
                        size = redis_client.scard(key)
                    elif key_type == 'zset':
                        size = redis_client.zcard(key)
                    
                    keys_without_expiry.append({
                        'key': key.decode('utf-8') if isinstance(key, bytes) else key,
                        'type': key_type,
                        'size': size
                    })
                    count += 1
        
        return keys_without_expiry
    except Exception as e:
        logger.error(f"Error finding keys without expiry: {e}")
        return []


def get_memory_usage_by_key_pattern() -> Dict[str, int]:
    """
    Estimate memory usage by key pattern
    This is an approximation as Redis doesn't provide exact memory usage per key pattern
    """
    if not redis_client:
        return {}
    
    memory_usage = {}
    patterns = list(RETENTION_POLICIES.keys()) + ["token:*", "cache:*", "session:*"]
    
    try:
        for pattern in patterns:
            pattern_memory = 0
            cursor = '0'
            while cursor != 0:
                cursor, keys = redis_client.scan(cursor=cursor, match=pattern, count=1000)
                
                for key in keys:
                    # memory_usage is available in Redis >= 4.0
                    try:
                        key_memory = redis_client.memory_usage(key) or 0
                        pattern_memory += key_memory
                    except redis.exceptions.ResponseError:
                        # Fallback for older Redis versions - rough estimate based on serialized size
                        key_type = redis_client.type(key)
                        if key_type == b'string':
                            pattern_memory += len(redis_client.get(key) or b'')
                        # For other types, we would need to serialize them to get a size estimate
            
            memory_usage[pattern] = pattern_memory
        
        return memory_usage
    except Exception as e:
        logger.error(f"Error calculating memory usage by pattern: {e}")
        return {}


def run_full_optimization():
    """
    Run a full Redis optimization
    """
    if not redis_client:
        logger.error("Cannot run optimization: Redis client not initialized")
        return
    
    logger.info("Starting full Redis optimization")
    
    # 1. Log current Redis stats
    log_redis_stats()
    
    # 2. Apply retention policies
    run_retention_policy_enforcement()
    
    # 3. Report keys without expiry
    keys_without_expiry = get_keys_without_expiry(limit=100)
    if keys_without_expiry:
        logger.warning(f"Found {len(keys_without_expiry)} keys without expiry")
        for key_info in keys_without_expiry[:10]:  # Log first 10 keys
            logger.warning(f"Key without expiry: {key_info['key']} (Type: {key_info['type']}, Size: {key_info['size']})")
    
    # 4. Report memory usage by pattern
    try:
        memory_usage = get_memory_usage_by_key_pattern()
        for pattern, usage in memory_usage.items():
            logger.info(f"Memory usage for '{pattern}': {usage} bytes")
    except Exception as e:
        logger.error(f"Error during memory usage reporting: {e}")
    
    # 5. Log final Redis stats
    log_redis_stats()
    logger.info("Redis optimization completed")


def init_scheduled_tasks():
    """
    Initialize scheduled tasks for Redis monitoring and optimization
    This should be called at application startup
    """
    # This function would typically set up background tasks or scheduled jobs
    # For now, we'll just log that it was called
    logger.info("Redis monitoring scheduled tasks initialized")
    
    # Run initial optimization
    run_full_optimization()