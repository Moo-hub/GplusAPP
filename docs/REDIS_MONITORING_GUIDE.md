# Redis Performance Monitoring and Optimization Guide

This document outlines the Redis performance monitoring, optimization, and data retention strategies implemented in the GPlus Recycling App.

## Overview

Redis is used for several critical functions in our application:

- Storing security events and monitoring data
- Token blacklisting for JWT authentication
- Rate limiting for sensitive endpoints
- Caching of frequently accessed data
- Performance optimization for database queries
- Session management and real-time features

To ensure optimal performance and prevent Redis memory issues, we've implemented:

1. Structured caching with proper namespacing and TTL values
2. Automatic data retention policies with TTLs
3. List size limitations for high-volume data
4. Scheduled monitoring and optimization
5. Cache performance metrics (hit/miss ratio)
6. Memory usage alerts and adaptive TTL
7. Automatic cache invalidation
8. Cache preloading for common queries

## Retention Policies

The following retention policies are automatically applied:

| Key Pattern | Retention Period | Description |
|-------------|------------------|-------------|
| security:event:* | 30 days | Individual security events |
| security:ip:* | 7 days | IP-based security tracking |
| security:user:* | 30 days | User-based security tracking |
| security:login:* | 7 days | Login attempt tracking |
| security:login_ip:* | 7 days | IP-based login attempt tracking |
| token:blacklist:* | 7 days | Token blacklist |

## List Size Limitations

For Redis lists that could grow indefinitely, we enforce maximum lengths:

| Key Pattern | Maximum Length | Description |
|-------------|----------------|-------------|
| security:ip:* | 100 | Keep last 100 events per IP |
| security:user:* | 100 | Keep last 100 events per user |
| security:login:* | 20 | Keep last 20 login attempts per email |
| security:login_ip:* | 20 | Keep last 20 login attempts per IP |

## Scheduled Tasks

The application automatically runs the following tasks:

1. **Redis Stats Logging**: Every 30 minutes
   - Logs Redis memory usage and key statistics
   - Checks against memory thresholds

2. **Retention Policy Enforcement**: Every 3 hours
   - Ensures all keys have proper TTL values
   - Trims lists that exceed maximum lengths

3. **Full Optimization**: Daily at 3:00 AM
   - Logs detailed Redis statistics
   - Applies all retention policies
   - Reports keys without expiry
   - Analyzes memory usage by key pattern

## Memory Monitoring and Management

### Memory Usage Thresholds

- **Low Level**: Below 60% of peak memory usage
- **Medium Level**: Between 60% and 75% of peak memory usage
- **High Level**: Between 75% and 85% of peak memory usage
- **Critical Level**: Above 85% of peak memory usage

When these thresholds are exceeded, alerts are logged, notification alerts are sent, and automatic optimization actions are taken.

### Memory Trend Analysis

The system tracks memory usage over time to detect trends:

- **Stable**: Memory usage changing less than 1 percentage point per hour
- **Increasing**: Memory usage growing more than 1 percentage point per hour
- **Decreasing**: Memory usage reducing more than 1 percentage point per hour

Trend analysis helps predict future memory issues and take preemptive actions.

### Automated Monitoring Alerts

The system now includes comprehensive automated monitoring and alerting:

1. **Monitoring Interval**: Every 15 minutes (configurable)
2. **Alert Channels**:
   - Email notifications
   - Slack channel alerts
   - Log entries
   - Custom webhook integrations

3. **Alert Types**:
   - **Memory Usage Alerts**: Warning (75%) and Critical (90%) thresholds
   - **Memory Pressure Alerts**: Based on memory pressure detection
   - **Cache Hit Rate Alerts**: When hit rate falls below 50%
   - **Connection Usage Alerts**: Warning (75%) and Critical (90%) thresholds
   - **Slow Operation Alerts**: When Redis operations take too long
   - **Key Eviction Rate Alerts**: When keys are being evicted rapidly

4. **Alert Format**:
   - Type of issue detected
   - Severity level (info, warning, critical)
   - Detailed message with relevant metrics
   - Timestamp of detection
   - Structured data for analysis

