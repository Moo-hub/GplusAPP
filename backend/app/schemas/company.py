from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

try:
    from pydantic import ConfigDict as _ConfigDict
except Exception:
    _ConfigDict = None


class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    materials: Optional[List[str]] = None
    impact_metrics: Optional[Dict[str, float]] = None
    contact_info: Optional[Dict[str, str]] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None

class Company(CompanyBase):
    id: int

    if _ConfigDict is not None:
        model_config = _ConfigDict(from_attributes=True)
    else:
        model_config = {"orm_mode": True}