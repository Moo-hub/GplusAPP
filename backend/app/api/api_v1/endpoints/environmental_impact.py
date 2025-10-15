from app.environmental import router as environmental_router

# Delegate include to the environmental router
router = environmental_router

# Export name expected by api_v1.api
__all__ = ["router"]