5. **Cooldown Periods**:
   - Memory alerts: 30 minutes
   - Performance alerts: 15 minutes
   - Connection alerts: 10 minutes
   - Key-related alerts: 60 minutes

### Automated Responses to Memory Pressure

1. **Adaptive TTL**: Automatically reduce TTL for cached items based on memory pressure
2. **Eviction of Large Keys**: During critical memory pressure, large cache keys are identified and evicted
3. **Memory Usage Reporting**: Detailed memory reports show largest keys and usage patterns

## Monitoring CLI Tool

A command-line tool is provided for manual monitoring and optimization:

```bash
# Show Redis statistics
python backend/scripts/redis_monitor_cli.py stats

# Run retention policies manually
python backend/scripts/redis_monitor_cli.py retention

# Run full optimization
python backend/scripts/redis_monitor_cli.py optimize

# Show keys without expiry
python backend/scripts/redis_monitor_cli.py keys

# Show memory usage by pattern
python backend/scripts/redis_monitor_cli.py patterns

# Show detailed memory statistics with trend analysis
python backend/scripts/redis_monitor_cli.py memory

# Show cache performance metrics
python backend/scripts/redis_monitor_cli.py cache

# Run cache preloading for common queries
python backend/scripts/redis_monitor_cli.py preload

# Invalidate cache namespace
python backend/scripts/redis_monitor_cli.py invalidate <namespace>

# Apply adaptive TTL based on memory pressure
python backend/scripts/redis_monitor_cli.py adaptive-ttl

# Reset cache metrics
python backend/scripts/redis_monitor_cli.py reset-metrics
```

## Integration with Grafana

Redis metrics are exported via Prometheus and visualized in our comprehensive Grafana dashboards. The system provides detailed monitoring of all Redis performance aspects through a dedicated dashboard located at:

```
grafana/provisioning/dashboards/redis-performance-dashboard.json
```

### Redis Performance Dashboard

The Redis Performance Dashboard is organized into several key sections to provide a comprehensive view of your Redis instance health and performance:

#### 1. Overview Metrics

- **Connected Clients**: Shows the number of clients connected to Redis with color-coded thresholds
- **Memory Usage**: Gauge showing percentage of allocated memory in use
- **Cache Hit Ratio**: Percentage of successful cache lookups
- **Uptime**: How long the Redis instance has been running
- **Total Commands**: Commands processed per second

#### 2. Memory Metrics

- **Memory Usage Over Time**: Graph of Redis memory consumption
- **Memory Fragmentation Ratio**: Memory allocation efficiency
- **Used Memory by Database**: Breakdown of memory usage by Redis DB
- **Evictions**: Rate of key evictions due to memory limits
- **Expired Keys**: Rate of key expirations

#### 3. Performance Metrics

- **Commands Per Second**: Rate of command execution
- **Network Traffic**: Inbound and outbound network traffic
- **Command Latency**: Average execution time of commands
- **Command Types**: Breakdown of command types (GET, SET, etc.)
- **Keyspace Operations**: Operations per database

#### 4. Connection Metrics

- **Connected Clients Over Time**: Graph of client connections
- **Connection Acceptance Rate**: New connections per second
- **Rejected Connections**: Failed connection attempts
- **Blocked Clients**: Clients waiting on blocking operations

#### 5. Cache Performance

- **Hit Rate Over Time**: Cache efficiency trends
- **Hits vs Misses**: Comparison of cache hits and misses
- **Keys Per Database**: Number of keys in each database
- **TTL Distribution**: Distribution of Time-To-Live values

### Dashboard Panels Explained

#### Key Performance Indicators

1. **Memory Usage**: Represented as a gauge with color-coded thresholds:
   - Green: < 70% (healthy)
   - Yellow: 70-85% (warning)
   - Orange: 85-95% (high)
   - Red: > 95% (critical)

