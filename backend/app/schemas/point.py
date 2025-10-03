from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class PointTransaction(BaseModel):
    id: int
    points: int
    type: str  # 'earn' or 'spend'
    description: str
    source: str
    created_at: datetime

    class Config:
        orm_mode = True

class PointsSummary(BaseModel):
    balance: int
    impact: str
    reward: str
    monthlyPoints: int
    streak: int

class PointsHistory(BaseModel):
    transactions: List[PointTransaction]