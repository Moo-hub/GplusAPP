from fastapi import APIRouter

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/")
def vehicles_info():
    return {"message": "Vehicles info endpoint"}