2. **Cache Hit Ratio**: Color scale representing cache efficiency:
   - Red: < 30% (poor)
   - Orange: 30-70% (moderate)
   - Yellow: 70-90% (good)
   - Green: > 90% (excellent)

3. **Connected Clients**: Shows current client connection count with thresholds:
   - Green: < 20 connections
   - Yellow: 20-50 connections
   - Orange: 50-80 connections
   - Red: > 80 connections (potential connection leak)

### Using the Dashboard Effectively

#### 1. Regular Monitoring Routine

- **Daily Checks**: Review memory usage, hit ratio, and eviction rates
- **Weekly Analysis**: Examine longer-term trends for memory growth and cache efficiency
- **Monthly Review**: Analyze command patterns and optimize caching strategy

#### 2. Troubleshooting with the Dashboard

- **Memory Spikes**: Check memory usage graph alongside command rate and keyspace changes
- **Performance Issues**: Compare command latency with connected clients and memory usage
- **Low Hit Ratio**: Review most frequent commands and adjust caching strategy

#### 3. Using Dashboard for Capacity Planning

- Monitor memory usage trends to predict future resource needs
- Analyze peak usage patterns for proper instance sizing
- Review connection patterns to plan for scaling

### Alert Rules Integration

The dashboard integrates with the following alert rules configured in `alerts/redis_alerts.yml`:

| Alert Name | Condition | Severity | Description |
|------------|-----------|----------|-------------|
| HighRedisConnections | >100 connections for 5m | Warning | High number of Redis connections |
| CriticalRedisConnections | >150 connections for 2m | Critical | Critical number of Redis connections |
| HighRedisMemoryUsage | >85% memory for 5m | Warning | High Redis memory usage |
| CriticalRedisMemoryUsage | >95% memory for 2m | Critical | Critical Redis memory usage |
| HighRedisKeyEvictions | >10 keys/sec for 5m | Warning | High Redis key eviction rate |
| LowRedisHitRatio | <50% hit ratio for 30m | Warning | Low Redis cache hit ratio |
| HighRedisLatency | >5ms command latency for 5m | Warning | High Redis command latency |
| RedisBlockedClients | >5 blocked clients for 5m | Warning | Redis has blocked clients |
| RedisDown | Redis instance down for 1m | Critical | Redis service is down |

## Caching Strategy

The application implements a comprehensive caching strategy with the following components:

### Cache Namespaces

All cached data is organized into namespaces with appropriate TTL values:

| Namespace | TTL | Description |
|-----------|-----|-------------|
| user | 3600s (1 hour) | User profile and preference data |
| pickup | 300s (5 minutes) | Pickup request data (changes frequently) |
| recycling | 1800s (30 minutes) | Recycling item data |
| points | 1800s (30 minutes) | Points and rewards data |
| stats | 300s (5 minutes) | Statistical data |
| general | 1800s (30 minutes) | General application data |

### Cache Performance Metrics

The system tracks and reports the following metrics:

- **Cache Hit Rate**: Percentage of successful cache lookups
- **Cache Miss Rate**: Percentage of lookups that missed the cache
- **Cache Sets**: Number of values stored in the cache
- **Cache Invalidations**: Number of manual cache invalidations

These metrics help optimize the caching strategy by identifying opportunities to improve hit rates.

### Automatic Cache Invalidation

Cache entries are automatically invalidated when the underlying data changes:

- Database update events trigger relevant cache invalidations
- Related data is invalidated using a dependency mapping system
- Both specific keys and entire namespaces can be invalidated as needed

### Cache Preloading

The system preloads frequently accessed data into the cache during off-peak hours:

| Entity Type | Preload Limit | Description |
|-------------|--------------|-------------|
| pickup_request | 100 | Recent pickup requests |
| recycling_item | 100 | Recent recycling items |
| user | 100 | Most active users |
| points_summary | 50 | Top users by points |

This improves response times for common queries by ensuring data is already cached.

### Adaptive TTL

The system adjusts TTL values based on memory pressure:

