from pydantic import BaseModel, EmailStr
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
    phone: Optional[str] = None

# Properties to return via API
class User(UserBase):
    id: int
    points: int
    address: Optional[str] = None
    phone: Optional[str] = None
    email_verified: bool
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token response
class Token(BaseModel):
    access_token: str
    token_type: str

# User with token response
class UserWithToken(BaseModel):
    access_token: str
    token_type: str
    user: User