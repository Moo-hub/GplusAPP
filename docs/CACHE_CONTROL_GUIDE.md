# Cache Control in GPlus API

This document explains how HTTP cache control is configured in the GPlus application API to improve performance and reduce server load.

## Overview

The GPlus API uses a multi-layered caching strategy:

1. **Redis Server-Side Caching**: Stores API response data in Redis to reduce database load
2. **HTTP Cache-Control Headers**: Enables client-side caching in browsers and API clients
3. **Middleware-Based Implementation**: Applies appropriate cache headers based on endpoint patterns

## Cache-Control Headers Configuration

Cache-Control headers are automatically applied to API responses through:

1. **CacheControlMiddleware**: Applies headers based on URL patterns and HTTP methods
2. **@cached_endpoint Decorator**: Applies specific cache settings to individual endpoints

## Cache Settings by Endpoint Type

### Static Resources

```text
Cache-Control: public, max-age=86400, stale-while-revalidate=3600
```

- 24-hour freshness period
- 1-hour stale-while-revalidate period
- Public caching (CDNs, proxies, browsers)

### High-Change Frequency Endpoints

```text
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

- 1-minute freshness period
- 5-minute stale-while-revalidate period
- Example: Available pickup time slots

### Medium-Change Frequency Endpoints

```text
Cache-Control: private, max-age=300, stale-while-revalidate=600
```

- 5-minute freshness period
- 10-minute stale-while-revalidate period
- Private caching (browser only)
- Example: Pickup requests, points history

### Low-Change Frequency Endpoints

```text
Cache-Control: private, max-age=3600, stale-while-revalidate=7200
```

- 1-hour freshness period
- 2-hour stale-while-revalidate period
- Example: User profile, company information

### Mutation Operations

```text
Cache-Control: no-store, must-revalidate, private
```

- No caching for POST, PUT, DELETE requests
- Forces revalidation of related data

## Understanding Cache-Control Directives

- **public**: Response can be stored by any cache (CDNs, proxies, browsers)
- **private**: Response can only be stored by browser cache, not intermediate caches
- **max-age**: Seconds the response can be cached before considered stale
- **stale-while-revalidate**: Seconds a stale response can be used while revalidation happens in background
- **no-store**: Response should not be stored by any cache
- **must-revalidate**: Cache must verify stale responses with server before using them

## Vary Header

Some responses include a `Vary` header to differentiate cache entries based on:

- `Vary: Authorization` - Different cache entries per user authentication
- `Vary: Accept-Language` - Different cache entries per language

## Cache Testing and Debugging

### Browser Developer Tools

1. Open Developer Tools (F12)
2. Navigate to Network tab
3. Look for `Cache-Control` in response headers
4. Subsequent requests may show `304 Not Modified` or be served from cache

### Cache Debugging Headers

Every API response includes:

- `X-Cache-Hit: true/false` - Indicates if response was from Redis cache
- `X-Process-Time: 123.45ms` - Processing time for the request

## Customizing Cache Behavior for New Endpoints

When creating new endpoints, use the `@cached_endpoint` decorator with appropriate cache settings:

```python
@router.get("/example/{item_id}")
@cached_endpoint(
    namespace="example",
    ttl=300,  # Redis cache TTL
    cache_control="private, max-age=300, stale-while-revalidate=300",
    public_cache=False  # Private cache only
)
async def get_example(...):
    # ...
```

## Performance Considerations

- **Short max-age**: Use for frequently changing data (60s or less)
- **Long max-age with stale-while-revalidate**: Best for stable data that occasionally updates
- **Cache-Control: private**: Use for user-specific data
- **Cache-Control: public**: Use for shared data that's the same for all users
