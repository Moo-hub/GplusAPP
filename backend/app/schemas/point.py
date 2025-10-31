from typing import Optional, List
from pydantic import BaseModel
try:
    from pydantic import ConfigDict  # Pydantic v2
except Exception:  # pragma: no cover - fallback for v1
    ConfigDict = None  # type: ignore
from datetime import datetime

class PointTransaction(BaseModel):
    id: int
    points: int
    type: str  # 'earn' or 'spend'
    description: str
    source: str
    created_at: datetime

    if ConfigDict is not None:
        model_config = ConfigDict(from_attributes=True)
    else:  # pragma: no cover - v1 fallback
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