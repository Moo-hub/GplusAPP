"""
Middleware for adding cache-control headers to API responses.
"""

from typing import Callable, Dict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import re
import logging

# Configure logging
logger = logging.getLogger("cache_headers")
logger.setLevel(logging.INFO)

# Add a handler to write to cache performance log file
file_handler = logging.FileHandler(filename="logs/cache_headers.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)


class CacheControlMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add cache-control headers to API responses.
    
    This middleware configures HTTP caching based on endpoint patterns and request methods.
    GET requests to read-only endpoints will receive appropriate cache-control headers,
    while mutation operations (POST, PUT, DELETE) will receive no-cache directives.
    """

    def __init__(
        self,
        app,
        cache_config: Dict[str, Dict[str, str]] = None,
    ):
        super().__init__(app)
        self.cache_config = cache_config or self._default_cache_config()

    def _default_cache_config(self) -> Dict[str, Dict[str, str]]:
        """
        Define default cache configurations based on endpoint patterns.
        
        Returns:
            Dict mapping URL patterns to cache control directives.
        """
        return {
            # Static assets - long cache
            r"^/static/.*": {
                "GET": "public, max-age=86400, stale-while-revalidate=3600",  # 24 hours + 1 hour stale
            },
            
            # API endpoints with high change frequency - short cache
            r"^/api/v1/pickup/available-slots/.*": {
                "GET": "public, max-age=60, stale-while-revalidate=300",  # 1 minute + 5 minutes stale
            },
            r"^/api/v1/points/?$": {
                "GET": "private, max-age=60, stale-while-revalidate=300",  # 1 minute + 5 minutes stale
            },
            
            # API endpoints with medium change frequency
            r"^/api/v1/pickup/?$": {
                "GET": "private, max-age=300, stale-while-revalidate=600",  # 5 minutes + 10 minutes stale
            },
            r"^/api/v1/points/history/?$": {
                "GET": "private, max-age=300, stale-while-revalidate=600",  # 5 minutes + 10 minutes stale
            },
            
            # API endpoints with low change frequency - longer cache
            r"^/api/v1/profile/?$": {
                "GET": "private, max-age=3600, stale-while-revalidate=7200",  # 1 hour + 2 hours stale
            },
            r"^/api/v1/companies/.*": {
                "GET": "public, max-age=3600, stale-while-revalidate=7200",  # 1 hour + 2 hours stale
            },
            
            # Default for all other GET endpoints - moderate cache
            r".*": {
                "GET": "no-cache, private",
                "POST": "no-store, must-revalidate, private",
                "PUT": "no-store, must-revalidate, private",
                "DELETE": "no-store, must-revalidate, private",
                "PATCH": "no-store, must-revalidate, private",
            },
        }
        
    def _get_cache_control_header(self, path: str, method: str) -> str:
        """
        Get the appropriate cache-control header for the given path and method.
        
        Args:
            path: The request path
            method: The HTTP method (GET, POST, etc.)
            
        Returns:
            The cache-control header value, or None if no matching pattern
        """
        # Default no caching for mutation operations
        if method not in ["GET", "HEAD", "OPTIONS"]:
            return "no-store, must-revalidate, private"
            
        # Find the matching pattern
        for pattern, methods in self.cache_config.items():
            if re.match(pattern, path) and method in methods:
                return methods[method]
        
        # Fallback to default if no specific pattern matched
        if method in self.cache_config.get(".*", {}):
            return self.cache_config[".*"][method]
        
        # Default conservative caching
        return "no-cache, private"

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        response = await call_next(request)
        
        # Skip if not an API request
        if not request.url.path.startswith("/api/"):
            return response
        
        # Get appropriate cache-control directive
        cache_control = self._get_cache_control_header(request.url.path, request.method)
        
        # Add cache-control header if not already set
        if cache_control and "cache-control" not in response.headers:
            response.headers["Cache-Control"] = cache_control
            logger.debug(f"Added Cache-Control: {cache_control} for {request.method} {request.url.path}")
        
        return response