from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

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
    
    class Config:
        from_attributes = True