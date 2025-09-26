from fastapi import APIRouter

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/")
def wallet_info():
    return {"message": "Wallet info endpoint"}
