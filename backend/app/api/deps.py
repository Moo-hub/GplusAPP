from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header, Cookie
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token, verify_token_type, is_token_blacklisted
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Dependency to get the current user from an access token.
    
    Args:
        token: JWT access token
        
    Returns:
        The user data from the token
        
    Raises:
        HTTPException: If the token is invalid
    """
    try:
        payload = decode_token(token)
        verify_token_type(payload, "access")
        
        # Check token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_TOKEN_TYPE", "message": "Not an access token"}
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_TOKEN", "message": "Invalid token payload"}
            )
        
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTHENTICATION_FAILED", "message": "Could not validate credentials"}
        )

def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Dependency to get the current active user.
    
    Args:
        current_user: User data from token
        
    Returns:
        The user data if active
        
    Raises:
        HTTPException: If the user is inactive
    """
    if current_user.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_DISABLED", "message": "Inactive user"}
        )
    return current_user

def check_user_role(required_role: str):
    """Factory for dependencies that check user roles.
    
    Args:
        required_role: The role required for access
        
    Returns:
        A dependency function that checks if the user has the required role
    """
    def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_active_user)
    ) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if not user_role or user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": f"Role {required_role} required"}
            )
        return current_user
    return role_checker

def get_valid_refresh_token(refresh_token: str) -> Dict[str, Any]:
    """Validate a refresh token.
    
    Args:
        refresh_token: JWT refresh token
        
    Returns:
        The token payload if valid
        
    Raises:
        HTTPException: If the token is invalid
    """
    try:
        payload = decode_token(refresh_token)
        verify_token_type(payload, "refresh")
        
        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "TOKEN_REVOKED", "message": "Token has been revoked"}
            )
        
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_REFRESH_TOKEN", "message": "Invalid refresh token"}
        )

def get_current_active_superuser(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Dependency to check if the current user is a superuser.
    
    Args:
        current_user: User data from token
        
    Returns:
        The user data if the user is a superuser
        
    Raises:
        HTTPException: If the user is not a superuser
    """
    if current_user.get("role") != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "PERMISSION_DENIED", "message": "Superuser privileges required"}
        )
    return current_user

def verify_csrf(
    csrf_token: Optional[str] = Header(None, alias="X-CSRF-Token"),
    csrf_cookie: Optional[str] = Cookie(None, alias="csrf_token")
) -> None:
    """Verify CSRF token for protected routes.
    
    Args:
        csrf_token: CSRF token from header
        csrf_cookie: CSRF token from cookie
        
    Raises:
        HTTPException: If CSRF validation fails
    """
    if not csrf_token or not csrf_cookie or csrf_token != csrf_cookie:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "CSRF_TOKEN_INVALID", "message": "Invalid or missing CSRF token"}
        )