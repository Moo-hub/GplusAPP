"""
Test script for Redis monitoring and data retention functionality
This script tests the Redis performance monitoring and data retention policies
"""

import pytest
import time
import json
import redis
from unittest.mock import patch, MagicMock

from app.core.redis_monitor import (
    RedisStats,
    get_redis_info,
    get_redis_stats,
    apply_retention_policy,
    enforce_max_list_length,
    run_retention_policy_enforcement,
    get_keys_without_expiry,
    get_memory_usage_by_key_pattern,
    run_full_optimization,
    RETENTION_POLICIES,
    MAX_LIST_LENGTHS
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
    
    # Set up some test data
    client.setex("security:event:1234:auth_failure", 3600, json.dumps({"event": "test_event"}))
    client.setex("security:event:1235:auth_success", 3600, json.dumps({"event": "test_event2"}))
    client.lpush("security:ip:192.168.1.1", *[json.dumps({"event": f"ip_event_{i}"}) for i in range(150)])
    client.lpush("security:user:123", *[json.dumps({"event": f"user_event_{i}"}) for i in range(150)])
    client.set("token:blacklist:abcdef", "1", 3600)
    client.set("no_expiry_key", "test_value")
    
    yield client
    
    # Clean up after test
    client.flushdb()


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_redis_stats(test_redis_client):
    """Test getting Redis statistics"""
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        stats = get_redis_stats()
        
        assert stats is not None
        assert isinstance(stats, RedisStats)
        assert stats.security_keys_count >= 4  # We created 4 security-related keys
        assert stats.token_keys_count >= 1    # We created 1 token-related key


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_retention_policy_application(test_redis_client):
    """Test applying retention policies to Redis keys"""
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        # Create a key without expiry
        test_redis_client.set("security:test:no_expiry", "value")
        
        # Ensure it has no expiry
        assert test_redis_client.ttl("security:test:no_expiry") == -1
        
        # Apply retention policy
        keys_checked, keys_updated = apply_retention_policy(
            "security:test:*", 
            3600,
            "test keys"
        )
        
        # Check that our key now has an expiry
        assert keys_updated == 1
        assert test_redis_client.ttl("security:test:no_expiry") > 0


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_max_list_length_enforcement(test_redis_client):
    """Test enforcing maximum list lengths"""
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        # Create a test list with more items than the limit
        test_key = "security:ip:test"
        for i in range(150):
            test_redis_client.lpush(test_key, f"item_{i}")
        
        # Initial length should be 150
        assert test_redis_client.llen(test_key) == 150
        
        # Apply list length enforcement
        lists_checked, lists_trimmed = enforce_max_list_length(
            "security:ip:*", 
            100
        )
        
        # Check that our list was trimmed
        assert lists_trimmed >= 1
        assert test_redis_client.llen(test_key) == 100


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_keys_without_expiry(test_redis_client):
    """Test finding keys without expiry"""
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        # We already have a key without expiry: no_expiry_key
        keys = get_keys_without_expiry()
        
        # Should find at least our test key
        assert len(keys) >= 1
        assert any(k["key"] == "no_expiry_key" for k in keys)


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_full_optimization(test_redis_client):
    """Test running full optimization"""
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        # Create test data
        test_redis_client.set("security:event:test:no_ttl", "value")
        test_redis_client.lpush("security:user:test", *["item" for _ in range(150)])
        
        # Run optimization
        run_full_optimization()
        
        # Check results
        assert test_redis_client.ttl("security:event:test:no_ttl") > 0
        assert test_redis_client.llen("security:user:test") == 100


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_memory_usage_by_pattern(test_redis_client):
    """Test getting memory usage by key pattern"""
    # This test might be skipped in older Redis versions
    try:
        # Check if MEMORY USAGE is available
        test_redis_client.memory_usage("no_expiry_key")
    except redis.exceptions.ResponseError:
        pytest.skip("Redis MEMORY USAGE command not available")
    
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        # Create some test data
        for i in range(10):
            test_redis_client.set(f"security:event:test:{i}", "X" * 1000)  # 1KB per key
        
        memory_usage = get_memory_usage_by_key_pattern()
        
        # Should find some memory usage for security events
        assert "security:event:*" in memory_usage
        assert memory_usage["security:event:*"] > 0


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_retention_policies_configuration():
    """Test that all required retention policies are defined"""
    # Check that we have policies for all key types
    assert "security:event:*" in RETENTION_POLICIES
    assert "security:ip:*" in RETENTION_POLICIES
    assert "security:user:*" in RETENTION_POLICIES
    assert "security:login:*" in RETENTION_POLICIES
    assert "token:blacklist:*" in RETENTION_POLICIES
    
    # Check that list length limits are defined
    assert "security:ip:*" in MAX_LIST_LENGTHS
    assert "security:user:*" in MAX_LIST_LENGTHS


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_run_retention_policy_enforcement(test_redis_client):
    """Test running all retention policies"""
    with patch('app.core.redis_monitor.redis_client', test_redis_client):
        # Create keys without expiry
        test_redis_client.set("security:event:test:no_ttl", "value")
        test_redis_client.set("security:ip:10.0.0.1:no_ttl", "value")
        test_redis_client.set("token:blacklist:expired:no_ttl", "value")
        
        # Create oversized lists
        test_redis_client.lpush("security:user:999", *["item" for _ in range(150)])
        
        # Run enforcement
        run_retention_policy_enforcement()
        
        # Check that TTLs were set
        assert test_redis_client.ttl("security:event:test:no_ttl") > 0
        assert test_redis_client.ttl("security:ip:10.0.0.1:no_ttl") > 0
        assert test_redis_client.ttl("token:blacklist:expired:no_ttl") > 0
        
        # Check that list was trimmed
        assert test_redis_client.llen("security:user:999") == 100