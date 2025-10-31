from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = True
    email_verified: Optional[bool] = False
    role: Optional[str] = "user"  # user, company, admin

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    name: str
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    address: Optional[str] = None
    # Accept input as "phone_number" but map to model attribute "phone"
    phone: Optional[str] = Field(default=None, validation_alias="phone_number")

# Properties to return via API
class User(UserBase):
    id: int
    points: int
    address: Optional[str] = None
    # Serialize output as "phone_number" while reading from attribute "phone"
    phone: Optional[str] = Field(default=None, serialization_alias="phone_number")
    is_superuser: Optional[bool] = False
    email_verified: bool
    role: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Token response
class Token(BaseModel):
    access_token: str
    token_type: str

# User with token response
class UserWithToken(BaseModel):
    access_token: str
    token_type: str
    user: User