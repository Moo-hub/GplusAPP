# Redis Cache Integration Guide

This document provides a comprehensive guide on the Redis caching system implemented in the G+ Recycling App. It covers the architecture, configuration, implementation details, performance benefits, monitoring tools, and best practices for developers.

## Overview

Redis caching has been implemented to significantly improve API performance, reduce database load, and enhance user experience. The caching system is particularly effective for:

- Read-heavy API endpoints with frequent access patterns
- Data that doesn't change frequently but is accessed often
- Computationally expensive operations like complex database queries
- High-traffic endpoints that need scaling without increasing database load

Our Redis caching implementation focuses on:

- Pickup request endpoints (schedules, history, details)
- Points and transaction endpoints (balances, history, redemption options)
- User profile endpoints (preferences, settings, activity logs)
- Company listing and details endpoints (locations, services, reviews)

The implementation uses a custom decorator-based approach to easily apply caching to FastAPI endpoints, with proper cache key generation based on path parameters, query parameters, and user identity. This approach ensures both simplicity for developers and performance for users.

## Architecture

The Redis caching system consists of several components working together to provide a robust caching solution:

### 1. Core Redis Cache Module (`app/core/redis_cache.py`)

This module provides the fundamental caching operations and manages the underlying Redis connection:

- **Low-level cache operations**:
  - `async get_cache(key: str) -> Optional[Any]`: Retrieves cached data if it exists
  - `async set_cache(key: str, value: Any, ttl: int) -> bool`: Stores data in cache with expiration
  - `async invalidate(key: str) -> bool`: Removes specific cached data
  - `async invalidate_pattern(pattern: str) -> int`: Removes multiple cache entries by pattern

- **Namespace management**:
  - Organizes cached data by logical domains (users, pickups, etc.)
  - Simplifies invalidation of related cached items
  - Allows for different TTL settings per namespace

- **Metrics tracking**:
  - Records cache hits, misses, and hit rate percentage
  - Tracks average cache response times
  - Logs cache operations for analysis and optimization

### 2. FastAPI Endpoint Caching (`app/core/redis_fastapi.py`)

This module provides decorators that make it easy to apply caching to API endpoints:

- **`@cached_endpoint` decorator**:
  - Automatically caches API responses based on configured parameters
  - Intelligently generates cache keys based on request data
  - Handles serialization/deserialization of response data
  - Adds diagnostic headers to responses (X-Cache: HIT/MISS)

- **Request context handling**:
  - Extracts path parameters, query parameters, and headers
  - Considers user identity for user-specific caching
  - Handles variations in request content for proper caching

- **Cache invalidation helpers**:
  - Provides functions for selective cache invalidation
  - Supports wildcards and pattern-based invalidation
  - Can be tied to database events for automatic invalidation

### 3. Performance Monitoring (`app/middleware/cache_performance.py`)

This middleware provides insights into caching effectiveness:

- **Response time tracking**:
  - Measures API response times with and without cache hits
  - Logs performance metrics for analysis
  - Identifies endpoints that benefit most from caching

- **Cache efficiency analysis**:
  - Tracks cache hit ratios across different endpoints
  - Identifies cache misses and potential optimization points
  - Provides data for TTL tuning and cache strategy refinement

### 4. Cache Invalidation System (`app/core/cache_invalidation.py`)

Handles the complex task of maintaining cache consistency:

- **Event-driven invalidation**:
  - Listens for database change events
  - Automatically invalidates related cached data
  - Maintains data consistency across the application

- **Targeted invalidation strategies**:
  - Resource-based invalidation (e.g., specific user data)
  - Collection-based invalidation (e.g., all pickups for a company)
  - Namespace-based invalidation (e.g., all point-related caches)

### System Architecture Diagram

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   API Client   │     │  FastAPI App   │     │  Redis Cache   │
└───────┬────────┘     └───────┬────────┘     └───────┬────────┘
        │                      │                      │
        │   1. API Request    │                      │
        ├─────────────────────▶                      │
        │                      │                      │
        │                      │  2. Check Cache     │
        │                      ├─────────────────────▶
        │                      │                      │
        │                      │  3. Cache Hit/Miss  │
        │                      ◀─────────────────────┤
        │                      │                      │
        │                      │    If Cache Miss:    │
        │                      │  4. Query Database   │
        │                      │                      │
        │                      │  5. Store in Cache   │
        │                      ├─────────────────────▶
        │                      │                      │
        │   6. API Response   │                      │
        ◀─────────────────────┤                      │
        │                      │                      │
