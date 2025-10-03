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