"""
Redis advanced memory monitoring module.
This module provides functions for detailed memory usage tracking,
adaptive TTL management based on memory pressure, and key eviction strategies.
"""

import logging
import time
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import redis

from app.core.config import settings
from app.core.redis_monitor import redis_client, get_redis_info, get_redis_stats

class RedisMemoryMonitor:
    """
    Class for monitoring Redis memory usage and performance.
    Provides methods for analyzing memory usage, detecting pressure,
    and implementing adaptive TTL strategies.
    """
    
    def __init__(self, redis_client=None):
        """
        Initialize the Redis memory monitor
        
        Args:
            redis_client: Redis client instance. If None, uses default from redis_monitor
        """
        self.redis = redis_client or globals()['redis_client']
        self.memory_samples = []
        self.max_samples = MAX_MEMORY_SAMPLES
        
    async def get_memory_usage(self) -> Dict[str, Any]:
        """
        Get current memory usage metrics
        
        Returns:
            Dictionary with memory usage metrics
        """
        stats = get_memory_stats()
        self.record_sample(stats)
        return stats
        
    async def detect_memory_pressure(self) -> str:
        """
        Detect current memory pressure level
        
        Returns:
            Memory pressure level: "low", "medium", "high", or "critical"
        """
        return get_memory_pressure_level()
        
    def record_sample(self, stats: Dict[str, Any]) -> None:
        """
        Record a memory sample based on provided stats
        
        Args:
            stats: Memory statistics dictionary
        """
        if "used_percent" in stats:
            sample = {
                "timestamp": datetime.utcnow().isoformat(),
                "memory_used": stats.get("memory_used", 0),
                "memory_peak": stats.get("memory_peak", 0),
                "memory_percent": stats.get("used_percent", 0)
            }
            
            self.memory_samples.append(sample)
            
            # Trim to maximum sample count
            if len(self.memory_samples) > self.max_samples:
                self.memory_samples = self.memory_samples[-self.max_samples:]

# Configure logging
logger = logging.getLogger("redis_memory_monitor")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis memory monitoring log file
file_handler = logging.FileHandler(filename="logs/redis_memory_monitor.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Memory pressure thresholds for adaptive TTL and eviction
MEMORY_THRESHOLDS = {
    "low": 60,       # Below 60% memory usage
    "medium": 75,    # Between 60% and 75% memory usage
    "high": 85,      # Between 75% and 85% memory usage
    "critical": 95   # Above 95% memory usage
}

# TTL adjustment factors based on memory pressure
TTL_ADJUSTMENT_FACTORS = {
    "low": 1.0,      # No adjustment
    "medium": 0.75,  # Reduce TTL to 75% of normal
    "high": 0.5,     # Reduce TTL to 50% of normal
    "critical": 0.25 # Reduce TTL to 25% of normal
}

# Maximum memory sample count for trending
MAX_MEMORY_SAMPLES = 60  # Keep 60 samples (e.g., 1 hour of samples at 1 per minute)

# Memory samples storage
memory_samples = []


def get_memory_pressure_level() -> str:
    """
    Get current memory pressure level based on Redis memory usage
    
    Returns:
        Memory pressure level: "low", "medium", "high", or "critical"
    """
    if not redis_client:
        return "unknown"
    
    try:
        stats = get_redis_stats()
        if not stats:
            return "unknown"
        
        # Calculate current memory usage percentage
        memory_used = stats.used_memory
        memory_peak = stats.used_memory_peak
        
        if memory_peak == 0:
            # If we don't have peak memory, try to get maxmemory from config
            info = get_redis_info()
            max_memory = info.get('maxmemory', 0)
            
            if max_memory > 0:
                memory_percent = (memory_used / max_memory) * 100
            else:
                # If we can't determine max memory, use RSS as an approximation
                memory_percent = (memory_used / stats.used_memory_rss) * 100 if stats.used_memory_rss > 0 else 0
        else:
            memory_percent = (memory_used / memory_peak) * 100
        
        # Determine pressure level
        if memory_percent >= MEMORY_THRESHOLDS["critical"]:
            return "critical"
        elif memory_percent >= MEMORY_THRESHOLDS["high"]:
            return "high"
        elif memory_percent >= MEMORY_THRESHOLDS["medium"]:
            return "medium"
        else:
            return "low"
    except Exception as e:
        logger.error(f"Error getting memory pressure level: {e}")
        return "unknown"


def get_memory_trend() -> Tuple[str, float]:
    """
    Calculate memory usage trend
    
    Returns:
        Tuple of (trend_direction, trend_rate)
        trend_direction: "stable", "increasing", "decreasing"
        trend_rate: Rate of change in percentage points per hour
    """
    global memory_samples
    
    if len(memory_samples) < 5:  # Need at least 5 samples for trend
        return "stable", 0.0
    
    try:
        # Use the last 10 samples or all if fewer
        sample_count = min(10, len(memory_samples))
        recent_samples = memory_samples[-sample_count:]
        
        # Calculate slope using simple linear regression
        x_values = list(range(sample_count))
        y_values = [s["memory_percent"] for s in recent_samples]
        
        # Simple linear regression
        n = sample_count
        sum_x = sum(x_values)
        sum_y = sum(y_values)
        sum_xy = sum(x * y for x, y in zip(x_values, y_values))
        sum_xx = sum(x * x for x in x_values)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x)
        
        # Convert slope to percentage points per hour
        # Assuming one sample per minute, multiply by 60 for hourly rate
        rate = slope * 60
        
        # Determine trend direction
        if abs(rate) < 1.0:  # Less than 1 percentage point per hour
            return "stable", rate
        elif rate > 0:
            return "increasing", rate
        else:
            return "decreasing", rate
    except Exception as e:
        logger.error(f"Error calculating memory trend: {e}")
        return "stable", 0.0


