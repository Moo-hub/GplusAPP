from fastapi import APIRouter
from .service import list_impacts

router = APIRouter()


@router.get("/impacts", tags=["Environmental"], summary="List environmental impacts")
async def get_impacts():
    """Return a list of environmental impacts (mock/service)."""
    # service is async; await to ensure proper behavior and OpenAPI operation is async
    return await list_impacts()
