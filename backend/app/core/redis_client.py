"""
Redis client connection management.
This module provides functions to get and manage Redis client instances.
"""

import logging
import redis
from typing import Optional, Dict, Any

from app.core.config import settings

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

# Add a handler to write to Redis log file
file_handler = logging.FileHandler(filename="logs/redis.log")
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
        _redis_client = redis.Redis.from_url(settings.REDIS_URL)
        # Test connection
        _redis_client.ping()
        logger.info(f"Connected to Redis at {settings.REDIS_URL}")
        return _redis_client
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return None