def get_ttl_adjustment_factor() -> float:
    """
    Calculate TTL adjustment factor based on memory pressure and trend
    
    Returns:
        TTL adjustment factor (multiply normal TTL by this value)
    """
    pressure_level = get_memory_pressure_level()
    
    # Get base adjustment factor from pressure level
    base_factor = TTL_ADJUSTMENT_FACTORS.get(pressure_level, 1.0)
    
    # Adjust further based on trend
    trend, rate = get_memory_trend()
    if trend == "increasing" and rate > 5.0:  # Increasing by more than 5 percentage points per hour
        # Further reduce TTL
        trend_factor = 0.9
    elif trend == "decreasing" and rate < -5.0:  # Decreasing by more than 5 percentage points per hour
        # Can be slightly more lenient with TTL
        trend_factor = 1.1
    else:
        trend_factor = 1.0
    
    # Apply trend factor to base factor, but don't exceed 1.0
    final_factor = min(1.0, base_factor * trend_factor)
    
    return final_factor


def record_memory_sample():
    """
    Record current memory usage sample for trend analysis
    """
    global memory_samples
    
    try:
        stats = get_redis_stats()
        if not stats:
            return
        
        # Calculate memory percentage
        memory_used = stats.used_memory
        memory_peak = stats.used_memory_peak
        
        if memory_peak == 0:
            # If we don't have peak memory, try to get maxmemory from config
            info = get_redis_info()
            max_memory = info.get('maxmemory', 0)
            
            if max_memory > 0:
                memory_percent = (memory_used / max_memory) * 100
            else:
                # If we can't determine max memory, use RSS as an approximation
                memory_percent = (memory_used / stats.used_memory_rss) * 100 if stats.used_memory_rss > 0 else 0
        else:
            memory_percent = (memory_used / memory_peak) * 100
        
        # Add sample
        sample = {
            "timestamp": datetime.utcnow().isoformat(),
            "memory_used": memory_used,
            "memory_peak": memory_peak,
            "memory_percent": memory_percent
        }
        
        memory_samples.append(sample)
        
        # Trim to maximum sample count
        if len(memory_samples) > MAX_MEMORY_SAMPLES:
            memory_samples = memory_samples[-MAX_MEMORY_SAMPLES:]
            
    except Exception as e:
        logger.error(f"Error recording memory sample: {e}")


