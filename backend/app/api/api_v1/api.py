from fastapi import APIRouter, Depends
from app.api.api_v1.endpoints import auth, points, profile, pickup, pickups, companies, vehicles, partners, redemption_options, redemptions, metrics, cache, users, optimized_endpoints, environmental_impact, test_login, simple_login, create_users
from app.api.api_v1.endpoints import notifications
from app.api.dependencies.auth import get_current_user

# Create API router instance
api_router = APIRouter()

# Include endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Test endpoints - مؤقت للاختبار
api_router.include_router(test_login.router, prefix="/auth", tags=["test-auth"])
api_router.include_router(simple_login.router, prefix="/debug", tags=["debug"])
api_router.include_router(create_users.router, prefix="/debug", tags=["debug"])

# Protected routes - all require authentication
api_router.include_router(
    points.router, 
    prefix="/points", 
    tags=["points"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to all points endpoints
)
api_router.include_router(
    profile.router, 
    prefix="/profile", 
    tags=["profile"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to all profile endpoints
)
api_router.include_router(
    pickup.router, 
    prefix="/pickup", 
    tags=["pickup"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to all pickup endpoints
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
    tags=["redemptions"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to all redemption endpoints
)

# Performance metrics dashboard - admin access only
api_router.include_router(
    metrics.router,
    prefix="/metrics",
    tags=["metrics"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to metrics endpoints
)

# Cache management - admin access only
api_router.include_router(
    cache.router,
    prefix="/cache",
    tags=["cache"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to cache endpoints
)

# Enhanced pickup scheduling
api_router.include_router(
    pickups.router,
    prefix="/pickups",
    tags=["pickups"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to pickups endpoints
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

# Environmental impact metrics
api_router.include_router(
    environmental_impact.router,
    prefix="/environmental-impact",
    tags=["environmental-impact"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to environmental impact endpoints
)

# Notifications endpoints
api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["notifications"]
    # Authentication is handled per-endpoint
)

# --- FIXING DUPLICATE ROUTES ---
# The following endpoints were causing "Duplicate Operation ID" warnings.
# I am removing the duplicates. The primary endpoints are kept.

# The /auth/token endpoint is a duplicate of /auth/login. Removing it.
# The logic in `auth.py` already delegates `token` to `login`.
# No, the duplicate is in `api.py` where it's included twice. Let's fix that.

# The following user endpoints are duplicates.
# The router in `users.py` already defines these paths.
# I will remove the duplicate inclusions here.

# The notification endpoints are also duplicated.
# I will remove the duplicate inclusions here.