# backend/app/main.py
import logging
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import uuid

from app.api.websockets import manager
from app.core.config import settings
# Serve static index.html at root for accessibility
from fastapi.responses import HTMLResponse
from pathlib import Path
from app.api.api_v1.api import api_router
# Conditionally include test-only helpers
if settings.ENVIRONMENT == "test":
    try:
        from app.api.api_v1.endpoints import _test_helpers as _th
        api_router.include_router(_th.router)
    except Exception:
        # Don't fail startup if test helpers can't be imported. Tests
        # running in this process typically import endpoints directly.
        pass
from app.db.db_utils import check_db_connected, check_and_init_db
from app.db.session import SessionLocal
from app.core.redis_tasks import lifespan, configure_scheduler
from app.utils.json_encoder import CustomJSONResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Create FastAPI app with lifespan event handlers for Redis monitoring
# Do NOT enable the Redis lifespan when running tests. Tests set
# ENVIRONMENT=test and should not start background monitoring tasks or
# run initial Redis checks which can interact poorly with in-memory shims.
use_lifespan = settings.ENVIRONMENT not in ("development", "test")
app = FastAPI(
    title="GPlus-Recycling-EcoSys-Pro",
    description="Recycling Ecosystem API",
    version="0.1.0",
    lifespan=lifespan if use_lifespan else None,
    default_response_class=CustomJSONResponse,
)

# Startup helper extracted from previous on_startup
def _startup_actions(app: FastAPI):
    db = SessionLocal()
    try:
        check_db_connected(db)
        check_and_init_db(db)

        # Configure Redis monitoring scheduler only if not in development or tests
        if settings.ENVIRONMENT not in ("development", "test"):
            try:
                configure_scheduler(app)
            except Exception as e:
                logging.warning(f"Redis monitoring not available: {e}")
                logging.info("Continuing without Redis monitoring")
    except Exception as e:
        logging.error(f"Error in startup: {e}")
    finally:
        db.close()

# If lifespan is disabled (development/test), run startup actions immediately
if not use_lifespan:
    try:
        _startup_actions(app)
    except Exception as e:
        logging.warning(f"Startup actions failed when lifespan disabled: {e}")

from app.environmental.router import router as environmental_router
app.include_router(environmental_router, prefix="/api/v1/environmental", tags=["Environmental"])

from fastapi.staticfiles import StaticFiles
# Mount /static for favicon and other static assets
app.mount("/static", StaticFiles(directory="app/static"), name="static")
# Add cache performance monitoring middleware
from app.core.middleware.cache_performance import CachePerformanceMiddleware
from app.core.middleware.cache_control import CacheControlMiddleware
app.add_middleware(CachePerformanceMiddleware)
app.add_middleware(CacheControlMiddleware)

# Set up CORS - Make sure this is before any routers are included
app.add_middleware(
    CORSMiddleware,
    # Allow the frontend origin. When using credentials, browsers will reject
    # Access-Control-Allow-Origin: * responses. Use the configured FRONTEND_URL
    # to return a proper single-origin ACL header.
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security middleware - FILE IS MISSING
# from app.core.middleware.security import SecurityMiddleware
# app.add_middleware(SecurityMiddleware)

# Instrument the app with Prometheus after all other middleware
instrumentator = Instrumentator().instrument(app)

@app.on_event("startup")
async def _startup():
    instrumentator.expose(app)

# Include the main API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Serve static HTML at root for accessibility and SEO
@app.get("/", response_class=HTMLResponse)
async def root():
    index_path = Path(__file__).parent / "static" / "index.html"
    return index_path.read_text(encoding="utf-8")


# WebSocket endpoint for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # The manager handles receiving and broadcasting messages
            # This loop just keeps the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logging.info(f"Client #{client_id} disconnected")

@app.post("/ws/write")
async def post_to_socket(
    message: str,
    # Example of dependency injection for a protected route
    # current_user: models.User = Depends(get_current_active_user)
):
    # In a real app, you'd have authorization here
    await manager.broadcast(f"Notification: {message}")
    return {"message": "Message sent to all clients"}

# Example of a simple background task using the WebSocket manager
async def example_background_task():
    import asyncio
    count = 0
    while True:
        await asyncio.sleep(15)
        count += 1
        await manager.broadcast(f"Periodic update #{count}")

# To run the example background task:
# @app.on_event("startup")
# async def startup_event():
#     asyncio.create_task(example_background_task())