- **Low Pressure** (<60%): Normal TTL values
- **Medium Pressure** (60-75%): Reduce TTL to 75% of normal
- **High Pressure** (75-85%): Reduce TTL to 50% of normal
- **Critical Pressure** (>85%): Reduce TTL to 25% of normal

This prevents memory issues during high-load periods while maintaining optimal cache performance during normal operation.

## Performance Tuning and Optimization

### Redis Configuration Optimization

Our Redis instance has been tuned for optimal performance with the following configuration settings:

```conf
# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# Persistence settings
save 900 1           # Save after 900 seconds if at least 1 change
save 300 10          # Save after 300 seconds if at least 10 changes
save 60 10000        # Save after 60 seconds if at least 10000 changes
stop-writes-on-bgsave-error yes

# Performance optimization
lazy-free-lazy-eviction yes
lazy-free-lazy-expire yes
lazy-free-lazy-server-del yes
lazy-free-replica-lazy-flush yes

# Client settings
timeout 300
tcp-keepalive 60
clients-output-buffer-limit normal 0 0 0
clients-output-buffer-limit replica 256mb 64mb 60
clients-output-buffer-limit pubsub 32mb 8mb 60
```

### Memory Usage Optimization

#### Key Size Optimization

Use compact key names to reduce memory overhead:

```python
# Bad
redis.set("user_profile:user_id:123456:preferences:theme", "dark")

# Good
redis.set("u:123456:p:t", "dark")
```

Document your key naming conventions in code comments and keep a reference guide.

#### Data Structure Selection

Choose the most memory-efficient data structure for your needs:

| Data Structure | Use Case | Memory Efficiency |
|----------------|----------|-------------------|
| String | Simple values, serialized objects | High |
| Hash | Object properties with field names | Medium-High |
| Sorted Set | Scored/ranked data | Medium |
| Set | Unique collections | Medium |
| List | FIFO/LIFO queues, timelines | Medium-Low |
| HyperLogLog | Counting unique items | Very High |

#### Value Compression

For large values, consider compressing before storing:

```python
import zlib
import json

def compress_and_store(redis_client, key, value, ttl=3600):
    json_data = json.dumps(value)
    compressed = zlib.compress(json_data.encode())
    redis_client.setex(key, ttl, compressed)
    
def retrieve_and_decompress(redis_client, key):
    compressed = redis_client.get(key)
    if not compressed:
        return None
    json_data = zlib.decompress(compressed).decode()
    return json.loads(json_data)
```

### Throughput Optimization

#### Pipelining

Use pipelining for bulk operations to reduce network round trips:

```python
pipe = redis_client.pipeline()
for i in range(1000):
    pipe.set(f"key:{i}", f"value:{i}")
    pipe.expire(f"key:{i}", 3600)
pipe.execute()
```

#### Lua Scripting

Use Lua scripts for complex operations that need to be atomic:

```python
# Script to increment a counter only if it's below a threshold
increment_if_below_script = """
    local current = tonumber(redis.call('get', KEYS[1])) or 0
    local max = tonumber(ARGV[1])
    if current < max then
        return redis.call('incr', KEYS[1])
    end
    return current
"""

# Register and use the script
increment_if_below = redis_client.register_script(increment_if_below_script)
result = increment_if_below(keys=["counter:visits"], args=[100])
```

### Database Optimization

#### Keyspace Notifications

When appropriate, use keyspace notifications for cache invalidation instead of polling:

```python
def setup_keyspace_notifications(redis_client):
    # Configure Redis to send notifications for expired keys
    redis_client.config_set('notify-keyspace-events', 'Ex')
    
    # Setup a listener thread
    pubsub = redis_client.pubsub()
    pubsub.psubscribe('__keyevent@0__:expired')
    
    # Process messages in a separate thread
    for message in pubsub.listen():
        if message['type'] == 'pmessage':
            # Handle expired key event
            expired_key = message['data']
            handle_expired_key(expired_key)
```

#### Multi-level Caching

Implement multi-level caching for frequently accessed data:

1. L1: Local application memory cache (shortest TTL)
2. L2: Redis cache (medium TTL)
3. L3: Database (source of truth)

