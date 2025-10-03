"""
Tests for Redis monitoring alert functionality
"""
import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.redis_monitoring import RedisMonitoringAlerts, run_monitoring_check
from app.core.redis_alerts import AlertType, AlertSeverity


@pytest.fixture
def mock_redis_client():
    redis_client = MagicMock()
    redis_client.client = AsyncMock()
    
    # Mock info method to return test data
    async def mock_info(section=None):
        if section == "memory":
            return {
                "used_memory": "10485760",  # 10MB
                "used_memory_human": "10.00M",
                "used_memory_peak": "15728640",  # 15MB
                "used_memory_peak_human": "15.00M",
                "maxmemory": "104857600",  # 100MB
                "maxmemory_human": "100.00M",
                "mem_fragmentation_ratio": "1.5",
            }
        elif section == "stats":
            return {
                "keyspace_hits": "80",
                "keyspace_misses": "20",
                "expired_keys": "50",
                "evicted_keys": "10",
            }
        elif section == "clients":
            return {
                "connected_clients": "50",
                "blocked_clients": "2",
                "maxclients": "1000",
            }
        elif section == "keyspace":
            return {
                "db0": {
                    "keys": "100",
                    "expires": "50",
                    "avg_ttl": "3600000",
                }
            }
        return {}
        
    redis_client.client.info = mock_info
    
    # Mock slowlog_get method
    async def mock_slowlog_get(count):
        return [
            {
                'id': 123,
                'time': asyncio.get_event_loop().time() - 60,  # 1 minute ago
                'duration': 25000,  # 25ms
                'command': ['GET', 'test:key'],
            }
        ]
    
    redis_client.client.slowlog_get = mock_slowlog_get
    
    return redis_client


@pytest.fixture
def mock_memory_monitor():
    monitor = MagicMock()
    
    async def mock_get_memory_usage():
        return {
            "used_memory": 10485760,  # 10MB
            "used_memory_human": "10.00M",
            "maxmemory": 104857600,  # 100MB
            "maxmemory_human": "100.00M",
            "used_percent": 10.0,
            "mem_fragmentation_ratio": 1.5,
        }
    
    async def mock_detect_memory_pressure():
        return "normal"  # normal, high, critical
    
    monitor.get_memory_usage = mock_get_memory_usage
    monitor.detect_memory_pressure = mock_detect_memory_pressure
    
    return monitor


@patch('app.core.redis_alerts.send_alert')
async def test_check_memory_usage_normal(mock_send_alert, mock_redis_client, mock_memory_monitor):
    """Test memory usage check with normal levels"""
    # Setup
    monitoring = RedisMonitoringAlerts(mock_redis_client, mock_memory_monitor)
    
    # Execute
    result = await monitoring.check_memory_usage()
    
    # Verify
    assert result["success"] is True
    assert result["used_percent"] == 10.0
    assert "alerts_sent" in result
    assert len(result["alerts_sent"]) == 0  # No alerts should be sent for normal levels
    mock_send_alert.assert_not_called()


@patch('app.core.redis_alerts.send_alert')
async def test_check_memory_usage_warning(mock_send_alert, mock_redis_client, mock_memory_monitor):
    """Test memory usage check with warning levels"""
    # Setup
    monitoring = RedisMonitoringAlerts(mock_redis_client, mock_memory_monitor)
    
    # Mock memory monitor to return high memory usage
    async def mock_high_memory():
        return {
            "used_memory": 78643200,  # 75MB
            "used_memory_human": "75.00M",
            "maxmemory": 104857600,  # 100MB
            "maxmemory_human": "100.00M",
            "used_percent": 75.0,
            "mem_fragmentation_ratio": 1.5,
        }
    
    monitoring.memory_monitor.get_memory_usage = mock_high_memory
    mock_send_alert.return_value = True  # Alert was sent successfully
    
    # Execute
    result = await monitoring.check_memory_usage()
    
    # Verify
    assert result["success"] is True
    assert result["used_percent"] == 75.0
    assert "alerts_sent" in result
    assert "high_memory_usage" in result["alerts_sent"]
    mock_send_alert.assert_called_once()
    call_args = mock_send_alert.call_args[1]
    assert call_args["alert_type"] == AlertType.MEMORY
    assert call_args["severity"] == AlertSeverity.WARNING


@patch('app.core.redis_alerts.send_alert')
async def test_check_cache_hit_rate(mock_send_alert, mock_redis_client):
    """Test cache hit rate check"""
    # Setup
    monitoring = RedisMonitoringAlerts(mock_redis_client)
    mock_send_alert.return_value = False  # No alert should be sent for good hit rate
    
    # Execute
    result = await monitoring.check_cache_hit_rate()
    
    # Verify
    assert result["success"] is True
    assert result["hit_rate"] == 80.0  # 80/(80+20)*100 = 80%
    assert len(result["alerts_sent"]) == 0  # No alerts for good hit rate
    mock_send_alert.assert_not_called()


@patch('app.core.redis_alerts.send_alert')
async def test_check_connection_status(mock_send_alert, mock_redis_client):
    """Test connection status check"""
    # Setup
    monitoring = RedisMonitoringAlerts(mock_redis_client)
    mock_send_alert.return_value = False  # No alert should be sent for normal connections
    
    # Execute
    result = await monitoring.check_connection_status()
    
    # Verify
    assert result["success"] is True
    assert result["connection_percent"] == 5.0  # 50/1000*100 = 5%
    assert len(result["alerts_sent"]) == 0  # No alerts for normal connection usage
    mock_send_alert.assert_not_called()


@patch('app.core.redis_alerts.send_alert')
async def test_run_all_checks(mock_send_alert, mock_redis_client, mock_memory_monitor):
    """Test running all monitoring checks"""
    # Setup
    monitoring = RedisMonitoringAlerts(mock_redis_client, mock_memory_monitor)
    mock_send_alert.return_value = False  # No alerts should be sent for normal values
    
    # Execute
    result = await monitoring.run_all_checks()
    
    # Verify
    assert "checks" in result
    assert "memory" in result["checks"]
    assert "hit_rate" in result["checks"]
    assert "connections" in result["checks"]
    assert "slow_ops" in result["checks"]
    assert "keyspace" in result["checks"]
    
    assert result["alert_count"] == 0  # No alerts for normal values
    assert len(result["alerts_sent"]) == 0


@patch('app.core.redis_monitoring.RedisMonitoringAlerts')
async def test_run_monitoring_check(mock_monitoring_alerts, mock_redis_client):
    """Test the run_monitoring_check function"""
    # Setup
    instance = mock_monitoring_alerts.return_value
    instance.run_all_checks.return_value = {
        "timestamp": "2023-01-01T00:00:00",
        "checks": {},
        "alerts_sent": [],
        "alert_count": 0
    }
    
    # Execute
    result = await run_monitoring_check(mock_redis_client)
    
    # Verify
    mock_monitoring_alerts.assert_called_once_with(mock_redis_client)
    instance.run_all_checks.assert_called_once()
    assert result["alert_count"] == 0