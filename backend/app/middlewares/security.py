from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
from typing import Optional

from app.core.config import settings
from app.core.redis_client import get_redis_client

# Use the project's redis client factory so tests can provide a fakeredis instance.
# Initialize lazily to avoid network calls at import time.
_redis_client = None


def _get_redis() -> Optional[object]:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        _redis_client = get_redis_client()
    except Exception:
        _redis_client = None
    return _redis_client


class RateLimiter:
    """Middleware for rate limiting API requests."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def call_next(request: Request):
            return await self.app(request.scope, receive, send)

        request = Request(scope)
        # Skip rate limiting for non-sensitive endpoints
        if not self._is_rate_limited_endpoint(request.url.path):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        endpoint = request.url.path

        # Create a key that's unique to the IP and endpoint
        redis_key = f"ratelimit:{client_ip}:{endpoint}"

        # Get a Redis client (may be None in tests or if Redis is unavailable)
        client = _get_redis()

        if not client:
            # Fail-open when Redis isn't available: allow requests through
            # but do not enforce rate limiting. This keeps tests hermetic and
            # avoids import-time network dependencies.
            return await call_next(request)

        # Get current request count
        try:
            current_count = client.get(redis_key)
        except Exception:
            # If Redis ops fail, fail-open
            return await call_next(request)

        if current_count is None:
            # First request, initialize counter
            try:
                client.setex(
                    redis_key,
                    settings.RATE_LIMIT_WINDOW_SECONDS,
                    1,
                )
            except Exception:
                return await call_next(request)
        else:
            # Increment counter
            try:
                current_count = int(current_count)
            except Exception:
                # Non-integer or unexpected type: reset counter
                try:
                    client.setex(redis_key, settings.RATE_LIMIT_WINDOW_SECONDS, 1)
                except Exception:
                    return await call_next(request)
                current_count = 1

            if current_count >= settings.RATE_LIMIT_MAX_REQUESTS:
                # Rate limit exceeded
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many requests, please try again later."
                        }
                    },
                )
            else:
                # Increment the counter
                try:
                    client.incr(redis_key)
                except Exception:
                    return await call_next(request)

        # Process the request
        response = await call_next(request)
        return response

    def _is_rate_limited_endpoint(self, path: str) -> bool:
        """Determine if an endpoint should be rate limited.

        Args:
            path: The request path

        Returns:
            True if the endpoint should be rate limited, False otherwise
        """
        sensitive_endpoints = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/users/reset-password",
            # Add other sensitive endpoints here
        ]

        for endpoint in sensitive_endpoints:
            if endpoint in path:
                return True

        return False

class CSRFProtection:
    """Middleware for CSRF protection."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        async def call_next(request):
            return await self.app(request.scope, receive, send)
            
        request = Request(scope)
        # Skip CSRF protection for safe methods and non-API endpoints
        if request.method in ['GET', 'HEAD', 'OPTIONS'] or not request.url.path.startswith('/api'):
            return await call_next(request)
        
        # Skip CSRF check for authentication endpoints
        if request.url.path in ['/api/auth/login', '/api/auth/register']:
            return await call_next(request)
        
        # Get CSRF token from header
        csrf_token = request.headers.get('X-CSRF-Token')
        
        # Get CSRF token from cookie
        csrf_cookie = request.cookies.get('csrf_token')
        
        # Validate CSRF token
        if not csrf_token or not csrf_cookie or csrf_token != csrf_cookie:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": {
                        "code": "CSRF_TOKEN_INVALID",
                        "message": "Invalid or missing CSRF token"
                    }
                }
            )
        
        # Process the request
        response = await call_next(request)
        return response