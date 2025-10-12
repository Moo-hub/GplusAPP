"""
Redis client connection management.
This module provides functions to get and manage Redis client instances.
"""

import logging
from pathlib import Path
import redis
import time
from typing import Optional, Dict, Any

from app.core.config import settings


class InMemoryRedis:
    """A tiny in-memory Redis-like fallback used only for tests or when
    Redis is unreachable. Supports get, setex, set, delete, ping, scan.
    """
    def __init__(self):
        self.store = {}

    def ping(self):
        return True

    def setex(self, key, ttl, value):
        # Store value and expiry timestamp
        expire_at = None
        if ttl:
            expire_at = time.time() + int(ttl)
        self.store[key] = (value, expire_at)

    def set(self, key, value):
        self.store[key] = (value, None)

    def get(self, key):
        v = self.store.get(key)
        if not v:
            return None
        value, exp = v
        if exp and exp < time.time():
            del self.store[key]
            return None
        return value

    def delete(self, *keys):
        deleted = 0
        for k in keys:
            if k in self.store:
                del self.store[k]
                deleted += 1
        return deleted

    def scan(self, cursor='0', match=None, count=100):
        # Very small scan implementation: return all matching keys then '0'
        keys = [k for k in self.store.keys() if (match is None or k.startswith(match.rstrip('*')))]
        return 0, keys

    # List operations used by monitoring/security code
    def lpush(self, key, *values):
        lst, exp = self.store.get(key, ([], None))
        if not isinstance(lst, list):
            lst = []
        for v in values:
            lst.insert(0, v)
        self.store[key] = (lst, exp)
        return len(lst)

    def lrange(self, key, start=0, end=-1):
        v = self.store.get(key)
        if not v:
            return []
        lst, exp = v
        if exp and exp < time.time():
            del self.store[key]
            return []
        # emulate redis inclusive end
        if end == -1:
            return lst[start:]
        return lst[start:end+1]

    def ltrim(self, key, start, end):
        v = self.store.get(key)
        if not v:
            return True
        lst, exp = v
        if end == -1:
            new = lst[start:]
        else:
            new = lst[start:end+1]
        self.store[key] = (new, exp)
        return True

    def expire(self, key, seconds):
        v = self.store.get(key)
        if not v:
            return False
        val, _ = v
        self.store[key] = (val, time.time() + int(seconds))
        return True

    def slowlog_get(self, count=10):
        # Monitoring expects a list-like structure; return empty list in-memory
        return []

    def keys(self, pattern: str = '*'):
        # Simple glob-style support: prefix* or *suffix or *substring*
        if pattern == '*' or pattern is None:
            return list(self.store.keys())

        results = []
        if pattern.endswith('*') and not pattern.startswith('*'):
            prefix = pattern.rstrip('*')
            for k in self.store.keys():
                if k.startswith(prefix):
                    results.append(k)
        elif pattern.startswith('*') and pattern.endswith('*'):
            sub = pattern.strip('*')
            for k in self.store.keys():
                if sub in k:
                    results.append(k)
        elif pattern.startswith('*') and not pattern.endswith('*'):
            suffix = pattern.lstrip('*')
            for k in self.store.keys():
                if k.endswith(suffix):
                    results.append(k)
        else:
            # exact match
            if pattern in self.store:
                results.append(pattern)

        return results

    def dbsize(self):
        return len(self.store)

    def info(self, *args, **kwargs):
        # Minimal info structure to satisfy callers; accept flexible args
        return {
            'keyspace_hits': 0,
            'keyspace_misses': 0,
            'used_memory': 0,
            'used_memory_human': '0B',
            'uptime_in_seconds': 0
        }

    @property
    def client(self):
        # Some monitoring code expects a .client attribute
        return self



class RedisClient:
    """
    Redis client wrapper class providing enhanced Redis functionality
    with monitoring, logging, and error handling.
    """
    
    def __init__(self, url: str = None):
        """
        Initialize Redis client with specified URL
        
        Args:
            url: Redis URL string. If not provided, uses settings.REDIS_URL
        """
        self.url = url or settings.REDIS_URL
        self._client = None
        self.connected = False
    
    def connect(self) -> bool:
        """
        Connect to Redis server
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self._client = redis.Redis.from_url(self.url)
            self._client.ping()
            self.connected = True
            logger.info(f"Connected to Redis at {self.url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.connected = False
            return False
    
    @property
    def client(self) -> redis.Redis:
        """
        Get the underlying Redis client, connecting if necessary
        
        Returns:
            Redis client instance
        """
        if not self.connected:
            self.connect()
        return self._client
        
    def get_info(self) -> Dict[str, Any]:
        """
        Get Redis server information
        
        Returns:
            Dictionary with Redis info command results
        """
        try:
            if not self.connected:
                self.connect()
            if self.connected:
                return self.client.info()
            return {}
        except Exception as e:
            logger.error(f"Error getting Redis info: {e}")
            return {}

# Configure logging
logger = logging.getLogger("redis_client")
logger.setLevel(logging.INFO)

# Ensure logs directory exists and add a handler to write to Redis log file
logs_dir = Path(__file__).resolve().parents[2].joinpath('..').resolve() / 'logs'
try:
    logs_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    logs_dir = Path.cwd() / 'logs'

log_file_path = logs_dir / 'redis.log'
file_handler = logging.FileHandler(filename=str(log_file_path))
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Redis client singleton instance
_redis_client = None

def get_redis_client() -> Optional[redis.Redis]:
    """
    Get a Redis client instance.
    
    Returns:
        Redis client instance or None if connection fails
    """
    global _redis_client
    
    if _redis_client is not None:
        return _redis_client
    
    try:
        # Prefer a real Redis client in non-test environments
        if getattr(settings, "ENVIRONMENT", None) == "test":
            raise RuntimeError("Test environment: using in-memory Redis")

        _redis_client = redis.Redis.from_url(settings.REDIS_URL)
        # Test connection
        _redis_client.ping()
        logger.info(f"Connected to Redis at {settings.REDIS_URL}")
        return _redis_client
    except Exception as e:
        logger.warning(f"Real Redis unavailable ({e}), falling back to in-memory Redis")
        # Use in-memory redis for tests or when redis is unreachable
        _redis_client = InMemoryRedis()
        return _redis_client