```python
def get_user_profile(user_id):
    # Check L1 cache (local memory)
    profile = local_cache.get(f"user:{user_id}")
    if profile:
        return profile
        
    # Check L2 cache (Redis)
    profile = redis_client.get(f"user:{user_id}")
    if profile:
        # Deserialize and update L1 cache
        profile = json.loads(profile)
        local_cache.set(f"user:{user_id}", profile, ttl=60)  # 60 seconds
        return profile
        
    # Fetch from database (L3)
    profile = database.fetch_user(user_id)
    
    # Update both cache levels
    redis_client.setex(f"user:{user_id}", 3600, json.dumps(profile))  # 1 hour
    local_cache.set(f"user:{user_id}", profile, ttl=60)  # 60 seconds
    
    return profile
```

## Best Practices

### Cache Design

1. **Proper Cache Namespacing**: Use namespaced keys for all cached data to prevent collisions and enable targeted invalidation.
   ```
   user:<id>:profile       # User profile data
   pickup:<id>:details     # Pickup request details
   security:event:<id>     # Security event data
   ```

2. **Keep Data Retention Periods Short**: Only keep security data for as long as necessary for analysis and troubleshooting.

3. **Limit List Sizes**: For high-volume event tracking, limit the number of entries to avoid memory bloat.

4. **Cache with TTL**: Always use expiration times for cached data appropriate to its volatility.

5. **Monitor Cache Hit Rate**: Regularly check cache performance metrics to identify optimization opportunities.

6. **Preload Common Queries**: Identify and preload data for frequent queries to improve response times.

7. **Implement Automatic Invalidation**: Ensure cache consistency by automatically invalidating entries when data changes.

### Operations

1. **Use TTLs**: Always ensure Redis keys have appropriate TTL values based on their purpose.

2. **Monitor Memory Usage**: Regularly check Redis memory usage to avoid unexpected issues.

3. **Schedule Optimization During Off-Peak Hours**: Run intensive operations like full optimization during low-traffic periods.

4. **Implement Circuit Breakers**: Add circuit breakers to prevent Redis failures from cascading to the entire application.

5. **Regular Backup**: Configure regular RDB snapshots or AOF persistence for data safety.

6. **Version Your Cache Keys**: When data schemas change, update cache key formats to avoid data corruption.
   ```python
   # Key includes version to handle schema changes
   redis_client.set(f"user:v2:{user_id}", json.dumps(user_data))
   ```

7. **Document Cache Strategy**: Maintain documentation of caching decisions, TTL values, and invalidation strategies.

## Monitoring and Troubleshooting

### Daily Monitoring Routine

The following routine should be performed by the on-call engineer to ensure Redis is operating optimally:

1. **Check Redis Dashboard in Grafana**
   - Visit: `http://<grafana-url>/d/redis-performance/redis-performance-dashboard`
   - Review the current metrics in the "Overview" row
   - Verify memory usage is below 70%
   - Confirm cache hit ratio is above 80%

2. **Review Recent Alerts**
   - Check for any Redis-related alerts in the past 24 hours
   - Verify alert resolutions
   - Document any recurring issues

3. **Generate a Daily Redis Health Report**

   ```bash
   python backend/scripts/redis_monitor_cli.py stats > logs/daily_redis_report_$(date +%Y%m%d).txt
   python backend/scripts/redis_monitor_cli.py memory >> logs/daily_redis_report_$(date +%Y%m%d).txt
   python backend/scripts/redis_monitor_cli.py cache >> logs/daily_redis_report_$(date +%Y%m%d).txt
   ```

### Common Redis Issues and Solutions

#### 1. High Memory Usage

**Symptoms**:
- Memory usage gauge in dashboard shows >80% usage
- `HighRedisMemoryUsage` alert triggered
- Increasing memory trend line

**Troubleshooting Steps**:

1. Check for keys without expiry:

   ```bash
   python backend/scripts/redis_monitor_cli.py keys
   ```

2. Identify patterns consuming the most memory:

   ```bash
   python backend/scripts/redis_monitor_cli.py patterns
   ```

