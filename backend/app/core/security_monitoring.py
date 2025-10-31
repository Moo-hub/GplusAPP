"""
Security monitoring module for tracking and alerting on potential security incidents.
This module logs security-related events and provides alerting mechanisms for suspicious activities.
"""

import logging
import time
from datetime import datetime, timedelta
import json
import redis
from typing import Dict, Any, List, Optional, Tuple, Union
from fastapi import Request, Response
from pydantic import BaseModel

from app.core.config import settings

# Configure logging
logger = logging.getLogger("security_monitor")
logger.setLevel(logging.INFO)

# Add a handler to write to security specific log file
file_handler = logging.FileHandler(filename="logs/security_events.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Add console handler for high-severity events
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.WARNING)
console_formatter = logging.Formatter(
    "\033[91m%(asctime)s [%(levelname)s] SECURITY: %(message)s\033[0m",
    datefmt="%Y-%m-%d %H:%M:%S"
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Redis client for tracking login attempts and other events (lazy, optional)
redis_client = redis.Redis.from_url(settings.REDIS_URL)

def _redis_safe(call, *args, **kwargs):
    """Execute a Redis call safely; log and ignore errors in non-critical paths."""
    try:
        return call(*args, **kwargs)
    except Exception as e:
        # Avoid breaking API flows when Redis is unavailable (e.g., dev/test)
        logger.debug(f"Redis call failed: {e}")
        return None

# Define event types
class SecurityEventType:
    AUTH_FAILURE = "auth_failure"
    AUTH_SUCCESS = "auth_success"
    TOKEN_REFRESH = "token_refresh"
    CSRF_FAILURE = "csrf_failure"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    ACCESS_DENIED = "access_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    EMAIL_VERIFIED = "email_verified"
    VERIFICATION_EMAIL_SENT = "verification_email_sent"

class SecurityEvent(BaseModel):
    """Model for security events"""
    event_type: str
    timestamp: datetime = datetime.utcnow()
    user_id: Optional[int] = None
    ip_address: str
    user_agent: str
    path: str
    method: str
    details: Dict[str, Any] = {}
    severity: int = 1  # 1=info, 2=warning, 3=critical

def log_security_event(
    event_type: str,
    request: Request,
    user_id: Optional[int] = None,
    details: Dict[str, Any] = None,
    severity: int = 1
):
    """
    Log a security event with details from the request
    """
    if details is None:
        details = {}
    
    # Get IP address - handle proxy headers
    ip_address = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    
    # Get user agent
    user_agent = request.headers.get("User-Agent", "unknown")
    
    # Create and log the event
    event = SecurityEvent(
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        path=request.url.path,
        method=request.method,
        details=details,
        severity=severity
    )
    
    # Convert to JSON for logging
    event_json = event.model_dump_json()
    
    # Log based on severity
    if severity == 1:
        logger.info(event_json)
    elif severity == 2:
        logger.warning(event_json)
    else:
        logger.critical(event_json)
    
    # Store in Redis for real-time monitoring (expire after 30 days)
    event_key = f"security:event:{int(time.time())}:{event_type}"
    _redis_safe(redis_client.setex, event_key, 60 * 60 * 24 * 30, event_json)

    # Track events by IP for suspicious activity detection
    ip_key = f"security:ip:{ip_address}"
    _redis_safe(redis_client.lpush, ip_key, event_json)
    _redis_safe(redis_client.ltrim, ip_key, 0, 99)  # Keep last 100 events
    _redis_safe(redis_client.expire, ip_key, 60 * 60 * 24 * 7)  # Expire after 7 days

    # If user_id provided, also track by user
    if user_id:
        user_key = f"security:user:{user_id}"
        _redis_safe(redis_client.lpush, user_key, event_json)
        _redis_safe(redis_client.ltrim, user_key, 0, 99)  # Keep last 100 events
        _redis_safe(redis_client.expire, user_key, 60 * 60 * 24 * 30)  # Expire after 30 days
    
    return event

def track_login_attempt(email: str, ip_address: str, success: bool) -> Tuple[int, bool]:
    """
    Track login attempts for a specific email and IP address
    Returns: (attempt_count, should_alert)
    """
    timestamp = int(time.time())
    
    # Track by email
    email_key = f"security:login:{email}"
    _redis_safe(redis_client.lpush, email_key, json.dumps({
        "timestamp": timestamp,
        "ip": ip_address,
        "success": success
    }))
    _redis_safe(redis_client.ltrim, email_key, 0, 19)  # Keep last 20 attempts
    _redis_safe(redis_client.expire, email_key, 60 * 60 * 24 * 7)  # Expire after 7 days
    
    # Track by IP
    ip_key = f"security:login_ip:{ip_address}"
    _redis_safe(redis_client.lpush, ip_key, json.dumps({
        "timestamp": timestamp,
        "email": email,
        "success": success
    }))
    _redis_safe(redis_client.ltrim, ip_key, 0, 19)  # Keep last 20 attempts
    _redis_safe(redis_client.expire, ip_key, 60 * 60 * 24 * 7)  # Expire after 7 days
    
    # Count failed attempts in last hour
    one_hour_ago = timestamp - 3600
    failed_attempts = 0
    
    # Get recent login attempts
    recent_attempts = _redis_safe(redis_client.lrange, email_key, 0, 19) or []
    for attempt_data in recent_attempts:
        attempt = json.loads(attempt_data)
        if not attempt["success"] and attempt["timestamp"] > one_hour_ago:
            failed_attempts += 1
    
    # Alert on suspicious activity (5+ failed attempts)
    should_alert = failed_attempts >= 5
    
    return failed_attempts, should_alert

def get_user_security_events(user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent security events for a specific user"""
    user_key = f"security:user:{user_id}"
    events = []
    
    event_data = redis_client.lrange(user_key, 0, limit - 1)
    for event_json in event_data:
        events.append(json.loads(event_json))
    
    return events

def get_ip_security_events(ip_address: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent security events for a specific IP address"""
    ip_key = f"security:ip:{ip_address}"
    events = []
    
    event_data = redis_client.lrange(ip_key, 0, limit - 1)
    for event_json in event_data:
        events.append(json.loads(event_json))
    
    return events

def detect_suspicious_activity(request: Request, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Detect suspicious activity based on request patterns
    Returns suspicious activity details if detected, empty dict otherwise
    """
    suspicious = {}
    ip_address = request.client.host if request.client else "unknown"
    
    # Check for unusual locations/IPs (example implementation)
    if user_id:
        # Get user's common IP addresses (would be more sophisticated in production)
        user_events = get_user_security_events(user_id, 50)
        common_ips = set()
        
        for event in user_events:
            if isinstance(event, dict) and "ip_address" in event:
                common_ips.add(event["ip_address"])
        
        # If user has history and current IP not in common IPs
        if common_ips and ip_address not in common_ips and len(common_ips) >= 3:
            suspicious["unusual_ip"] = {
                "current_ip": ip_address,
                "common_ips": list(common_ips)[:5]
            }
    
    # More detection logic would be added here
    
    return suspicious

def create_security_middleware():
    """
    Create a middleware for security monitoring
    """
    from starlette.middleware.base import BaseHTTPMiddleware
    
    class SecurityMonitoringMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            # Process the request
            start_time = time.time()
            
            try:
                response = await call_next(request)
                
                # Log failed authentication
                if response.status_code == 401:
                    log_security_event(
                        SecurityEventType.AUTH_FAILURE,
                        request,
                        details={"status_code": 401},
                        severity=2
                    )
                
                # Log access denied
                if response.status_code == 403:
                    log_security_event(
                        SecurityEventType.ACCESS_DENIED,
                        request,
                        details={"status_code": 403},
                        severity=2
                    )
                
                # Log rate limiting
                if response.status_code == 429:
                    log_security_event(
                        SecurityEventType.RATE_LIMIT_EXCEEDED,
                        request,
                        details={"status_code": 429},
                        severity=2
                    )
                
                return response
                
            except Exception as e:
                # Log exceptions
                log_security_event(
                    SecurityEventType.SUSPICIOUS_ACTIVITY,
                    request,
                    details={"error": str(e)},
                    severity=3
                )
                raise
    
    return SecurityMonitoringMiddleware

def send_security_alert(event: SecurityEvent) -> bool:
    """
    Send an alert for a security event
    In production, this would send emails or SMS or integrate with monitoring systems
    """
    # Log critical alerts
    if event.severity >= 3:
        logger.critical(f"SECURITY ALERT: {event.event_type} from {event.ip_address}")
        # In production, send actual alerts via email/SMS
        
        # Example code to send email alert (commented out)
        """
        from app.core.email import send_email
        send_email(
            to_email=settings.SECURITY_ALERT_EMAIL,
            subject=f"SECURITY ALERT: {event.event_type}",
            content=f"Critical security event detected:\n{event.model_dump_json(indent=2)}"
        )
        """
        
        return True
    
    return False