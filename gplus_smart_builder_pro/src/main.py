import hvac

import logging
import os
import json
try:
    import boto3
    _aws_client = boto3.client('secretsmanager', region_name=os.getenv('AWS_REGION', 'us-east-1'))
    _secret_value = _aws_client.get_secret_value(SecretId=os.getenv('AWS_SECRET_ID', 'gplusapp/prod'))
    _secret = json.loads(_secret_value['SecretString'])
    POSTGRES_PASSWORD = _secret.get('POSTGRES_PASSWORD')
    SECRET_KEY = _secret.get('SECRET_KEY')
    # أضف أي متغيرات أخرى تحتاجها
except Exception:
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    SECRET_KEY = os.getenv('SECRET_KEY')
import boto3
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from monitoring.metrics import prometheus_middleware
from monitoring.metrics import router as metrics_router
from gplus_smart_builder_pro.src.schemas import Item, ItemBase, ItemCreate
from routers import auth, carbon, recycling, users, vehicles, wallet, admin
from starlette.middleware.base import BaseHTTPMiddleware

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[
        logging.FileHandler("logs/gplus_smart_builder_pro.log"),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger(__name__)

# Optional: Sentry integration for error monitoring
try:
    import sentry_sdk

    sentry_sdk.init(dsn=os.getenv("SENTRY_DSN", ""), traces_sample_rate=1.0)
    logger.info("Sentry initialized.")
except ImportError:
    logger.warning("Sentry SDK not installed. Skipping Sentry integration.")

app = FastAPI()


# Add Prometheus metrics middleware
app.middleware("http")(prometheus_middleware)
# Expose /metrics endpoint
app.include_router(metrics_router)


# CORS configuration (hardened for production)
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
)


# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# Register modular routers

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(recycling.router)
app.include_router(carbon.router)
app.include_router(wallet.router)
app.include_router(vehicles.router)
app.include_router(admin.router)


# Example input validation using Pydantic



@app.get("/")
def read_root():
    return {"message": "GPlus Smart Builder Pro API is running."}


@app.post("/items/")
def create_item(item: Item):
    return {"item": item}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "gplus_smart_builder_pro.src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

client = boto3.client('secretsmanager', region_name='us-east-1')
secret_value = client.get_secret_value(SecretId='gplusapp/prod')
secret = json.loads(secret_value['SecretString'])

POSTGRES_PASSWORD = secret['POSTGRES_PASSWORD']
SECRET_KEY = secret['SECRET_KEY']
