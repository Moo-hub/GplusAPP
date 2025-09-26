import time

from fastapi import APIRouter, Request, Response
from prometheus_client import (CONTENT_TYPE_LATEST, Counter, Histogram,
                               generate_latest)

router = APIRouter()

REQUEST_COUNT = Counter(
    "request_count",
    "Total HTTP requests",
    ["method", "endpoint", "http_status"],
)
REQUEST_LATENCY = Histogram(
    "request_latency_seconds", "Request latency", ["endpoint"]
)
ERROR_COUNT = Counter("error_count", "Total error responses", ["endpoint"])


@router.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Middleware for metrics
async def prometheus_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    endpoint = request.url.path
    REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
    REQUEST_LATENCY.labels(endpoint).observe(process_time)
    if response.status_code >= 400:
        ERROR_COUNT.labels(endpoint).inc()
    return response
