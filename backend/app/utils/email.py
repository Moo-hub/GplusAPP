import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
from typing import List, Optional
from fastapi import BackgroundTasks
import logging
from datetime import datetime, timedelta
from jose import jwt

logger = logging.getLogger(__name__)

def generate_reset_token(email: str) -> str:
    """Generate a secure token for password reset
    
    Args:
        email: The user's email address
        
    Returns:
        A JWT token with the user email and expiration time
    """
    expiration = datetime.utcnow() + timedelta(hours=24)
    payload = {
        "sub": email,
        "exp": expiration,
        "type": "password_reset",
        "iat": datetime.utcnow(),
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token

def generate_verification_token(email: str) -> str:
    """Generate a secure token for email verification
    
    Args:
        email: The user's email address
        
    Returns:
        A JWT token with the user email and expiration time
    """
    expiration = datetime.utcnow() + timedelta(days=7)  # Token valid for 7 days
    payload = {
        "sub": email,
        "exp": expiration,
        "type": "email_verification",
        "iat": datetime.utcnow(),
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token

def verify_token(token: str, token_type: str) -> Optional[str]:
    """Verify a token and extract the email
    
    Args:
        token: The token to verify
        token_type: The expected token type (password_reset or email_verification)
        
    Returns:
        The email address from the token or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        email: str = payload.get("sub")
        return email
    except jwt.JWTError:
        return None

def send_email(recipient_email: str, subject: str, html_content: str) -> bool:
    """Send an email using SMTP
    
    Args:
        recipient_email: The recipient's email address
        subject: The email subject
        html_content: The HTML content of the email
        
    Returns:
        True if sent successfully, False otherwise
    """
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.EMAILS_FROM_EMAIL
        msg['To'] = recipient_email

        # Create the HTML part
        html_part = MIMEText(html_content, 'html')
        
        # Attach parts to message
        msg.attach(html_part)
        
        # Send the message
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, recipient_email, msg.as_string())
            
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

def send_reset_password_email(background_tasks: BackgroundTasks, email: str, token: str) -> None:
    """Send a password reset email
    
    Args:
        background_tasks: FastAPI background tasks
        email: The recipient's email address
        token: The password reset token
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "G+ App Password Reset"
    html_content = f"""
    <html>
        <body>
            <h1>Password Reset Request</h1>
            <p>We received a request to reset your password for your G+ App account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <p>This link will expire in 24 hours.</p>
            <p>Thank you,<br>G+ App Team</p>
        </body>
    </html>
    """
    
    background_tasks.add_task(send_email, email, subject, html_content)

def send_verification_email(background_tasks: BackgroundTasks, email: str, token: str) -> None:
    """Send an email verification link
    
    Args:
        background_tasks: FastAPI background tasks
        email: The recipient's email address
        token: The verification token
    """
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "G+ App Email Verification"
    html_content = f"""
    <html>
        <body>
            <h1>Email Verification</h1>
            <p>Thank you for registering with G+ App!</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="{verification_link}">Verify Email</a></p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>This link will expire in 7 days.</p>
            <p>Thank you,<br>G+ App Team</p>
        </body>
    </html>
    """
    
    background_tasks.add_task(send_email, email, subject, html_content)