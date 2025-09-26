from fastapi import APIRouter

router = APIRouter(prefix="/recycling", tags=["recycling"])


@router.get("/")
def recycling_info():
    return {"message": "Recycling info endpoint"}