3. Run manual optimization to apply retention policies immediately:

   ```bash
   python backend/scripts/redis_monitor_cli.py optimize
   ```

4. If a specific namespace is identified as problematic, consider targeted invalidation:

   ```bash
   python backend/scripts/redis_monitor_cli.py invalidate <namespace>
   ```

5. For persistent issues, adjust retention periods:
   - Edit `RETENTION_POLICIES` in `backend/app/core/redis_monitor.py`
   - Restart the application for changes to take effect

6. For critical memory issues, consider flushing less important data:

   ```bash
   redis-cli -h localhost -p 6379
   > KEYS "cache:*"  # Identify non-critical keys
   > DEL key1 key2   # Delete specific keys
   ```

#### 2. Low Cache Hit Ratio

**Symptoms**:
- Cache hit ratio below 50%
- `LowRedisHitRatio` alert triggered
- Increasing database load

**Troubleshooting Steps**:

1. Check cache performance metrics:

   ```bash
   python backend/scripts/redis_monitor_cli.py cache
   ```

2. Review which namespaces have the lowest hit rates

3. Check if the issue is related to a recent code deployment

4. Consider preloading common queries:

   ```bash
   python backend/scripts/redis_monitor_cli.py preload
   ```

5. Adjust TTL values for frequently accessed data:
   - For temporary adjustment:
     ```bash
     redis-cli -h localhost -p 6379
     > SCAN 0 MATCH "cache:frequently_accessed:*" COUNT 100
     > EXPIRE key 7200  # Set 2 hour TTL
     ```
   - For permanent adjustment, modify the caching TTLs in the code

#### 3. High Redis Latency

**Symptoms**:
- Command latency above 5ms
- `HighRedisLatency` alert triggered
- Slow API responses

**Troubleshooting Steps**:

1. Check system resource usage (CPU, disk I/O)

2. Review Redis configuration for potential bottlenecks:

   ```bash
   redis-cli -h localhost -p 6379 INFO server
   ```

3. Check for slow Redis commands:

   ```bash
   redis-cli -h localhost -p 6379 SLOWLOG GET 10
   ```

4. Consider enabling adaptive TTL to reduce memory pressure:

   ```bash
   python backend/scripts/redis_monitor_cli.py adaptive-ttl
   ```

### Practical Monitoring Workflows

#### Memory Leak Investigation

If you suspect a Redis memory leak:

1. Check memory growth over the last 24 hours in the dashboard

2. Take memory snapshots every hour for 3 hours:

   ```bash
   for i in {1..3}; do
     python backend/scripts/redis_monitor_cli.py patterns > memory_snapshot_$i.txt
     sleep 3600
   done
   ```

3. Compare snapshots to identify growing key patterns

4. Review application logs during the same period

5. Check if any code changes coincided with the memory growth

#### Cache Optimization Analysis

To improve cache efficiency:

1. Generate a cache efficiency report:

   ```bash
   python backend/scripts/redis_monitor_cli.py cache > cache_report.txt
   ```

2. Identify the most frequently accessed and missed keys:

   ```bash
   redis-cli -h localhost -p 6379
   > MONITOR
   # Let it run for 60 seconds during peak traffic, then Ctrl+C
   ```

3. Based on the report, update the application's caching strategy

4. After changes, reset metrics to measure improvement:

   ```bash
   python backend/scripts/redis_monitor_cli.py reset-metrics
   ```

5. Wait for at least 24 hours, then regenerate the report to compare results

## Security Considerations

### Access Control and Network Security

- Redis instance is **not exposed to public networks**
- Redis is configured with authentication and ACLs (Access Control Lists)
- Network access is restricted to application servers and monitoring tools only
- Redis runs in a separate container with limited network connectivity
- TLS encryption is enabled for Redis communications when possible

### Data Protection

- Sensitive data stored in Redis is encrypted before storage
- No personally identifiable information (PII) is stored in Redis without encryption
- Token blacklist and security event data have strict TTLs enforced
- Redis snapshots (RDB files) are encrypted when stored on disk

