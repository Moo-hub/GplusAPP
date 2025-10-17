from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

try:
    from pydantic import ConfigDict as _ConfigDict
except Exception:
    _ConfigDict = None

class PointTransaction(BaseModel):
    id: int
    points: int
    type: str  # 'earn' or 'spend'
    description: str
    source: str
    created_at: datetime

    if _ConfigDict is not None:
        model_config = _ConfigDict(from_attributes=True)
    else:
        model_config = {"orm_mode": True}

class PointsSummary(BaseModel):
    balance: int
    impact: str
    reward: str
    monthlyPoints: int
    streak: int

class PointsHistory(BaseModel):
    transactions: List[PointTransaction]