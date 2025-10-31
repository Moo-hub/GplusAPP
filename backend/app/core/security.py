from datetime import datetime, timedelta
from typing import Any, Union, Dict, Optional, Tuple
import secrets
import uuid
from jose import jwt, JWTError
from fastapi import HTTPException, status, Request
from passlib.context import CryptContext
import bcrypt
from app.core.config import settings
from redis import Redis

# Note: Some environments (notably Windows with certain bcrypt versions)
# can trigger Passlib's bcrypt backend detection to raise ValueError during
# initialization when it probes long passwords. To avoid flaky behavior while
# still supporting existing "$2b$" bcrypt hashes seeded in tests/DB, we use
# the bcrypt library directly for hash/verify, and keep a Passlib context for
# any future compatibility needs.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
redis_client = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

def _blacklist_key(jti: str) -> str:
    """Build a blacklist key, isolating test runs from shared/dev data."""
    prefix = "blacklist:"
    if settings.ENVIRONMENT == "test":
        prefix = "test:blacklist:"
    return f"{prefix}{jti}"

def validate_csrf_token(request: Request, csrf_token: Optional[str]) -> None:
    """
    Validate CSRF token for mutation operations.
    """
    
    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing CSRF token"
        )
    
    # Prefer cookie-based validation to avoid requiring SessionMiddleware
    cookie_token = request.cookies.get("csrf_token")
    if not cookie_token or cookie_token != csrf_token:
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
    
    # Include a JWT ID (jti) for access tokens as well, to support tracing and blacklisting in tests
    jti = str(uuid.uuid4())
    to_encode = {"exp": expire, "sub": str(subject), "type": "access", "jti": jti}
    
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
    redis_client.setex(_blacklist_key(jti), expiry_seconds, "1")

# Backwards-compatible alias used in some tests
def add_token_to_blacklist(jti: str, expiry_seconds: int) -> None:
    """Alias to maintain compatibility with older test code naming."""
    blacklist_token(jti, expiry_seconds)

def is_token_blacklisted(jti: str) -> bool:
    """Check if a token is blacklisted.
    
    Args:
        jti: The JWT ID
        
    Returns:
        True if blacklisted, False otherwise
    """
    return redis_client.exists(_blacklist_key(jti)) > 0

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
    # Support legacy/test signature where a request object is passed first
    if hasattr(request_token, "cookies"):
        request = request_token
        req_token = request.cookies.get("csrf_token")
        if not req_token or not stored_token:
            return False
        return secrets.compare_digest(req_token, stored_token)
    else:
        if not request_token or not stored_token:
            return False
        return secrets.compare_digest(request_token, stored_token)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.
    
    Uses bcrypt.checkpw directly for $2b$/$2a$ style hashes to avoid Passlib
    backend detection issues on some platforms.
    
    Args:
        plain_password: The plaintext password
        hashed_password: The hashed password (bcrypt $2b$ supported)
        
    Returns:
        True if password matches hash, False otherwise
    """
    if not isinstance(hashed_password, str):
        return False
    try:
        # Handle standard bcrypt hashes directly
        if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        # Fallback to passlib for any other configured schemes
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        # As a safety net, fallback to direct bcrypt verification
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt with 12 rounds.
    
    Args:
        password: The plaintext password
        
    Returns:
        The hashed password (bcrypt $2b$ format)
    """
    # 12 rounds to match test fixtures and common defaults
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