### Monitoring Security

- The Redis monitor does not expose Redis data externally
- All operations are logged for audit purposes via dedicated audit logs
- Critical operations like key deletion require manual intervention
- All monitoring actions are authenticated and authorized
- Security events from Redis (auth failures, etc.) are captured and alerted on

### Security Scanning

- Regular security scanning of Redis configuration for best practices
- Monitoring for unauthorized command execution attempts
- Detection of suspicious access patterns
- Regular audit of Redis ACLs and users

### Incident Response

If a security incident involving Redis is detected:

1. Isolate the affected Redis instance if necessary
2. Review security events stored in `security:event:*` keys
3. Check access logs for unauthorized access attempts
4. Investigate correlation with other system security events
5. Follow the Security Incident Response Plan documented in [SECURITY_GUIDE.md](SECURITY_GUIDE.md)

## Testing

### Automated Tests

The Redis monitoring system includes comprehensive test coverage to ensure reliability. Run the tests with:

```bash
pytest backend/tests/test_redis_monitor.py
```

These tests include:

1. **Unit Tests**:
   - Test individual functions in the Redis monitoring module
   - Mock Redis responses for predictable test outcomes
   - Test edge cases like memory pressure scenarios

2. **Integration Tests**:
   - Test interaction with actual Redis instance
   - Verify metrics collection accuracy
   - Test alert trigger conditions

3. **Performance Tests**:
   - Test monitoring overhead on Redis
   - Ensure efficient memory usage by the monitoring system itself

### Manual Testing Procedures

In addition to automated tests, perform these manual tests after any significant changes:

1. **Alert Verification**:

   ```bash
   # Simulate high memory usage alert
   redis-cli -h localhost -p 6379 CONFIG SET maxmemory 10mb
   # Fill Redis with data until alert triggers
   python backend/scripts/redis_test_data_generator.py --size=large
   # Verify alert was triggered
   grep "HighRedisMemoryUsage" logs/redis_alerts.log
   # Reset configuration
   redis-cli -h localhost -p 6379 CONFIG SET maxmemory 2gb
   ```

2. **Dashboard Testing**:
   - Login to Grafana and navigate to Redis Performance Dashboard
   - Verify all panels are populated with data
   - Check alert thresholds are correctly visualized

3. **Recovery Testing**:
   - Simulate Redis failure and recovery
   - Verify monitoring resumes correctly
   - Check for data gaps in metrics

### Load Testing

To test how the monitoring system performs under load:

```bash
```bash
# Generate test load on Redis
python backend/scripts/redis_load_test.py --duration=5m --intensity=high

# Monitor dashboard during test
open http://localhost:3000/d/redis-performance/redis-performance-dashboard

# Check for monitoring failures
grep "ERROR" logs/redis_monitor.log
```

## Alert System Configuration

### Environment Variables

Configure the Redis monitoring alert system through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| REDIS_ALERTS_ENABLED | Enable/disable the alert system | True |
| REDIS_MONITORING_INTERVAL_MINUTES | How frequently to check Redis metrics | 15 |
| REDIS_MEMORY_WARNING_PERCENT | Memory usage warning threshold | 75.0 |
| REDIS_MEMORY_CRITICAL_PERCENT | Memory usage critical threshold | 90.0 |

### Email Notification Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| SMTP_SERVER | SMTP server address | "" |
| SMTP_PORT | SMTP server port | 587 |
| SMTP_USERNAME | SMTP username | "" |
| SMTP_PASSWORD | SMTP password | "" |
| SMTP_SENDER | Sender email address | "" |
| REDIS_ALERT_RECIPIENTS | Comma-separated list of recipients | "" |

### Slack Notification Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| SLACK_WEBHOOK_URL | Slack webhook URL | "" |
| SLACK_CHANNEL | Slack channel name | "#alerts" |

### Sample Configuration in docker-compose.yml

```yaml
services:
  api:
    environment:
      # Redis Alert Configuration
      - REDIS_ALERTS_ENABLED=true
      - REDIS_MONITORING_INTERVAL_MINUTES=15
      
      # Email Alerts
      - SMTP_SERVER=smtp.example.com
      - SMTP_PORT=587
      - SMTP_USERNAME=alerts@example.com
      - SMTP_PASSWORD=your_password
      - SMTP_SENDER=redis-alerts@example.com
      - REDIS_ALERT_RECIPIENTS=admin@example.com,devops@example.com
      
      # Slack Alerts
      - SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX
      - SLACK_CHANNEL=#redis-alerts
