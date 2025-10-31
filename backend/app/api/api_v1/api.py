from fastapi import APIRouter, Depends
from app.api.api_v1.endpoints import auth, points, profile, pickup, pickups, companies, vehicles, partners, redemption_options, redemptions, metrics, cache, users, optimized_endpoints, environmental_impact, notifications, internal, admin
from app.api.dependencies.auth import get_current_user

# Create API router instance
api_router = APIRouter()

# Include endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Protected routes - all require authentication
api_router.include_router(
    points.router, 
    prefix="/points", 
    tags=["points"]
)
api_router.include_router(
    internal.router,
    prefix="/internal",
    tags=["internal"]
)
api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["notifications"]
)
api_router.include_router(
    profile.router, 
    prefix="/profile", 
    tags=["profile"]
)
api_router.include_router(
    pickup.router, 
    prefix="/pickup", 
    tags=["pickup"]
)
api_router.include_router(
    companies.router, 
    prefix="/companies", 
    tags=["companies"]
    # No global dependency - some company endpoints may be public
)
api_router.include_router(
    vehicles.router, 
    prefix="/vehicles", 
    tags=["vehicles"]
    # No global dependency - some vehicle endpoints may be public
)

# Redemption system endpoints
api_router.include_router(
    partners.router,
    prefix="/partners",
    tags=["partners"]
    # No global dependency - some partner endpoints may be public
)
api_router.include_router(
    redemption_options.router,
    prefix="/redemption-options",
    tags=["redemption-options"]
    # No global dependency - some redemption option endpoints may be public
)
api_router.include_router(
    redemptions.router,
    prefix="/redemptions",
    tags=["redemptions"]
)

# Performance metrics dashboard - admin access only
api_router.include_router(
    metrics.router,
    prefix="/metrics",
    tags=["metrics"]
)

# Cache management - admin access only
api_router.include_router(
    cache.router,
    prefix="/cache",
    tags=["cache"]
)

# Enhanced pickup scheduling
api_router.include_router(
    pickups.router,
    prefix="/pickups",
    tags=["pickups"]
)

# User management
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
    # No global dependency - authentication handled at endpoint level
)

# Optimized endpoints with pagination and performance enhancements
api_router.include_router(
    optimized_endpoints.router,
    prefix="/optimized",
    tags=["optimized"]
    # Authentication handled at endpoint level
)

# Environmental impact metrics endpoint is currently disabled in local dev because the module is missing.
# Environmental impact metrics endpoints
api_router.include_router(
    environmental_impact.router,
    prefix="/environmental-impact",
    tags=["environmental-impact"]
)

# Admin endpoints (RBAC). Guarded inside the endpoints using get_current_superuser.
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)