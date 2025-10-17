from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

try:
    from pydantic import ConfigDict as _ConfigDict
except Exception:
    _ConfigDict = None

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = True
    email_verified: Optional[bool] = False
    role: Optional[str] = "user"  # user, company, admin
    is_superuser: Optional[bool] = False

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    name: str
    password: str
    is_superuser: Optional[bool] = False

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None

# Properties to return via API
class User(UserBase):
    id: int
    points: int
    address: Optional[str] = None
    phone_number: Optional[str] = None
    email_verified: bool
    role: str
    created_at: datetime
    
    if _ConfigDict is not None:
        # pydantic v2: prefer `from_attributes` and do not set the v1-only `orm_mode`
        model_config = _ConfigDict(from_attributes=True)
    else:
        # pydantic v1 fallback: enable orm_mode
        model_config = {"orm_mode": True}

# Token response
class Token(BaseModel):
    access_token: str
    token_type: str

# User with token response
class UserWithToken(BaseModel):
    access_token: str
    token_type: str
    user: User