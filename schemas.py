from pydantic import BaseModel

class ImpactOut(BaseModel):
    id: int
    category: str
    score: float