def get_largest_keys(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Find the largest keys in Redis by memory usage
    
    Args:
        limit: Maximum number of keys to return
        
    Returns:
        List of dictionaries with key information
    """
    if not redis_client:
        return []
    
    largest_keys = []
    
    try:
        # Scan through all keys
        cursor = '0'
        scanned = 0
        
        while cursor != 0 and scanned < 10000:  # Limit to scanning 10,000 keys
            cursor, keys = redis_client.scan(cursor=cursor, count=1000)
            scanned += len(keys)
            
            for key in keys:
                try:
                    # Get memory usage of key
                    key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                    memory = redis_client.memory_usage(key)
                    key_type = redis_client.type(key).decode('utf-8')
                    ttl = redis_client.ttl(key)
                    
                    # Get size information based on type
                    size_info = None
                    if key_type == 'string':
                        size_info = len(redis_client.get(key) or b'')
                    elif key_type == 'list':
                        size_info = redis_client.llen(key)
                    elif key_type == 'hash':
                        size_info = redis_client.hlen(key)
                    elif key_type == 'set':
                        size_info = redis_client.scard(key)
                    elif key_type == 'zset':
                        size_info = redis_client.zcard(key)
                    
                    key_info = {
                        "key": key_str,
                        "memory": memory,
                        "type": key_type,
                        "ttl": ttl,
                        "size": size_info
                    }
                    
                    # Add to largest keys
                    largest_keys.append(key_info)
                    
                    # Keep only the largest keys
                    largest_keys = sorted(largest_keys, key=lambda k: k["memory"], reverse=True)[:limit]
                    
                except Exception as e:
                    logger.error(f"Error getting memory usage for key {key}: {e}")
        
        return largest_keys
    except Exception as e:
        logger.error(f"Error finding largest keys: {e}")
        return []


def apply_adaptive_ttl():
    """
    Apply adaptive TTL to all keys based on memory pressure
    """
    if not redis_client:
        return 0
    
    updated_count = 0
    
    try:
        # Get TTL adjustment factor
        adjustment_factor = get_ttl_adjustment_factor()
        
        # Only adjust if factor is less than 1.0
        if adjustment_factor >= 1.0:
            logger.info("Memory pressure normal, no TTL adjustments needed")
            return 0
        
        # Get memory pressure level for logging
        pressure_level = get_memory_pressure_level()
        logger.warning(f"Memory pressure level: {pressure_level}, applying TTL adjustment factor: {adjustment_factor:.2f}")
        
        # Apply to all keys with existing TTL
        cursor = '0'
        scanned = 0
        
        while cursor != 0 and scanned < 10000:  # Limit to scanning 10,000 keys
            cursor, keys = redis_client.scan(cursor=cursor, count=1000)
            scanned += len(keys)
            
            for key in keys:
                ttl = redis_client.ttl(key)
                
                # Only adjust keys with positive TTL
                if ttl > 0:
                    # Calculate new TTL
                    new_ttl = int(ttl * adjustment_factor)
                    
                    # Ensure minimum TTL of 60 seconds
                    new_ttl = max(60, new_ttl)
                    
                    # Apply new TTL
                    redis_client.expire(key, new_ttl)
                    updated_count += 1
        
        logger.info(f"Updated TTL for {updated_count} keys with adjustment factor {adjustment_factor:.2f}")
        return updated_count
    except Exception as e:
        logger.error(f"Error applying adaptive TTL: {e}")
        return 0


def handle_critical_memory_pressure():
    """
    Handle critical memory pressure by taking emergency actions
    """
    if not redis_client:
        return
    
    try:
        # Get memory pressure level
        pressure_level = get_memory_pressure_level()
        
        # Only act if pressure is critical
        if pressure_level != "critical":
            return
        
        logger.critical("CRITICAL memory pressure detected, taking emergency actions")
        
        # 1. Get largest keys
        largest_keys = get_largest_keys(limit=50)
        
        # 2. Log largest keys for debugging
        for i, key_info in enumerate(largest_keys[:10]):
            logger.critical(f"Large key {i+1}: {key_info['key']} ({key_info['memory']} bytes, type: {key_info['type']}, ttl: {key_info['ttl']})")
        
        # 3. Apply aggressive TTL reduction for large keys
        evicted = 0
        for key_info in largest_keys:
            # If key is cache data and large, consider evicting it
            if key_info["key"].startswith("cache:") and key_info["memory"] > 10000:
                redis_client.delete(key_info["key"])
                logger.warning(f"Evicted large cache key: {key_info['key']} ({key_info['memory']} bytes)")
                evicted += 1
                
                # Stop after evicting 10 large cache keys
                if evicted >= 10:
                    break
        
        # 4. Apply adaptive TTL to all keys
        apply_adaptive_ttl()
        
        logger.critical(f"Emergency actions completed: evicted {evicted} large cache keys")
    except Exception as e:
        logger.error(f"Error handling critical memory pressure: {e}")


def get_memory_stats() -> Dict[str, Any]:
    """
    Get comprehensive memory statistics
    
    Returns:
        Dictionary with memory statistics
    """
    if not redis_client:
        return {"error": "Redis client not initialized"}
    
    try:
        # Get Redis statistics
        stats = get_redis_stats()
        info = get_redis_info()
        
        # Get memory usage metrics
        memory_used = stats.used_memory if stats else 0
        memory_peak = stats.used_memory_peak if stats else 0
        memory_rss = stats.used_memory_rss if stats else 0
        memory_max = info.get('maxmemory', 0)
        
        # Calculate percentages
        if memory_max > 0:
            used_percent = (memory_used / memory_max) * 100
        elif memory_peak > 0:
            used_percent = (memory_used / memory_peak) * 100
        else:
            used_percent = 0
        
        # Get memory trend
        trend_direction, trend_rate = get_memory_trend()
        
        # Get pressure level
        pressure_level = get_memory_pressure_level()
        
        # Get TTL adjustment
        ttl_adjustment = get_ttl_adjustment_factor()
        
        # Get largest keys
        largest_keys = get_largest_keys(limit=10)
        
        return {
            "memory_used": memory_used,
            "memory_peak": memory_peak,
            "memory_rss": memory_rss,
            "memory_max": memory_max,
            "used_percent": used_percent,
            "pressure_level": pressure_level,
            "trend_direction": trend_direction,
            "trend_rate": trend_rate,
            "ttl_adjustment": ttl_adjustment,
            "largest_keys": largest_keys,
            "samples_count": len(memory_samples),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {e}")
        return {"error": str(e)}