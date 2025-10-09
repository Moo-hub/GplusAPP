from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class PasswordResetRequest(BaseModel):
    """Schema for password reset request"""
    email: EmailStr = Field(..., description="Email address for password reset")
    
class PasswordResetVerify(BaseModel):
    """Schema for verifying a reset token and setting new password"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")
    
class EmailVerification(BaseModel):
    """Schema for email verification"""
    token: str = Field(..., description="Email verification token")
    
class UserVerificationStatus(BaseModel):
    """Schema for user verification status response"""
    email_verified: bool = Field(False, description="Whether email is verified")
    verification_required: bool = Field(True, description="Whether verification is required")
    message: Optional[str] = Field(None, description="Optional status message")