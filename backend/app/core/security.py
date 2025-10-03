from datetime import datetime, timedelta
from typing import Any, Union, Dict, Optional, Tuple
import secrets
import uuid
from jose import jwt, JWTError
from fastapi import HTTPException, status, Request
from passlib.context import CryptContext
from app.core.config import settings
from redis import Redis

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
redis_client = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

def validate_csrf_token(request: Request, csrf_token: Optional[str]) -> None:
    """
    Validate CSRF token for mutation operations.
    Skip validation in test environment.
    """
    # Skip validation in test environment
    if settings.ENVIRONMENT == "test":
        return
    
    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing CSRF token"
        )
    
    # Get token from session
    session_csrf_token = request.session.get("csrf_token")
    
    if not session_csrf_token or session_csrf_token != csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid CSRF token"
        )

def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None,
    extra_data: Optional[Dict[str, Any]] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    
    # Add extra data like role, permissions, etc.
    if extra_data:
        to_encode.update(extra_data)
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any], 
    jti: Optional[str] = None
) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Generate a unique token ID if not provided
    if not jti:
        jti = str(uuid.uuid4())
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject), 
        "type": "refresh",
        "jti": jti  # JWT ID for tracking and revocation
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token.
    
    Args:
        token: The JWT token to decode
        
    Returns:
        The decoded token payload
        
    Raises:
        HTTPException: If the token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Invalid token"},
        )

def verify_token_type(payload: Dict[str, Any], expected_type: str) -> Dict[str, Any]:
    """Verify that a token is of the expected type.
    
    Args:
        payload: The decoded token payload
        expected_type: The expected token type (access or refresh)
        
    Returns:
        The payload if valid
        
    Raises:
        HTTPException: If the token is not of the expected type
    """
    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN_TYPE", "message": f"Expected {expected_type} token"}
        )
    return payload

def blacklist_token(jti: str, expiry_seconds: int) -> None:
    """Add a token to the blacklist (revoked tokens).
    
    Args:
        jti: The JWT ID
        expiry_seconds: Seconds until the token expires
    """
    redis_client.setex(f"blacklist:{jti}", expiry_seconds, "1")

def is_token_blacklisted(jti: str) -> bool:
    """Check if a token is blacklisted.
    
    Args:
        jti: The JWT ID
        
    Returns:
        True if blacklisted, False otherwise
    """
    return redis_client.exists(f"blacklist:{jti}") > 0

def rotate_refresh_token(payload: Dict[str, Any]) -> Tuple[str, str]:
    """Rotate a refresh token and blacklist the old one.
    
    Args:
        payload: The decoded token payload
        
    Returns:
        A tuple of (new_refresh_token, jti)
    """
    # Blacklist the old token
    old_jti = payload.get("jti")
    expiry = payload.get("exp")
    now = datetime.utcnow()
    
    # Calculate seconds until expiry
    if expiry:
        ttl = int((datetime.fromtimestamp(expiry) - now).total_seconds())
        if ttl > 0:
            blacklist_token(old_jti, ttl)
    
    # Create new refresh token with new JTI
    new_jti = str(uuid.uuid4())
    new_refresh_token = create_refresh_token(payload["sub"], jti=new_jti)
    
    return new_refresh_token, new_jti

def generate_csrf_token() -> str:
    """Generate a secure CSRF token.
    
    Returns:
        A random secure token
    """
    return secrets.token_hex(32)

def verify_csrf_token(request_token: str, stored_token: str) -> bool:
    """Verify that the CSRF token from the request matches the stored token.
    
    Args:
        request_token: Token from the request header
        stored_token: Token from the session/cookie
        
    Returns:
        True if tokens match, False otherwise
    """
    if not request_token or not stored_token:
        return False
    return secrets.compare_digest(request_token, stored_token)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.
    
    Args:
        plain_password: The plaintext password
        hashed_password: The hashed password
        
    Returns:
        True if password matches hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password.
    
    Args:
        password: The plaintext password
        
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)
