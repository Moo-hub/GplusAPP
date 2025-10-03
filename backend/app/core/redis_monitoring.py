"""
Redis monitoring alerts system.
This module integrates with redis_memory_monitor and redis_tasks
to provide automated alerts based on Redis performance metrics.
"""

import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.redis_memory_monitor import RedisMemoryMonitor
from app.core.redis_client import RedisClient
from app.core.redis_alerts import (
    AlertType, AlertSeverity, send_alert
)

logger = logging.getLogger("redis_monitoring")

class RedisMonitoringAlerts:
    """
    Redis monitoring alerts system that checks Redis performance
    and sends alerts when thresholds are exceeded.
    """
    
    def __init__(self, redis_client: Optional[RedisClient] = None, memory_monitor: Optional[RedisMemoryMonitor] = None):
        """
        Initialize the Redis monitoring alerts system
        
        Args:
            redis_client: Redis client instance. If None, creates a default instance
            memory_monitor: Optional RedisMemoryMonitor instance. If not provided,
                           a new instance will be created.
        """
        from app.core.config import settings
        
        # In test environment, create mock objects
        if settings.ENVIRONMENT == "test":
            self.redis = redis_client or None
            self.memory_monitor = None
            self.last_stats = {}
            self.alert_history = {}
            return
            
        # Regular environment
        self.redis = redis_client or RedisClient()
        self.memory_monitor = memory_monitor or RedisMemoryMonitor(self.redis)
        self.last_stats = {}  # Store previous stats for trend analysis
        self.alert_history = {}  # Track alert history
        
    async def check_memory_usage(self) -> Dict[str, Any]:
        """
        Check Redis memory usage and send alerts if thresholds are exceeded
        
        Returns:
            Dictionary with memory usage metrics and alert status
        """
        from app.core.config import settings
        
        # In test environment, return mock data
        if settings.ENVIRONMENT == "test":
            return {
                "status": "ok",
                "environment": "test",
                "memory_used": 0,
                "memory_percent": 0,
                "pressure_level": "low",
                "alerts_triggered": False
            }
            
        try:
            # Get memory metrics using the memory monitor
            memory_info = await self.memory_monitor.get_memory_usage()
            pressure_level = await self.memory_monitor.detect_memory_pressure()
            
            if not memory_info:
                logger.warning("Failed to get Redis memory usage information")
                return {"success": False, "error": "Failed to get memory metrics"}
            
            # Extract key metrics
            used_memory_gb = memory_info.get("used_memory_human", "0B")
            max_memory_gb = memory_info.get("maxmemory_human", "0B")
            used_percent = memory_info.get("used_percent", 0)
            fragmentation_ratio = memory_info.get("mem_fragmentation_ratio", 0)
            
            # Store metrics for reporting
            result = {
                "success": True,
                "used_memory": used_memory_gb,
                "max_memory": max_memory_gb,
                "used_percent": used_percent,
                "fragmentation_ratio": fragmentation_ratio,
                "pressure_level": pressure_level,
                "alerts_sent": []
            }
            
            # Alert on high memory usage
            if used_percent >= 90:
                alert_sent = send_alert(
                    alert_type=AlertType.MEMORY,
                    severity=AlertSeverity.CRITICAL,
                    title="Critical Redis Memory Usage",
                    message=f"Redis memory usage is critically high at {used_percent:.1f}%",
                    details={
                        "used_memory": used_memory_gb,
                        "max_memory": max_memory_gb,
                        "used_percent": used_percent,
                        "pressure_level": pressure_level
                    },
                    alert_subtype="high_memory"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("critical_memory_usage")
                    
            elif used_percent >= 75:
                alert_sent = send_alert(
                    alert_type=AlertType.MEMORY,
                    severity=AlertSeverity.WARNING,
                    title="High Redis Memory Usage",
                    message=f"Redis memory usage is high at {used_percent:.1f}%",
                    details={
                        "used_memory": used_memory_gb,
                        "max_memory": max_memory_gb,
                        "used_percent": used_percent,
                        "pressure_level": pressure_level
                    },
                    alert_subtype="high_memory"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("high_memory_usage")
            
            # Alert on memory pressure level
            if pressure_level == "critical":
                alert_sent = send_alert(
                    alert_type=AlertType.MEMORY,
                    severity=AlertSeverity.CRITICAL,
                    title="Critical Redis Memory Pressure",
                    message="Redis is experiencing critical memory pressure. Performance degradation likely.",
                    details={
                        "used_memory": used_memory_gb,
                        "max_memory": max_memory_gb,
                        "used_percent": used_percent,
                        "pressure_level": pressure_level,
                        "fragmentation_ratio": fragmentation_ratio
                    },
                    alert_subtype="memory_pressure"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("critical_memory_pressure")
                    
            elif pressure_level == "high":
                alert_sent = send_alert(
                    alert_type=AlertType.MEMORY,
                    severity=AlertSeverity.WARNING,
                    title="High Redis Memory Pressure",
                    message="Redis is experiencing high memory pressure. Performance may be affected.",
                    details={
                        "used_memory": used_memory_gb,
                        "max_memory": max_memory_gb,
                        "used_percent": used_percent,
                        "pressure_level": pressure_level,
                        "fragmentation_ratio": fragmentation_ratio
                    },
                    alert_subtype="memory_pressure"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("high_memory_pressure")
            
            # Alert on high fragmentation ratio (if > 3.0)
            if fragmentation_ratio > 3.0:
                alert_sent = send_alert(
                    alert_type=AlertType.MEMORY,
                    severity=AlertSeverity.WARNING,
                    title="High Redis Memory Fragmentation",
                    message=f"Redis has high memory fragmentation ratio: {fragmentation_ratio:.2f}",
                    details={
                        "fragmentation_ratio": fragmentation_ratio,
                        "used_memory": used_memory_gb
                    },
                    alert_subtype="fragmentation"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("high_fragmentation")
            
            # Save metrics for trend analysis
            self.last_stats["memory"] = {
                "timestamp": datetime.now(),
                "used_percent": used_percent,
                "pressure_level": pressure_level,
                "fragmentation_ratio": fragmentation_ratio
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking Redis memory usage: {str(e)}")
            return {"success": False, "error": str(e)}
            
    async def check_cache_hit_rate(self) -> Dict[str, Any]:
        """
        Check Redis cache hit rate and send alerts if too low
        
        Returns:
            Dictionary with hit rate metrics and alert status
        """
        try:
            # Get Redis stats
            info = await self.redis.client.info("stats")
            
            keyspace_hits = int(info.get("keyspace_hits", 0))
            keyspace_misses = int(info.get("keyspace_misses", 0))
            
            total_ops = keyspace_hits + keyspace_misses
            
            # Calculate hit rate
            hit_rate = 0
            if total_ops > 0:
                hit_rate = (keyspace_hits / total_ops) * 100
            
            result = {
                "success": True,
                "hit_rate": hit_rate,
                "keyspace_hits": keyspace_hits,
                "keyspace_misses": keyspace_misses,
                "total_ops": total_ops,
                "alerts_sent": []
            }
            
            # Only alert if there are sufficient operations (> 1000)
            if total_ops > 1000:
                # Alert on low hit rate
                if hit_rate < 50:
                    alert_sent = send_alert(
                        alert_type=AlertType.PERFORMANCE,
                        severity=AlertSeverity.WARNING,
                        title="Low Redis Cache Hit Rate",
                        message=f"Redis cache hit rate is low at {hit_rate:.1f}%",
                        details={
                            "hit_rate": hit_rate,
                            "keyspace_hits": keyspace_hits,
                            "keyspace_misses": keyspace_misses,
                            "total_ops": total_ops
                        },
                        alert_subtype="hit_rate"
                    )
                    
                    if alert_sent:
                        result["alerts_sent"].append("low_hit_rate")
            
            # Save metrics for trend analysis
            self.last_stats["hit_rate"] = {
                "timestamp": datetime.now(),
                "hit_rate": hit_rate,
                "total_ops": total_ops
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking Redis cache hit rate: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def check_connection_status(self) -> Dict[str, Any]:
        """
        Check Redis connection status and metrics
        
        Returns:
            Dictionary with connection metrics and alert status
        """
        try:
            # Get Redis client info
            info = await self.redis.client.info("clients")
            
            # Extract metrics
            connected_clients = int(info.get("connected_clients", 0))
            blocked_clients = int(info.get("blocked_clients", 0))
            max_clients = int(info.get("maxclients", 10000))
            
            # Calculate percentage of connections used
            connection_percent = (connected_clients / max_clients) * 100 if max_clients > 0 else 0
            
            result = {
                "success": True,
                "connected_clients": connected_clients,
                "blocked_clients": blocked_clients,
                "max_clients": max_clients,
                "connection_percent": connection_percent,
                "alerts_sent": []
            }
            
            # Alert on high connection usage
            if connection_percent >= 90:
                alert_sent = send_alert(
                    alert_type=AlertType.CONNECTION,
                    severity=AlertSeverity.CRITICAL,
                    title="Critical Redis Connection Usage",
                    message=f"Redis connections at {connection_percent:.1f}% of maximum ({connected_clients}/{max_clients})",
                    details={
                        "connected_clients": connected_clients,
                        "max_clients": max_clients,
                        "connection_percent": connection_percent,
                        "blocked_clients": blocked_clients
                    },
                    alert_subtype="connections"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("critical_connections")
                    
            elif connection_percent >= 75:
                alert_sent = send_alert(
                    alert_type=AlertType.CONNECTION,
                    severity=AlertSeverity.WARNING,
                    title="High Redis Connection Usage",
                    message=f"Redis connections at {connection_percent:.1f}% of maximum ({connected_clients}/{max_clients})",
                    details={
                        "connected_clients": connected_clients,
                        "max_clients": max_clients,
                        "connection_percent": connection_percent,
                        "blocked_clients": blocked_clients
                    },
                    alert_subtype="connections"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("high_connections")
            
            # Alert on blocked clients
            if blocked_clients > 5:
                alert_sent = send_alert(
                    alert_type=AlertType.CONNECTION,
                    severity=AlertSeverity.WARNING,
                    title="Redis Blocked Clients",
                    message=f"Redis has {blocked_clients} blocked clients, which may indicate slow operations",
                    details={
                        "blocked_clients": blocked_clients,
                        "connected_clients": connected_clients
                    },
                    alert_subtype="blocked"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("blocked_clients")
            
            # Save metrics for trend analysis
            self.last_stats["connections"] = {
                "timestamp": datetime.now(),
                "connected_clients": connected_clients,
                "blocked_clients": blocked_clients,
                "connection_percent": connection_percent
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking Redis connection status: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def check_slow_operations(self) -> Dict[str, Any]:
        """
        Check for slow Redis operations
        
        Returns:
            Dictionary with slow operation metrics and alert status
        """
        try:
            # Get Redis slow log
            slowlog = await self.redis.client.slowlog_get(10)  # Get last 10 slow operations
            
            # Extract and format slow operations
            slow_operations = []
            has_recent_slow_ops = False
            
            for entry in slowlog:
                # Convert unix timestamp to datetime
                timestamp = datetime.fromtimestamp(entry['time'])
                
                # Check if this is a recent slow operation (within last hour)
                is_recent = (datetime.now() - timestamp).total_seconds() < 3600
                
                if is_recent:
                    has_recent_slow_ops = True
                
                slow_operations.append({
                    "command": entry['command'],
                    "execution_time_us": entry['duration'],
                    "execution_time_ms": entry['duration'] / 1000,
                    "timestamp": timestamp.isoformat(),
                    "is_recent": is_recent
                })
            
            result = {
                "success": True,
                "slow_operations_count": len(slowlog),
                "slow_operations": slow_operations,
                "has_recent_slow_ops": has_recent_slow_ops,
                "alerts_sent": []
            }
            
            # Alert on recent slow operations
            if has_recent_slow_ops and slow_operations:
                # Find the slowest recent operation
                slowest_op = max([op for op in slow_operations if op["is_recent"]], 
                                key=lambda x: x["execution_time_ms"])
                
                alert_sent = send_alert(
                    alert_type=AlertType.PERFORMANCE,
                    severity=AlertSeverity.WARNING,
                    title="Slow Redis Operations Detected",
                    message=f"Detected {len(slow_operations)} slow Redis operations. " +
                           f"Slowest: {slowest_op['execution_time_ms']:.2f}ms",
                    details={
                        "slowest_op_command": str(slowest_op["command"]),
                        "slowest_op_time_ms": slowest_op["execution_time_ms"],
                        "slow_operations_count": len(slow_operations)
                    },
                    alert_subtype="slow_ops"
                )
                
                if alert_sent:
                    result["alerts_sent"].append("slow_operations")
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking Redis slow operations: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def check_keyspace_stats(self) -> Dict[str, Any]:
        """
        Check Redis keyspace statistics
        
        Returns:
            Dictionary with keyspace metrics and alert status
        """
        try:
            # Get Redis keyspace info
            keyspace = await self.redis.client.info("keyspace")
            
            # Calculate total keys across all databases
            total_keys = 0
            expired_keys = 0
            evicted_keys = 0
            
            # Process each database
            databases = {}
            for db, stats in keyspace.items():
                if db.startswith("db"):
                    db_keys = int(stats.get("keys", 0))
                    db_expires = int(stats.get("expires", 0))
                    db_avg_ttl = int(stats.get("avg_ttl", 0))
                    
                    total_keys += db_keys
                    expired_keys += db_expires
                    
                    databases[db] = {
                        "keys": db_keys,
                        "expires": db_expires,
                        "avg_ttl": db_avg_ttl
                    }
            
            # Get evicted keys from stats
            stats = await self.redis.client.info("stats")
            evicted_keys = int(stats.get("evicted_keys", 0))
            
            # Get expired keys count
            expired_keys_total = int(stats.get("expired_keys", 0))
            
            result = {
                "success": True,
                "total_keys": total_keys,
                "expired_keys": expired_keys_total,
                "evicted_keys": evicted_keys,
                "databases": databases,
                "alerts_sent": []
            }
            
            # Check if we have previous stats for trend analysis
            if "keyspace" in self.last_stats:
                last_evicted = self.last_stats["keyspace"].get("evicted_keys", 0)
                evicted_diff = evicted_keys - last_evicted
                
                # Alert on high eviction rate (if > 1000 keys were evicted since last check)
                if evicted_diff > 1000:
                    alert_sent = send_alert(
                        alert_type=AlertType.KEYS,
                        severity=AlertSeverity.WARNING,
                        title="High Redis Key Eviction Rate",
                        message=f"Redis has evicted {evicted_diff} keys since last check",
                        details={
                            "evicted_keys_total": evicted_keys,
                            "evicted_since_last_check": evicted_diff,
                            "total_keys": total_keys
                        },
                        alert_subtype="eviction"
                    )
                    
                    if alert_sent:
                        result["alerts_sent"].append("high_eviction")
            
            # Save metrics for trend analysis
            self.last_stats["keyspace"] = {
                "timestamp": datetime.now(),
                "total_keys": total_keys,
                "expired_keys": expired_keys_total,
                "evicted_keys": evicted_keys
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking Redis keyspace stats: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """
        Run all Redis monitoring checks in parallel
        
        Returns:
            Dictionary with all check results
        """
        # Run all checks in parallel
        results = await asyncio.gather(
            self.check_memory_usage(),
            self.check_cache_hit_rate(),
            self.check_connection_status(),
            self.check_slow_operations(),
            self.check_keyspace_stats(),
            return_exceptions=True
        )
        
        # Process results
        checks = ["memory", "hit_rate", "connections", "slow_ops", "keyspace"]
        all_results = {}
        
        for i, result in enumerate(results):
            check_name = checks[i]
            
            if isinstance(result, Exception):
                all_results[check_name] = {
                    "success": False,
                    "error": str(result)
                }
            else:
                all_results[check_name] = result
        
        # Aggregate alerts sent
        all_alerts = []
        for check in all_results.values():
            if isinstance(check, dict) and check.get("success") and "alerts_sent" in check:
                all_alerts.extend(check["alerts_sent"])
        
        return {
            "timestamp": datetime.now().isoformat(),
            "checks": all_results,
            "alerts_sent": all_alerts,
            "alert_count": len(all_alerts)
        }

async def run_monitoring_check(redis_client: RedisClient) -> Dict[str, Any]:
    """
    Run a single monitoring check cycle and send alerts as needed.
    This is designed to be called by a scheduler.
    
    Args:
        redis_client: Redis client instance
        
    Returns:
        Dictionary with check results
    """
    monitor = RedisMonitoringAlerts(redis_client)
    return await monitor.run_all_checks()