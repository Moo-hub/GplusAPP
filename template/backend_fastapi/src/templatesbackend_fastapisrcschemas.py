# templates/backend_fastapi/src/schemas.py

from typing import Optional
from pydantic import BaseModel

{% if component_features.BackendFastAPI.database_support %}
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    try:
        from pydantic import ConfigDict as _ConfigDict
    except Exception:
        _ConfigDict = None

    if _ConfigDict is not None:
        # pydantic v2: use from_attributes for ORM-friendly reading
        model_config = _ConfigDict(from_attributes=True)
    else:
        # Pydantic v1 fallback: enable orm_mode
        model_config = {"orm_mode": True}
{% endif %}

{% if component_features.BackendFastAPI.auth_jwt %}
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
{% endif %}