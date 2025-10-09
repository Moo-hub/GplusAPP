from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.crud.user import get

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    التحقق من توكن المستخدم والحصول على بياناته
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_CREDENTIALS",
            "message": "Could not validate credentials"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Use the enhanced token decoder from security module
        from app.core.security import decode_token, verify_token_type, is_token_blacklisted
        
        # Decode and validate the token
        payload = decode_token(token)
        
        # Verify this is an access token, not a refresh token
        verify_token_type(payload, "access")
        
        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "TOKEN_REVOKED",
                    "message": "Token has been revoked"
                }
            )
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    التحقق من أن المستخدم نشط
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="المستخدم غير نشط"
        )
    return current_user

def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if the current user is a superuser
    """
    if getattr(current_user, "role", "") != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PERMISSION_DENIED",
                "message": "Insufficient permissions. Superuser access required."
            }
        )
    return current_user

def get_current_company_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if the current user is a company admin
    """
    if not hasattr(current_user, "role") or current_user.role != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PERMISSION_DENIED",
                "message": "Company admin access required"
            }
        )
    return current_user

# دعم WebSocket للمصادقة
async def get_websocket_user(websocket: WebSocket, db: Session) -> Optional[User]:
    """
    Authenticate user via WebSocket
    """
    try:
        # Get token from query parameters or cookie
        token = websocket.query_params.get("token")
        if not token:
            cookies = websocket.headers.get("cookie", "")
            if "token=" in cookies:
                token = cookies.split("token=")[1].split(";")[0]
        
        if not token:
            return None
            
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            return None
            
        user = get(db, user_id=int(user_id))
        if not user or not user.is_active:
            return None
            
        return user
    except (JWTError, ValueError):
        return None