```

## Configuration

### Redis Connection Setup

The Redis connection is configured in `app/core/config.py` using environment variables:

```python
# Redis connection configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_URL = os.getenv(
    "REDIS_URL",
    f"redis://{':' + REDIS_PASSWORD + '@' if REDIS_PASSWORD else ''}{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
)

# Redis cache configuration
REDIS_CACHE_ENABLED = os.getenv("REDIS_CACHE_ENABLED", "true").lower() == "true"
REDIS_CACHE_KEY_PREFIX = os.getenv("REDIS_CACHE_KEY_PREFIX", "cache")
```

### Environment Variables

Set these variables in your `.env` file or environment:

```
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379/0

# Redis Cache Settings
REDIS_CACHE_ENABLED=true
REDIS_CACHE_KEY_PREFIX=cache
```

### Docker Configuration

In the Docker environment, Redis is configured in `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    networks:
      - app-network
```

## Cache Keys and Namespaces

### Key Structure

Cache keys follow a structured format to ensure uniqueness and meaningful organization:

```text
cache:<namespace>:<identifier>:<parameter_hash>
```

### Examples

- `cache:pickup:endpoint:get_pickup_requests:8a3d7e6f` (API endpoint response)
- `cache:user:123:profile` (User profile data)
- `cache:points:456:history` (Points transaction history)
- `cache:company:789:locations` (Company locations)

### Parameter Hashing

Query parameters and request variations are hashed to create unique cache keys:

```python
def generate_cache_key(namespace, identifier, params):
    """Generate a unique cache key based on parameters"""
    if params:
        # Sort parameters for consistent hashing regardless of order
        sorted_params = {k: params[k] for k in sorted(params.keys())}
        param_hash = hashlib.md5(json.dumps(sorted_params).encode()).hexdigest()[:8]
        return f"{REDIS_CACHE_KEY_PREFIX}:{namespace}:{identifier}:{param_hash}"
    else:
        return f"{REDIS_CACHE_KEY_PREFIX}:{namespace}:{identifier}"
```

## TTL (Time-To-Live) Configuration

### Default TTL Values

Default TTL values are carefully tuned based on data volatility, access patterns, and business requirements:

| Namespace   | TTL (seconds) | Description                      | Rationale                                                     |
|-------------|---------------|----------------------------------|---------------------------------------------------------------|
| user        | 3600          | 1 hour for user profiles         | User profiles rarely change but are frequently accessed        |
| pickup      | 300           | 5 minutes for pickup data        | Pickup statuses can change, need relatively fresh data        |
| points      | 300           | 5 minutes for points data        | Balance data should be reasonably current for user confidence |
| company     | 7200          | 2 hours for company data         | Company information is very stable                            |
| locations   | 86400         | 24 hours for location data       | Geographic data rarely changes                                |
| statistics  | 1800          | 30 minutes for statistics        | Stats are compute-heavy but don't need real-time accuracy     |
| general     | 1800          | 30 minutes for other data        | Default for miscellaneous data                                |

### TTL Configuration in Code

TTL values can be configured in `app/core/config.py`:

```python
# Redis cache TTL configuration (in seconds)
REDIS_CACHE_TTL_CONFIG = {
    "user": 3600,        # 1 hour
    "pickup": 300,      # 5 minutes
    "points": 300,      # 5 minutes
    "company": 7200,    # 2 hours
    "locations": 86400, # 24 hours
    "statistics": 1800, # 30 minutes
    "general": 1800,    # 30 minutes
}
```

### Dynamic TTL Adjustment

The system supports dynamic TTL adjustment based on specific conditions:

```python
# Example: Longer cache for historical data
@cached_endpoint(
    namespace="pickup",
    ttl_function=lambda request: 
        86400 if request.query_params.get("historical") == "true" else 300
)
def get_pickup_history(request):
    # ...
```

### TTL Best Practices

1. **Balance freshness vs. performance**: Shorter TTLs mean fresher data but more cache misses
2. **Consider data volatility**: Frequently changing data needs shorter TTLs
3. **User expectations**: Some data users expect to be real-time (e.g., points balance)
4. **Load patterns**: Extend TTLs during high-traffic periods if slight staleness is acceptable
5. **Monitor and adjust**: Regularly review cache performance and adjust TTLs accordingly

## Usage Guide

### Caching a FastAPI Endpoint

To apply caching to a FastAPI endpoint, use the `@cached_endpoint` decorator:

```python
from app.core.redis_fastapi import cached_endpoint

