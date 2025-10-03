from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Cookie, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import timedelta
from jose import JWTError
import secrets
import time

from app.core.security import create_access_token, create_refresh_token, decode_token, generate_csrf_token, verify_token_type, rotate_refresh_token, is_token_blacklisted, get_password_hash
from app.core.security_monitoring import log_security_event, track_login_attempt, SecurityEventType, detect_suspicious_activity
from app.utils.email import send_reset_password_email, send_verification_email, generate_reset_token, generate_verification_token, verify_token

from app.api.dependencies.auth import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.crud.user import authenticate, create as create_user, get as get_user, update as update_user, get_by_email
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate
from app.schemas.token import TokenPayload, RefreshToken
from app.schemas.auth import PasswordResetRequest, PasswordResetVerify, EmailVerification, UserVerificationStatus

router = APIRouter()

@router.post("/login")
def login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Dict[str, Any]:
    """
    OAuth2 compatible token login, get an access token and refresh token for future requests
    """
    # Get IP address for security tracking
    ip_address = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    
    # Attempt authentication
    user = authenticate(db, email=form_data.username, password=form_data.password)
    
    # Track login attempt for security monitoring
    failed_attempts, should_alert = track_login_attempt(
        email=form_data.username,
        ip_address=ip_address,
        success=(user is not None and user.is_active)
    )
    
    if not user:
        # Log failed authentication
        log_security_event(
            event_type=SecurityEventType.AUTH_FAILURE,
            request=request,
            details={
                "email": form_data.username,
                "failed_attempts": failed_attempts,
                "reason": "invalid_credentials"
            },
            severity=2 if should_alert else 1
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTHENTICATION_FAILED",
                "message": "Incorrect email or password"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        # Log disabled user attempt
        log_security_event(
            event_type=SecurityEventType.AUTH_FAILURE,
            request=request,
            user_id=user.id,
            details={
                "email": form_data.username,
                "reason": "inactive_account"
            },
            severity=2
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail={
                "code": "USER_DISABLED",
                "message": "Inactive user"
            }
        )
    
    # Create extra data with user role
    extra_data = {"role": user.role if hasattr(user, "role") else "user"}
    
    # Generate tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires, extra_data=extra_data
    )
    refresh_token = create_refresh_token(user.id)
    
    # Generate CSRF token
    csrf_token = generate_csrf_token()
    
    # Set CSRF token as cookie (JavaScript accessible for header inclusion)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=settings.CSRF_TOKEN_EXPIRE_MINUTES * 60,
        httponly=False,  # Accessible via JavaScript
        samesite="strict"
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,  # Not accessible via JavaScript
        secure=not settings.DEBUG,  # Secure in production
        samesite="strict"
    )
    
    # Detect any suspicious activity
    suspicious = detect_suspicious_activity(request, user.id)
    
    # Log successful login
    log_security_event(
        event_type=SecurityEventType.AUTH_SUCCESS,
        request=request,
        user_id=user.id,
        details={
            "suspicious": suspicious if suspicious else None
        },
        # Higher severity if suspicious activity detected
        severity=2 if suspicious else 1
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,  # Also included in response for mobile clients
        "token_type": "bearer",
        "csrf_token": csrf_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "points": user.points,
            "role": getattr(user, "role", "user")
        }
    }

