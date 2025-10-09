# templates/backend_fastapi/src/schemas.py

from typing import Optional
from pydantic import BaseModel

# Try Pydantic v2 imports first
try:
    from pydantic import ConfigDict as _ConfigDict
    PYDANTIC_V2 = True
except ImportError:
    PYDANTIC_V2 = False

{% if component_features.BackendFastAPI.database_support %}
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    if PYDANTIC_V2:
        model_config = _ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True # For SQLAlchemy ORM compatibility
{% endif %}

{% if component_features.BackendFastAPI.auth_jwt %}
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
{% endif %}