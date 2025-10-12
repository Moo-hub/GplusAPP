from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl

# Pydantic v2 compatibility helper: import ConfigDict at module level so
# it does not end up as an un-annotated attribute in the class namespace.
try:
    from pydantic import ConfigDict as _ConfigDict
except Exception:
    _ConfigDict = None


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

    if _ConfigDict is not None:
        model_config = _ConfigDict(from_attributes=True)
    else:
        model_config = {"orm_mode": True}


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
try:
    PartnerWithRelations.model_rebuild()
except Exception:
    # Fallback for older Pydantic versions
    PartnerWithRelations.update_forward_refs()