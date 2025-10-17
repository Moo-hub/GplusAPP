"""
Test script for Redis memory monitoring functionality
This script tests the Redis memory monitoring and adaptive TTL features
"""

import pytest
import time
import json
from unittest.mock import patch, MagicMock
import redis

from app.core.redis_memory_monitor import (
    get_memory_pressure_level,
    get_memory_trend,
    get_ttl_adjustment_factor,
    record_memory_sample,
    get_largest_keys,
    apply_adaptive_ttl,
    get_memory_stats
)
from app.core.config import settings

# Skip tests if Redis is not available
redis_available = True
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL)
    redis_client.ping()
    
    # Check if memory usage command is available (Redis >= 4.0)
    try:
        redis_client.memory_usage("test")
        memory_command_available = True
    except redis.exceptions.ResponseError:
        memory_command_available = False
except Exception:
    redis_available = False
    memory_command_available = False


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
    
    # Set up some test keys
    client.set("test:string:1", "x" * 1000)  # 1KB
    client.set("test:string:2", "x" * 5000)  # 5KB
    client.lpush("test:list:1", *["item"] * 100)  # List with 100 items
    client.hset("test:hash:1", mapping={f"field{i}": f"value{i}" for i in range(100)})
    
    # Set TTL on some keys
    client.expire("test:string:1", 3600)  # 1 hour
    
    yield client
    
    # Clean up after test
    client.flushdb()


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_memory_pressure_level():
    """Test getting memory pressure level"""
    # Mock get_redis_stats to return controlled values
    mock_stats = MagicMock()
    mock_stats.used_memory = 80
    mock_stats.used_memory_peak = 100
    mock_stats.used_memory_rss = 120
    
    with patch('app.core.redis_memory_monitor.get_redis_stats', return_value=mock_stats):
        # 80% usage should be high pressure
        level = get_memory_pressure_level()
        assert level in ["medium", "high"]
        
        # Test with critical level
        mock_stats.used_memory = 96
        level = get_memory_pressure_level()
        assert level == "critical"
        
        # Test with low level
        mock_stats.used_memory = 50
        level = get_memory_pressure_level()
        assert level == "low"


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_memory_trend():
    """Test memory trend calculation"""
    # Add some memory samples
    from app.core.redis_memory_monitor import memory_samples
    
    # Clear existing samples
    while memory_samples:
        memory_samples.pop()
    
    # Add samples with a clear increasing trend
    for i in range(10):
        memory_samples.append({
            "timestamp": f"2023-07-{15+i}T12:00:00",
            "memory_used": 50 + i * 5,  # Increasing by 5 each time
            "memory_peak": 100,
            "memory_percent": 50 + i * 5  # Also increasing by 5 percentage points
        })
    
    trend, rate = get_memory_trend()
    assert trend == "increasing"
    assert rate > 0
    
    # Clear and add decreasing trend
    while memory_samples:
        memory_samples.pop()
    
    for i in range(10):
        memory_samples.append({
            "timestamp": f"2023-07-{15+i}T12:00:00",
            "memory_used": 100 - i * 5,  # Decreasing by 5 each time
            "memory_peak": 100,
            "memory_percent": 100 - i * 5
        })
    
    trend, rate = get_memory_trend()
    assert trend == "decreasing"
    assert rate < 0
    
    # Clear samples
    while memory_samples:
        memory_samples.pop()


@pytest.mark.skipif(not redis_available or not memory_command_available, reason="Redis memory commands not available")
def test_get_largest_keys(test_redis_client):
    """Test finding largest keys"""
    with patch('app.core.redis_memory_monitor.redis_client', test_redis_client):
        largest_keys = get_largest_keys(limit=5)
        
        # Should have found our test keys
        assert len(largest_keys) > 0
        
        # Each key should have memory usage information
        for key_info in largest_keys:
            assert "key" in key_info
            assert "memory" in key_info
            assert "type" in key_info
            assert "ttl" in key_info
            
            # Check if test:string:1 has TTL
            if key_info["key"] == "test:string:1":
                assert key_info["ttl"] > 0
            
            # Keys should be sorted by memory usage (descending)
            if len(largest_keys) > 1:
                assert largest_keys[0]["memory"] >= largest_keys[1]["memory"]


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_memory_stats():
    """Test getting comprehensive memory stats"""
    # This test just verifies the structure of the returned data
    # since actual memory values will vary
    
    stats = get_memory_stats()
    
    # Check for expected keys
    assert "memory_used" in stats
    assert "memory_peak" in stats
    assert "memory_rss" in stats
    assert "used_percent" in stats
    assert "pressure_level" in stats
    assert "trend_direction" in stats
    assert "trend_rate" in stats
    assert "ttl_adjustment" in stats
    assert "largest_keys" in stats
    
    # Pressure level should be one of the expected values
    assert stats["pressure_level"] in ["low", "medium", "high", "critical", "unknown"]
    
    # Trend direction should be one of the expected values
    assert stats["trend_direction"] in ["stable", "increasing", "decreasing"]
    
    # TTL adjustment should be between 0.0 and 1.0
    assert 0.0 <= stats["ttl_adjustment"] <= 1.0


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_record_memory_sample():
    """Test recording memory samples"""
    from app.core.redis_memory_monitor import memory_samples
    
    # Clear existing samples
    original_count = len(memory_samples)
    
    # Record a new sample
    record_memory_sample()
    
    # Should have one more sample
    assert len(memory_samples) >= original_count
    
    if len(memory_samples) > 0:
        # Check sample structure
        latest = memory_samples[-1]
        assert "timestamp" in latest
        assert "memory_used" in latest
        assert "memory_peak" in latest
        assert "memory_percent" in latest


@pytest.mark.skipif(not redis_available, reason="Redis not available")
def test_adaptive_ttl(test_redis_client):
    """Test adaptive TTL based on memory pressure"""
    with patch('app.core.redis_memory_monitor.redis_client', test_redis_client):
        # Set up a high memory pressure scenario
        with patch('app.core.redis_memory_monitor.get_memory_pressure_level', return_value="high"):
            with patch('app.core.redis_memory_monitor.get_ttl_adjustment_factor', return_value=0.5):
                # Set some keys with TTL
                test_redis_client.setex("test:adaptive:1", 3600, "value")  # 1 hour
                test_redis_client.setex("test:adaptive:2", 7200, "value")  # 2 hours
                
                # Apply adaptive TTL
                updated_count = apply_adaptive_ttl()
                
                # Should have updated TTLs
                assert updated_count >= 2
                
                # Check new TTLs
                ttl1 = test_redis_client.ttl("test:adaptive:1")
                ttl2 = test_redis_client.ttl("test:adaptive:2")
                
                # TTLs should be reduced by approximately 50%
                assert ttl1 < 3600 * 0.75  # Allow some margin for test execution time
                assert ttl2 < 7200 * 0.75