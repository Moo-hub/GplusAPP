from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl


# Shared properties
class PartnerBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True


# Properties to receive on partner creation
class PartnerCreate(PartnerBase):
    pass


# Properties to receive on partner update
class PartnerUpdate(PartnerBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None


# Properties shared by models stored in DB
class PartnerInDBBase(PartnerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Properties to return to client
class Partner(PartnerInDBBase):
    pass


# Properties stored in DB, not returned by API
class PartnerInDB(PartnerInDBBase):
    pass


# Properties for partner with relationships
class PartnerWithRelations(Partner):
    redemption_options: List["RedemptionOption"] = []


# Import at the end to avoid circular imports
from app.schemas.redemption_option import RedemptionOption
PartnerWithRelations.update_forward_refs()