from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest, CollectorRegistry

router = APIRouter()


# Use a custom registry to avoid duplicated timeseries in tests
registry = CollectorRegistry()
REQUEST_COUNT = Counter("request_count", "Total HTTP requests", registry=registry)



@router.get("/metrics")
def metrics():
    return Response(generate_latest(registry), media_type=CONTENT_TYPE_LATEST)