@router.post("/register")
def register(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    user_in: UserCreate, 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create new user
    """
    # Check if user with same email exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        # Log registration attempt with existing email
        log_security_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            request=request,
            details={
                "email": user_in.email,
                "reason": "duplicate_registration_attempt"
            },
            severity=2  # Medium severity
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_ALREADY_REGISTERED",
                "message": "Email already registered"
            }
        )

    # Create new user with email_verified=False
    user_dict = user_in.dict()
    user_dict["email_verified"] = False  # Set email as not verified initially
    user = create_user(db, obj_in=user_dict)
    
    # Send verification email if email verification is required
    if settings.REQUIRE_EMAIL_VERIFICATION:
        verification_token = generate_verification_token(user.email)
        send_verification_email(background_tasks, user.email, verification_token)
    
    # Log successful registration
    log_security_event(
        event_type="user_registration",  # Custom event type for registrations
        request=request,
        user_id=user.id,
        details={
            "email": user.email,
            "verification_email_sent": settings.REQUIRE_EMAIL_VERIFICATION
        },
        severity=1  # Info level
    )
    
    # Create extra data with user role
    extra_data = {"role": getattr(user, "role", "user")}
    
    # Generate tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires, extra_data=extra_data
    )
    refresh_token = create_refresh_token(user.id)
    
    # Generate CSRF token
    csrf_token = generate_csrf_token()
    
    # Set CSRF token as cookie (JavaScript accessible for header inclusion)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=settings.CSRF_TOKEN_EXPIRE_MINUTES * 60,
        httponly=False,  # Accessible via JavaScript
        samesite="strict"
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,  # Not accessible via JavaScript
        secure=not settings.DEBUG,  # Secure in production
        samesite="strict"
    )
    
    # Detect any suspicious activity related to registration
    suspicious = detect_suspicious_activity(request)
    
    # Log if any suspicious patterns were detected during registration
    if suspicious:
        log_security_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            request=request,
            user_id=user.id,
            details={
                "suspicious": suspicious,
                "context": "registration"
            },
            severity=2  # Medium severity
        )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,  # Also included in response for mobile clients
        "token_type": "bearer",
        "csrf_token": csrf_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "points": user.points,
            "role": getattr(user, "role", "user")
        }
    }

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user
    """
    return current_user

@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    request: Request,
    background_tasks: BackgroundTasks,
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Request a password reset. Sends a reset link to the user's email.
    """
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Even if user is not found, return success to prevent email enumeration
    # But only send email if user exists
    if user:
        # Generate token
        token = generate_reset_token(user.email)
        
        # Log password reset request
        log_security_event(
            event_type=SecurityEventType.PASSWORD_RESET_REQUEST,
            request=request,
            user_id=user.id,
            details={
                "email": user.email,
                "initiated_from_ip": request.client.host
            },
            severity=2  # Medium severity for password-related operations
        )
        
        # Send email with reset link
        send_reset_password_email(background_tasks, user.email, token)
    else:
        # Log attempt to reset password for non-existent account (could be suspicious)
        log_security_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            request=request,
            details={
                "activity": "password_reset_non_existent",
                "email": reset_request.email
            },
            severity=2  # Medium severity
        )
    
    return {
        "message": "If the email exists in our system, a password reset link has been sent.",
        "code": "PASSWORD_RESET_REQUESTED"
    }

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    request: Request,
    reset_data: PasswordResetVerify,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Reset password using the token received via email.
    """
    # Verify passwords match
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PASSWORD_MISMATCH",
                "message": "Passwords do not match"
            }
        )
    
    # Verify token
    from app.utils.email import verify_token
    email = verify_token(reset_data.token, "password_reset")
    if not email:
        # Log invalid token attempt
        log_security_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            request=request,
            details={
                "activity": "invalid_password_reset_token",
                "token_provided": True
            },
            severity=3  # High severity - could be an attack
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_TOKEN",
                "message": "Invalid or expired token"
            }
        )
    
    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # This should not happen as token is valid, but handling as a precaution
        log_security_event(
            event_type=SecurityEventType.SYSTEM_ERROR,
            request=request,
            details={
                "error": "Valid token but user not found",
                "email": email
            },
            severity=3  # High severity - shouldn't happen
        )
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        )
    
    # Update password
    hashed_password = get_password_hash(reset_data.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    # Log successful password reset
    log_security_event(
        event_type=SecurityEventType.PASSWORD_CHANGE,
        request=request,
        user_id=user.id,
        details={
            "method": "reset_token",
            "initiated_from_ip": request.client.host
        },
        severity=2  # Medium severity for password operations
    )
    
    return {
        "message": "Password has been reset successfully",
        "code": "PASSWORD_RESET_SUCCESS"
    }
    
@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(
    request: Request,
    verification_data: EmailVerification,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verify a user's email address using the token received via email.
    """
    # Verify token
    from app.utils.email import verify_token
    email = verify_token(verification_data.token, "email_verification")
    
    if not email:
        # Log invalid token attempt
        log_security_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            request=request,
            details={
                "activity": "invalid_email_verification_token",
                "token_provided": True
            },
            severity=2  # Medium severity
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_TOKEN",
                "message": "Invalid or expired token"
            }
        )
    
    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # This should not happen as token is valid, but handling as a precaution
        log_security_event(
            event_type=SecurityEventType.SYSTEM_ERROR,
            request=request,
            details={
                "error": "Valid token but user not found",
                "email": email
            },
            severity=3  # High severity - shouldn't happen
        )
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        )
    
    # Update user's email verification status
    user.email_verified = True
    db.commit()
    
    # Log successful email verification
    log_security_event(
        event_type="email_verification",
        request=request,
        user_id=user.id,
        details={
            "email": email,
            "initiated_from_ip": request.client.host
        },
        severity=1  # Info level
    )
    
    return {
        "message": "Email has been verified successfully",
        "code": "EMAIL_VERIFIED"
    }
    
@router.get("/verification-status", response_model=UserVerificationStatus)
def get_verification_status(current_user: User = Depends(get_current_user)) -> UserVerificationStatus:
    """
    Get the email verification status for the current user
    """
    email_verified = getattr(current_user, "email_verified", False)
    verification_required = settings.REQUIRE_EMAIL_VERIFICATION
    
    return UserVerificationStatus(
        email_verified=email_verified,
        verification_required=verification_required,
        message="Email verification required" if verification_required and not email_verified else None
    )

@router.post("/refresh")
def refresh_token_endpoint(
    request: Request,
    response: Response,
    refresh_token_data: RefreshToken = Body(None),
    refresh_token_cookie: str = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Refresh access token using refresh token.
    The refresh token can be provided either in the request body or as a cookie.
    """
    try:
        # Use token from cookie if provided, otherwise from request body
        token_to_use = refresh_token_cookie
        if not token_to_use and refresh_token_data:
            token_to_use = refresh_token_data.refresh_token
            
        if not token_to_use:
            # Log missing refresh token attempt
            log_security_event(
                event_type=SecurityEventType.AUTH_FAILURE,
                request=request,
                details={
                    "reason": "missing_refresh_token"
                },
                severity=2  # Medium severity
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "REFRESH_TOKEN_MISSING",
                    "message": "Refresh token is required"
                }
            )
            
        # Decode and validate the token
        payload = decode_token(token_to_use)
        verify_token_type(payload, "refresh")
        
        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            # Log attempt to use blacklisted token - potential replay attack
            log_security_event(
                event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
                request=request,
                details={
                    "reason": "blacklisted_refresh_token",
                    "token_jti": jti
                },
                severity=3  # High severity - potential attack
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "TOKEN_REVOKED",
                    "message": "Token has been revoked"
                }
            )
        
        user_id = payload.get("sub")
        if not user_id:
            # Log invalid token attempt
            log_security_event(
                event_type=SecurityEventType.AUTH_FAILURE,
                request=request,
                details={
                    "reason": "invalid_refresh_token_no_subject"
                },
                severity=2  # Medium severity
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "INVALID_TOKEN",
                    "message": "Invalid refresh token"
                }
            )
        
        # Get user from database
        user = get_user(db, user_id=int(user_id))
        if not user:
            # Log user not found during token refresh - potentially deleted account
            log_security_event(
                event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
                request=request,
                details={
                    "reason": "refresh_token_user_not_found",
                    "user_id": user_id
                },
                severity=2  # Medium severity
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "USER_NOT_FOUND",
                    "message": "User not found"
                }
            )
        if not user.is_active:
            # Log inactive user attempt
            log_security_event(
                event_type=SecurityEventType.AUTH_FAILURE,
                request=request,
                user_id=user.id,
                details={
                    "reason": "refresh_token_inactive_user"
                },
                severity=2  # Medium severity
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "USER_DISABLED",
                    "message": "Inactive user"
                }
            )
        
        # Create extra data with user role
        extra_data = {"role": getattr(user, "role", "user")}
        
        # Generate new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(user.id, expires_delta=access_token_expires, extra_data=extra_data)
        
        # Rotate refresh token for enhanced security
        new_refresh_token, new_jti = rotate_refresh_token(payload)
        
        # Detect any suspicious activity
        suspicious = detect_suspicious_activity(request, user.id)
        
        # Log successful token refresh
        log_security_event(
            event_type=SecurityEventType.TOKEN_REFRESH,
            request=request,
            user_id=user.id,
            details={
                "suspicious": suspicious if suspicious else None,
                "old_jti": payload.get("jti"),
                "new_jti": new_jti
            },
            # Higher severity if suspicious activity detected
            severity=2 if suspicious else 1
        )
        
        # Generate new CSRF token
        csrf_token = generate_csrf_token()
        
        # Set CSRF token as cookie
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            max_age=settings.CSRF_TOKEN_EXPIRE_MINUTES * 60,
            httponly=False,  # Accessible via JavaScript
            samesite="strict"
        )
        
        # Update refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            httponly=True,  # Not accessible via JavaScript
            secure=not settings.DEBUG,  # Secure in production
            samesite="strict"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "csrf_token": csrf_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "points": user.points,
                "role": getattr(user, "role", "user")
            }
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_TOKEN",
                "message": "Invalid refresh token"
            }
        )


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    refresh_token_cookie: str = Cookie(None, alias="refresh_token"),
    refresh_token_data: RefreshToken = Body(None),
) -> Dict[str, Any]:
    """
    Logout user by blacklisting refresh token and clearing cookies.
    The refresh token can be provided either in the request body or as a cookie.
    """
    try:
        # Use token from cookie if provided, otherwise from request body
        token_to_use = refresh_token_cookie
        if not token_to_use and refresh_token_data:
            token_to_use = refresh_token_data.refresh_token
        
        # If we have a token, try to blacklist it
        if token_to_use:
            try:
                payload = decode_token(token_to_use)
                verify_token_type(payload, "refresh")
                
                # Blacklist the token (both by JTI and the token itself)
                from app.core.security import add_token_to_blacklist
                jti = payload.get("jti")
                user_id = payload.get("sub")
                
                if jti:
                    add_token_to_blacklist(jti, settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
                    
                    # Log successful logout with valid token
                    log_security_event(
                        event_type="user_logout",  # Custom event type for logouts
                        request=request,
                        user_id=int(user_id) if user_id else None,
                        details={
                            "token_jti": jti,
                            "method": "blacklisted_token"
                        },
                        severity=1  # Info level
                    )
            except Exception as token_error:
                # If token is invalid, we still proceed with logout by clearing cookies
                log_security_event(
                    event_type="user_logout",
                    request=request,
                    details={
                        "method": "invalid_token",
                        "error": str(token_error)
                    },
                    severity=1  # Info level
                )
        
        # If no token was provided, log that too
        if not token_to_use:
            log_security_event(
                event_type="user_logout",
                request=request,
                details={
                    "method": "cookies_only",
                    "note": "No token provided for blacklisting"
                },
                severity=1  # Info level
            )
            
        # Clear cookies regardless of token validity
        response.delete_cookie(key="refresh_token")
        response.delete_cookie(key="csrf_token")
        
        return {
            "message": "Successfully logged out",
            "code": "LOGOUT_SUCCESS"
        }
    except Exception as e:
        # Log the unexpected error
        log_security_event(
            event_type="user_logout",
            request=request,
            details={
                "method": "error_occurred",
                "error": str(e)
            },
            severity=2  # Medium severity for unexpected errors
        )
        
        # Even if something goes wrong, we still want to clear cookies
        response.delete_cookie(key="refresh_token")
        response.delete_cookie(key="csrf_token")
        
        return {
            "message": "Successfully logged out",
            "code": "LOGOUT_SUCCESS"
        }


@router.post("/verify-email", response_model=UserVerificationStatus)
def verify_email(
    verification_data: EmailVerification,
    db: Session = Depends(get_db)
) -> UserVerificationStatus:
    """
    Verify user's email address using the verification token
    """
    # Verify token
    email = verify_token(verification_data.token, "email_verification")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Get user
    user = get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user verification status
    if not user.email_verified:
        user.email_verified = True
        db.add(user)
        db.commit()
        
        # Log security event
        log_security_event(
            user_id=user.id,
            event_type=SecurityEventType.EMAIL_VERIFIED,
            ip_address="unknown",
            details={"email": user.email}
        )
    
    return UserVerificationStatus(
        email_verified=True,
        verification_required=False,
        message="Email successfully verified"
    )


@router.post("/resend-verification", response_model=Dict[str, str])
def resend_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    email: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Resend verification email to user
    """
    # Get IP for security tracking
    ip_address = request.client.host if request.client else "unknown"
    
    # Get user
    user = get_by_email(db, email=email)
    if not user:
        # Still return success to prevent email enumeration
        time.sleep(1)  # Add delay to prevent timing attacks
        return {"message": "Verification email sent if account exists"}
    
    # If already verified, no need to send
    if user.email_verified:
        return {"message": "Email is already verified"}
    
    # Generate verification token and send email
    verification_token = generate_verification_token(user.email)
    send_verification_email(background_tasks, user.email, verification_token)
    
    # Log security event
    log_security_event(
        user_id=user.id,
        event_type=SecurityEventType.VERIFICATION_EMAIL_SENT,
        ip_address=ip_address,
        details={"email": user.email}
    )
    
    return {"message": "Verification email sent"}


@router.get("/verification-status", response_model=UserVerificationStatus)
def verification_status(
    current_user: User = Depends(get_current_user)
) -> UserVerificationStatus:
    """
    Get current user's email verification status
    """
    verification_required = settings.REQUIRE_EMAIL_VERIFICATION
    
    return UserVerificationStatus(
        email_verified=current_user.email_verified,
        verification_required=verification_required,
        message="Email verification status"
    )