"""
Middleware for measuring and logging API performance with Redis caching.
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging
logger = logging.getLogger("cache_performance")
logger.setLevel(logging.INFO)

# Add a handler to write to cache performance log file
file_handler = logging.FileHandler(filename="logs/cache_performance.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)


class CachePerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track and log performance metrics for API endpoints,
    particularly to measure the impact of Redis caching.
    """

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Skip non-API requests for performance
        if not request.url.path.startswith("/api/"):
            return await call_next(request)
        
        # Record start time
        start_time = time.time()
        
        # Flag to check if response came from cache
        request.state.from_cache = False
        
        # Process the request
        response = await call_next(request)
        
        # Calculate response time
        process_time = (time.time() - start_time) * 1000
        
        # Extract cache info from response headers if available
        cache_hit = response.headers.get("X-Cache-Hit", "unknown")
        
        # Log the performance data
        logger.info(
            f"path={request.url.path} "
            f"method={request.method} "
            f"status_code={response.status_code} "
            f"cache_hit={cache_hit} "
            f"duration={process_time:.2f}ms"
        )
        
        # Add processing time header to response
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        
        return response