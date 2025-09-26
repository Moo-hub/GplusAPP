from fastapi import APIRouter

router = APIRouter(prefix="/carbon", tags=["carbon"])


@router.get("/")
def carbon_info():
    return {"message": "Carbon info endpoint"}