@router.get("/example/{item_id}")
@cached_endpoint(
    namespace="example",           # Logical namespace for the cache
    ttl=300,                      # 5 minutes cache lifetime
    cache_by_user=True,           # Create separate cache per user
    vary_query_params=["filter", "sort"]  # Cache varies by these parameters
)
async def get_example(
    request: Request,
    item_id: int,
    filter: str = None,
    sort: str = None,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # ... endpoint implementation
    return result
```

### Decorator Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `namespace` | `str` | Logical grouping for cache keys | Required |
| `ttl` | `int` | Time-to-live in seconds | From config |
| `cache_by_user` | `bool` | Whether to create per-user caches | `False` |
| `vary_query_params` | `List[str]` | Query parameters that affect caching | `[]` |
| `vary_headers` | `List[str]` | Headers that affect caching | `[]` |
| `key_builder` | `Callable` | Custom function to build cache key | `None` |
| `serializer` | `Callable` | Custom function to serialize response | `json.dumps` |
| `deserializer` | `Callable` | Custom function to deserialize response | `json.loads` |
| `skip_cache_fn` | `Callable` | Function to determine if caching should be skipped | `None` |

### Example: Caching with Custom Key Builder

```python
# Custom key builder for complex caching scenarios
def build_pickup_cache_key(request, namespace):
    """Custom cache key builder for pickup requests"""
    user_id = request.state.user_id
    company_id = request.path_params.get("company_id")
    status = request.query_params.get("status", "all")
    return f"cache:pickup:{user_id}:{company_id}:{status}"

@router.get("/companies/{company_id}/pickups")
@cached_endpoint(
    namespace="pickup",
    ttl=300,
    key_builder=build_pickup_cache_key
)
async def get_company_pickups(
    request: Request,
    company_id: int,
    status: str = "all",
    current_user: User = Depends(get_current_user)
):
    # ... implementation
    return pickups
```

### Example: Conditional Caching

```python
# Skip caching for admins
def skip_cache_for_admins(request):
    """Determines if caching should be skipped"""
    user = request.state.user
    return user and user.role == "admin"

@router.get("/reports/daily")
@cached_endpoint(
    namespace="reports",
    ttl=1800,  # 30 minutes
    skip_cache_fn=skip_cache_for_admins
)
async def get_daily_report(request: Request):
    # Admins always get fresh data, others get cached
    # ... implementation
    return report
```

### Example: Caching with Custom Serialization

```python
# For endpoints returning binary data or complex objects
import pickle

@router.get("/analytics/chart")
@cached_endpoint(
    namespace="analytics",
    ttl=1800,
    serializer=lambda data: pickle.dumps(data),
    deserializer=lambda data: pickle.loads(data)
)
async def get_chart_data(request: Request):
    # Returns complex data structure with Pandas DataFrame
    # ... implementation
    return chart_data
```

### Cache Invalidation

Cache invalidation is crucial for maintaining data consistency. The G+ Recycling App provides several invalidation strategies for different scenarios:

#### 1. Namespace Invalidation

Invalidate all caches in a namespace, typically used after mutations:

```python
from app.core.redis_cache import invalidate_namespace

@router.post("/pickups")
async def create_pickup(
    request: Request,
    data: PickupCreate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # ... create pickup resource
    
    # Invalidate all pickup-related caches
    await invalidate_namespace("pickup")
    
    return result
```

#### 2. Pattern-Based Invalidation

Invalidate specific cache keys matching a pattern:

```python
from app.core.redis_cache import invalidate_pattern

@router.put("/users/{user_id}/profile")
async def update_profile(
    user_id: int,
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # ... update user profile
    
    # Invalidate just this user's cache entries
    await invalidate_pattern(f"cache:user:{user_id}:*")
    
    return result
```

#### 3. Specific Key Invalidation

Invalidate a single, specific cache key:

```python
from app.core.redis_cache import invalidate

@router.put("/companies/{company_id}")
async def update_company(
    company_id: int,
    data: CompanyUpdate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # ... update company
    
    # Invalidate just this company's profile cache
    await invalidate(f"cache:company:{company_id}:profile")
    
    return result
```

#### 4. Event-Driven Invalidation

The application uses events to invalidate caches automatically:

```python
from app.core.events import publish_event

@router.post("/points/redeem")
async def redeem_points(
    request: Request,
    data: PointsRedemption,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # ... process redemption
    
    # Publish event that triggers cache invalidation
    await publish_event(
        "points_changed", 
        {"user_id": current_user.id}
    )
    
    return result
```

In the event handler:

```python
from app.core.redis_cache import invalidate_pattern
from app.core.events import subscribe

@subscribe("points_changed")
async def handle_points_changed(data):
    user_id = data.get("user_id")
    # Invalidate user's points caches
    await invalidate_pattern(f"cache:points:{user_id}:*")
    # Also invalidate user profile which may display points
    await invalidate_pattern(f"cache:user:{user_id}:profile")
```

#### 5. Bulk Invalidation

For major data changes that affect multiple resources:

```python
from app.core.redis_cache import invalidate_namespaces

@router.post("/admin/recalculate-points")
async def admin_recalculate_points(
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    # ... perform recalculation
    
    # Invalidate both points and user caches
    await invalidate_namespaces(["points", "user"])
    
    return {"status": "success"}
```

#### Invalidation Best Practices

1. **Be specific when possible**: Invalidate only what's necessary
2. **Invalidate related data**: Consider downstream effects of changes
3. **Use events for cross-service invalidation**: When multiple services need consistent data
4. **Consider batch invalidations**: For heavy write operations, batch invalidations
5. **Monitor invalidation patterns**: Excessive invalidation may indicate design issues

## Performance Monitoring

### Cache Metrics

The G+ Recycling App tracks detailed cache performance metrics to help optimize the caching strategy:

#### Available Metrics

1. **Cache Hit Rate**: Percentage of requests served from cache
2. **Response Time**: Average response time for cached vs. non-cached responses
3. **Cache Size**: Total size of cached data
4. **Key Distribution**: Number of cache keys per namespace
5. **TTL Distribution**: Distribution of remaining TTL values
6. **Invalidation Rate**: How often caches are invalidated

### Monitoring Tools

#### 1. Real-time Logs

Detailed cache metrics are logged to `logs/cache_performance.log`:

```
2025-09-28T15:32:10 [INFO] CACHE_HIT path=/api/v1/users/123/profile time=3ms key=cache:user:123:profile
2025-09-28T15:32:15 [INFO] CACHE_MISS path=/api/v1/pickups?status=pending time=87ms key=cache:pickup:endpoint:get_pickups:7f3e9d1a
2025-09-28T15:32:20 [INFO] CACHE_INVALIDATE pattern=cache:pickup:* count=7
```

#### 2. Redis Monitor CLI Tool

Use the custom monitoring tool to view real-time cache statistics:

```bash
python backend/scripts/redis_monitor_cli.py --cache-stats
```

Sample output:

```
===== REDIS CACHE STATISTICS =====
Total Keys: 2,387
Total Cache Size: 8.7 MB

Hit Rate (Last Hour): 87.3%
Hit Rate (Last 24h): 91.2%

Namespace Distribution:
- pickup: 842 keys (35.3%)
- user: 673 keys (28.2%)
- points: 412 keys (17.3%)
- company: 289 keys (12.1%)
- other: 171 keys (7.1%)

Top Endpoints by Hit Rate:
1. /api/v1/companies - 98.7%
2. /api/v1/users/profile - 95.2%
3. /api/v1/points/balance - 92.4%

Bottom Endpoints by Hit Rate:
1. /api/v1/pickups/active - 42.1%
2. /api/v1/statistics/daily - 53.8%
3. /api/v1/notifications - 61.2%
```

#### 3. Grafana Dashboard

A Grafana dashboard is available for visualizing cache performance metrics:

- **URL**: http://monitoring.gplus-recycling.com/grafana/d/redis-cache
- **Dashboard ID**: `redis-cache-performance`

The dashboard provides visualizations for:
- Hit rate over time
- Response time comparison
- Cache size evolution
- Invalidation events
- Top cached endpoints

#### 4. Cache Headers

API responses include cache diagnostic headers:

```
X-Cache: HIT
X-Cache-Key: cache:user:123:profile
X-Cache-TTL-Remaining: 2745
X-Cache-Date: Wed, 28 Sep 2025 15:32:10 GMT
```

These headers help with debugging and optimizing caching strategies.

## Testing

### Integration Tests

Redis cache integration tests verify that caching works correctly and consistently:

```bash
pytest backend/app/tests/api/test_redis_cache_integration.py -v
```

These tests cover:

1. Cache hits and misses
2. Proper cache key generation
3. TTL functionality
4. Cache invalidation scenarios
5. Cache serialization/deserialization
6. User-specific caching
7. Edge cases (null values, large responses, etc.)

### Mocking Redis for Unit Tests

Unit tests can use the built-in Redis mock:

```python
from unittest.mock import patch
from app.core.redis_cache import MockRedis

def test_cached_endpoint():
    with patch('app.core.redis_cache.redis_client', MockRedis()):
        # Test code that uses Redis caching
        # The mock will simulate Redis functionality
```

### Local Testing

To test caching locally with real Redis:

1. Start Redis: `docker-compose up redis`
2. Run specific test: `pytest backend/app/tests/api/test_pickup_cache.py::test_pickup_list_caching -v`
3. Monitor Redis: `redis-cli monitor`

## Advanced Topics

### Cache Warming

For frequently accessed data, the application implements cache warming strategies:

```python
from app.core.cache_warming import warm_cache

# Proactively populate caches
async def warm_pickup_caches():
    """Pre-populate pickup caches for active pickups"""
    active_pickups = await get_active_pickups()
    for pickup in active_pickups:
        key = f"cache:pickup:{pickup.id}:details"
        await warm_cache(key, pickup.dict(), ttl=300)

# Scheduled task to warm caches
scheduler.add_job(
    warm_pickup_caches,
    trigger="interval",
    minutes=5,
    id="warm_pickup_caches"
)
```

### Cache Compression

For large responses, the caching system supports compression:

```python
import zlib
import base64

def compress_response(data):
    """Compress response data before caching"""
    json_str = json.dumps(data)
    compressed = zlib.compress(json_str.encode())
    return base64.b64encode(compressed).decode()

def decompress_response(data):
    """Decompress cached response data"""
    decompressed = zlib.decompress(base64.b64decode(data))
    return json.loads(decompressed.decode())

@router.get("/reports/large-dataset")
@cached_endpoint(
    namespace="reports",
    ttl=3600,
    serializer=compress_response,
    deserializer=decompress_response
)
async def get_large_report():
    # ... generate large report data
    return large_data
```

### Adaptive TTLs

The system supports dynamically adjusting TTLs based on data update frequency:

```python
from app.core.adaptive_cache import get_adaptive_ttl

@router.get("/statistics/daily")
@cached_endpoint(
    namespace="statistics",
    ttl=lambda request: get_adaptive_ttl("statistics:daily")
)
async def get_daily_statistics():
    # TTL automatically adjusted based on update frequency
    return stats
```

### Circuit Breaker Pattern

The caching system implements a circuit breaker pattern for Redis connection issues:

```python
from app.core.circuit_breaker import CircuitBreaker

# Circuit breaker for Redis
redis_circuit = CircuitBreaker(
    name="redis",
    failure_threshold=5,
    recovery_timeout=30,
    callback=log_redis_failure
)

# Protected Redis operations
async def get_cache_with_circuit_breaker(key):
    try:
        return await redis_circuit.execute(redis_client.get, key)
    except CircuitBreakerOpen:
        # Redis circuit is open, bypass cache
        return None
```

## Future Enhancements

Planned enhancements for the Redis caching system include:

1. **ML-Based Cache Prediction**: Using access patterns to predict and pre-warm caches
2. **Multi-Level Caching**: Combining in-memory and Redis caching for ultra-fast responses
3. **Rate-Based Auto-Scaling**: Automatically adjust cache size based on hit rates
4. **Cache Analytics Dashboard**: Enhanced visualization of cache performance metrics
5. **Real-Time Cache Optimization**: Dynamic adjustment of caching parameters based on usage
6. **Differential Caching**: Cache only the parts of responses that change frequently

## Related Documentation

- [API Performance Dashboard](./API_PERFORMANCE_DASHBOARD.md)
- [Redis Monitoring Guide](./REDIS_MONITORING_GUIDE.md)
- [Cache Control Guide](./CACHE_CONTROL_GUIDE.md)
- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION_GUIDE.md)
