from fastapi import APIRouter
from typing import List
from .schemas import ImpactOut
from .service import list_impacts

router = APIRouter(tags=["Environmental"])

@router.get("/impacts", response_model=List[ImpactOut])
async def get_impacts():
    return await list_impacts()
