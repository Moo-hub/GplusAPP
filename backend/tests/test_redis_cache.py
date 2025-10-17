"""
Test script for Redis caching functionality
This script tests the Redis caching, cache invalidation, and memory monitoring features
"""

import pytest
import json
import time
from unittest.mock import patch, MagicMock
import redis

from app.core.redis_cache import (
    generate_cache_key,
    set_cache_value,
    get_cache_value,
    invalidate_cache,
    invalidate_namespace,
    get_cache_metrics,
    reset_cache_metrics,
    cached,
    CACHE_CONFIG
)
from app.core.config import settings

# Skip tests if Redis is not available
redis_available = True
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL)
    redis_client.ping()
except Exception:
    redis_available = False


@pytest.fixture
def test_redis_client():
    """Create a test Redis client connected to the test database"""
    if not redis_available:
        pytest.skip("Redis not available")
        
    # Connect to test database in Redis (db 1 instead of default 0)
    # Parse the URL to modify the database number
    parts = settings.REDIS_URL.split('/')
    test_redis_url = '/'.join(parts[:-1] + ['1'])
    client = redis.Redis.from_url(test_redis_url)
    
    # Clear test database before each test
    client.flushdb()
    
    yield client
    
    # Clean up after test
    client.flushdb()


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_generate_cache_key():
    """Test cache key generation"""
    # Simple key with just namespace and identifier
    key = generate_cache_key("user", "123")
    expected_prefix = CACHE_CONFIG["namespaces"]["user"]
    assert key == f"{expected_prefix}123"
    
    # Key with params
    params = {"filter": "active", "sort": "name"}
    key = generate_cache_key("user", "all", params)
    # Should include hash of params
    assert key.startswith(f"{expected_prefix}all:")
    assert len(key.split(":")) == 3  # namespace:identifier:hash
    
    # Same params should generate same key
    key2 = generate_cache_key("user", "all", params)
    assert key == key2
    
    # Different params should generate different key
    params2 = {"filter": "inactive", "sort": "name"}
    key3 = generate_cache_key("user", "all", params2)
    assert key != key3


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_set_get_cache_value(test_redis_client):
    """Test setting and getting cache values"""
    with patch('app.core.redis_cache.redis_client', test_redis_client):
        # Reset metrics
        reset_cache_metrics()
        
        # Set a value
        key = "test:cache:key"
        value = {"id": 123, "name": "Test Value"}
        
        result = set_cache_value(key, value)
        assert result is True
        
        # Get the value
        found, cached_value = get_cache_value(key)
        assert found is True
        assert cached_value == value
        
        # Check metrics
        metrics = get_cache_metrics()
        assert metrics["hits"] == 1
        assert metrics["misses"] == 0
        assert metrics["sets"] == 1
        
        # Try getting a non-existent key
        found, cached_value = get_cache_value("nonexistent:key")
        assert found is False
        assert cached_value is None
        
        # Check metrics again
        metrics = get_cache_metrics()
        assert metrics["hits"] == 1
        assert metrics["misses"] == 1


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_invalidate_cache(test_redis_client):
    """Test cache invalidation"""
    with patch('app.core.redis_cache.redis_client', test_redis_client):
        # Reset metrics
        reset_cache_metrics()
        
        # Set multiple values
        key1 = "test:user:123"
        key2 = "test:user:456"
        key3 = "test:pickup:789"
        
        set_cache_value(key1, {"id": 123})
        set_cache_value(key2, {"id": 456})
        set_cache_value(key3, {"id": 789})
        
        # Invalidate one key
        result = invalidate_cache(key1)
        assert result is True
        
        # The key should no longer exist
        found, _ = get_cache_value(key1)
        assert found is False
        
        # Other keys should still exist
        found, _ = get_cache_value(key2)
        assert found is True
        found, _ = get_cache_value(key3)
        assert found is True
        
        # Invalidate by namespace
        count = invalidate_namespace("user")
        assert count == 1  # Should invalidate one key
        
        # User keys should be gone
        found, _ = get_cache_value(key2)
        assert found is False
        
        # Pickup key should still exist
        found, _ = get_cache_value(key3)
        assert found is True
        
        # Check metrics
        metrics = get_cache_metrics()
        assert metrics["sets"] == 3
        assert metrics["invalidations"] >= 2


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_cached_decorator(test_redis_client):
    """Test cached decorator for functions"""
    with patch('app.core.redis_cache.redis_client', test_redis_client):
        # Reset metrics
        reset_cache_metrics()
        
        # Define a function with the cached decorator
        call_count = 0
        
        @cached(namespace="test", ttl=60)
        def expensive_function(arg1, arg2=None):
            nonlocal call_count
            call_count += 1
            return {"arg1": arg1, "arg2": arg2, "result": arg1 + str(arg2)}
        
        # First call should execute the function
        result1 = expensive_function("test", arg2="123")
        assert call_count == 1
        assert result1["result"] == "test123"
        
        # Second call with same args should use cache
        result2 = expensive_function("test", arg2="123")
        assert call_count == 1  # Function not called again
        assert result2["result"] == "test123"
        
        # Call with different args should execute function
        result3 = expensive_function("test", arg2="456")
        assert call_count == 2
        assert result3["result"] == "test456"
        
        # Check metrics
        metrics = get_cache_metrics()
        assert metrics["hits"] == 1  # One cache hit
        assert metrics["sets"] >= 2  # At least two cache sets


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_cache_ttl(test_redis_client):
    """Test that cache values respect TTL settings"""
    with patch('app.core.redis_cache.redis_client', test_redis_client):
        # Set a value with a very short TTL
        key = "test:ttl:key"
        set_cache_value(key, {"data": "test"}, ttl=1)  # 1 second TTL
        
        # Value should be retrievable immediately
        found, value = get_cache_value(key)
        assert found is True
        assert value == {"data": "test"}
        
        # Wait for TTL to expire
        time.sleep(1.1)
        
        # Value should no longer be retrievable
        found, value = get_cache_value(key)
        assert found is False
        assert value is None