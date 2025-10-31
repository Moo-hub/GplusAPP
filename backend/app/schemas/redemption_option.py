from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from pydantic import ConfigDict


# Shared properties
class RedemptionOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    points_required: int
    is_active: bool = True
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock: int = -1  # -1 means unlimited
    partner_id: Optional[int] = None


# Properties to receive on redemption option creation
class RedemptionOptionCreate(RedemptionOptionBase):
    pass


# Properties to receive on redemption option update
class RedemptionOptionUpdate(RedemptionOptionBase):
    name: Optional[str] = None
    points_required: Optional[int] = None
    is_active: Optional[bool] = None


# Properties shared by models stored in DB
class RedemptionOptionInDBBase(RedemptionOptionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Properties to return to client
class RedemptionOption(RedemptionOptionInDBBase):
    pass


# Properties stored in DB, not returned by API
class RedemptionOptionInDB(RedemptionOptionInDBBase):
    pass


# Properties for redemption option with relationships
class RedemptionOptionWithPartner(RedemptionOption):
    partner: Optional["Partner"] = None


# Import at the end to avoid circular imports
from app.schemas.partner import Partner
RedemptionOptionWithPartner.model_rebuild()