```

### Alert Log Location

All Redis alerts are logged to:

```
logs/redis_alerts.log
```

This log file contains all alert history, regardless of whether external notifications were sent.

## Integration with Overall Monitoring Infrastructure

The Redis monitoring solution is fully integrated with our broader monitoring infrastructure described in `docs/MONITORING_INFRASTRUCTURE_SETUP.md`. Here's how the different components work together:

### 1. Prometheus Integration

All Redis metrics are collected by Prometheus using the redis-exporter which scrapes the Redis stats endpoint:

```yaml
# From prometheus.yml configuration
scrape_configs:
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    metrics_path: /metrics
    scrape_interval: 15s
```

The redis-exporter runs as a separate container in the Docker Compose setup, connecting to the Redis instance and exposing metrics in Prometheus format.

### 2. Metrics Collection Architecture

```ascii
┌───────────┐     ┌────────────────┐     ┌────────────┐     ┌─────────┐     ┌───────────┐
│  Redis    │────►│  Redis Exporter │────►│ Prometheus │────►│ Grafana │────►│ Dashboard │
└───────────┘     └────────────────┘     └────────────┘     └─────────┘     └───────────┘
                                              │                                   ▲
                                              │                                   │
                                              ▼                                   │
                                        ┌──────────┐      ┌────────────┐         │
                                        │ Alert    │─────►│ Notification│─────────┘
                                        │ Manager  │      │ Channels   │
                                        └──────────┘      └────────────┘
```

### 3. Alert Integration

Redis alerts are defined in `alerts/redis_alerts.yml` and are loaded by Prometheus at startup. When triggered:

1. Prometheus evaluates the alert rules against collected metrics
2. When conditions are met, alerts are fired to AlertManager
3. AlertManager routes the alerts to appropriate notification channels (email, Slack, PagerDuty)
4. Dashboard panels show visual indicators for active alerts

### 4. Unified Monitoring Approach

The Redis monitoring solution follows the same principles as our other monitoring components:

- **Consistent Metric Collection**: 15-second intervals for real-time visibility
- **Multi-level Alerting**: Warning and critical thresholds for all key metrics
- **Unified Notification**: All alerts follow the same routing rules to ensure consistent handling
- **Integrated Dashboards**: Redis dashboard accessible from the main Grafana interface

### 5. Cross-service Correlation

Our monitoring setup allows for correlation between Redis issues and other service problems:

- API performance degradation can be correlated with Redis latency issues
- Database load can be compared against Redis cache hit ratio
- System-wide resource contention can be analyzed alongside Redis memory usage

This integrated approach ensures that Redis monitoring is not performed in isolation but as part of our comprehensive monitoring strategy.

## Related Documentation

For a complete understanding of our monitoring infrastructure, please refer to the following documents:

1. **[MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md)**
   - Overview of all monitoring components including Redis
   - Alert configuration across all services
   - Dashboard summaries

2. **[MONITORING_INFRASTRUCTURE_SETUP.md](MONITORING_INFRASTRUCTURE_SETUP.md)**
   - Step-by-step setup of Prometheus, Grafana, and AlertManager
   - Container configuration and networking
   - Directory structure and file locations

3. **[API_PERFORMANCE_DASHBOARD.md](API_PERFORMANCE_DASHBOARD.md)**
   - API monitoring that shows relationships between API performance and Redis usage
   - Cross-service correlation examples

These documents together provide a comprehensive view of how Redis monitoring fits into the larger monitoring infrastructure of the G+ Recycling App.
