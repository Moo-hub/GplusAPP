from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
from app.core.config import settings
from redis import Redis

# Redis client for rate limiting
redis_client = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=1)

class RateLimiter:
    """Middleware for rate limiting API requests."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        async def call_next(request):
            return await self.app(request.scope, receive, send)
            
        request = Request(scope)
        # Skip rate limiting for non-sensitive endpoints
        if not self._is_rate_limited_endpoint(request.url.path):
            return await call_next(request)
        
        client_ip = request.client.host
        endpoint = request.url.path
        
        # Create a key that's unique to the IP and endpoint
        redis_key = f"ratelimit:{client_ip}:{endpoint}"
        
        # Get current request count
        current_count = redis_client.get(redis_key)
        
        if current_count is None:
            # First request, initialize counter
            redis_client.setex(
                redis_key, 
                settings.RATE_LIMIT_WINDOW_SECONDS, 
                1
            )
        else:
            # Increment counter
            current_count = int(current_count)
            if current_count >= settings.RATE_LIMIT_MAX_REQUESTS:
                # Rate limit exceeded
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many requests, please try again later."
                        }
                    }
                )
            else:
                # Increment the counter
                redis_client.incr(redis_key)
        
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