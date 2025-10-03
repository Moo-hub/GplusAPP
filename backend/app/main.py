# backend/app/main.py
import logging
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import uuid

from app.api.websockets import manager
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.db_utils import check_db_connected, check_and_init_db
from app.db.session import SessionLocal
from app.core.redis_tasks import lifespan, configure_scheduler
from app.utils.json_encoder import CustomJSONResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Create FastAPI app with lifespan event handlers for Redis monitoring
app = FastAPI(
    title="GPlus-Recycling-EcoSys-Pro",
    description="Recycling Ecosystem API",
    version="0.1.0",
    # Only use Redis lifespan in production, not in development
    lifespan=lifespan if os.environ.get("ENVIRONMENT") != "development" else None,
    default_response_class=CustomJSONResponse
)

# Check database on startup
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        check_db_connected(db)
        check_and_init_db(db)
        
        # Configure Redis monitoring scheduler only if not in development
        if os.environ.get("ENVIRONMENT") != "development":
            try:
                configure_scheduler(app)
            except Exception as e:
                logging.warning(f"Redis monitoring not available: {e}")
                logging.info("Continuing without Redis monitoring")
    except Exception as e:
        logging.error(f"Error in startup: {e}")
    finally:
        db.close()

# Add cache performance monitoring middleware
from app.core.middleware.cache_performance import CachePerformanceMiddleware
from app.core.middleware.cache_control import CacheControlMiddleware
app.add_middleware(CachePerformanceMiddleware)
app.add_middleware(CacheControlMiddleware)

# Set up CORS - Make sure this is before any routers are included
app.add_middleware(
    CORSMiddleware,
    # Allow any localhost port for development
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3007", 
        "http://localhost:3008",
        "http://localhost:3009",
        "http://localhost:3014", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3007",
        "http://127.0.0.1:3008",
        "http://127.0.0.1:3009",
        "http://127.0.0.1:3014", 
        "http://0.0.0.0:3014"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Cache-Control",
        "Pragma"
    ],
    expose_headers=["*"],
)

# Add security middleware
from app.middlewares.security import RateLimiter, CSRFProtection
from app.core.security_monitoring import create_security_middleware

# Only use security middleware in production environments
if os.environ.get("ENVIRONMENT") != "test":
    # Security monitoring middleware (should be first to capture all events)
    app.add_middleware(create_security_middleware())
    
    # Rate limiting for sensitive endpoints
    app.add_middleware(RateLimiter)
    
    # CSRF protection middleware
    app.add_middleware(CSRFProtection)

# Prometheus
Instrumentator().instrument(app).expose(app)

# Import API router and websocket handlers after defining app
from app.api.api_v1.api import api_router
from app.api.websockets import websocket_endpoint

# Add API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to GPlus Recycling EcoSystem API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "GPlus API", "version": "1.0.0"}

# WebSocket endpoint with connection ID
@app.websocket("/ws/{connection_id}")
async def websocket_route(
    websocket: WebSocket, 
    connection_id: str = None
):
    # Generate a connection ID if none provided
    if not connection_id:
        connection_id = str(uuid.uuid4())
    
    await websocket_endpoint(websocket, connection_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

# End of file - FastAPI application