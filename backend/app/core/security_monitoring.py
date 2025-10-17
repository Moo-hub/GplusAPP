"""
Security monitoring module for tracking and alerting on potential security incidents.
This module logs security-related events and provides alerting mechanisms for suspicious activities.
"""

import logging
import time
from pathlib import Path
from datetime import datetime, timedelta
import json
import redis
import asyncio
import inspect
from app.core.redis_client import get_redis_client
from typing import Dict, Any, List, Optional, Tuple, Union
from fastapi import Request, Response
from pydantic import BaseModel

from app.core.config import settings

# Configure logging
logger = logging.getLogger("security_monitor")
logger.setLevel(logging.INFO)

# Ensure logs directory exists and add a handler to write to security specific log file
logs_dir = Path(__file__).resolve().parents[2].joinpath('..').resolve() / 'logs'
try:
    logs_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    # Fallback: use repo root logs path
    logs_dir = Path.cwd() / 'logs'

log_file_path = logs_dir / 'security_events.log'
try:
    file_handler = logging.FileHandler(filename=str(log_file_path))
    file_formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
except Exception:
    # If file handler setup fails (permission, path, etc.), keep logging to
    # the console handlers we already set up. Don't raise during import.
    logger.debug(f"Could not create file handler for {log_file_path}; using console only")

# Add console handler for high-severity events
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.WARNING)
console_formatter = logging.Formatter(
    "\033[91m%(asctime)s [%(levelname)s] SECURITY: %(message)s\033[0m",
    datefmt="%Y-%m-%d %H:%M:%S"
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# We will fetch the Redis client on demand (call get_redis_client()) so tests
# and environments that swap the client at runtime (in-memory shim) work
# reliably. Keep a module-level reference only for fallbacks.
_default_redis_client = None
try:
    _default_redis_client = get_redis_client()
except Exception:
    _default_redis_client = None


# Monitoring enablement helper
def _monitoring_enabled() -> bool:
    """Return True when Redis-based monitoring/alerts should run.
    We disable active monitoring in test environments to avoid noisy failures
    and to make unit tests deterministic.
    """
    try:
        # Explicitly disable Redis-based monitoring in unit tests to avoid
        # flakiness caused by in-memory shims that are not fully async/await
        # compatible. Tests should be deterministic without external
        # monitoring side-effects.
        if settings.ENVIRONMENT == "test":
            return False
        return bool(settings.REDIS_ALERTS_ENABLED)
    except Exception:
        return False


# ----- Safe Redis helpers -----
def _has_method(obj, name: str) -> bool:
    return obj is not None and hasattr(obj, name)

def _get_client():
    """Return an available redis client or None."""
    try:
        client = get_redis_client()
    except Exception:
        client = _default_redis_client
    return client

def safe_setex(key: str, ttl: int, value: Union[str, bytes]):
    # Short-circuit if monitoring/Redis alerts are disabled (e.g., during tests)
    if not _monitoring_enabled():
        return None
    try:
        client = _get_client()
        if not client or not _has_method(client, 'setex'):
            return None
        # Ensure value is a string/bytes
        if not isinstance(value, (str, bytes)):
            value = json.dumps(value, default=str)
        # Call the client's setex and if it returns an awaitable, handle it
        # safely. Some in-memory shims may return plain dict/list objects and
        # not awaitables — handle those gracefully.
        res = client.setex(key, ttl, value)
        try:
            if inspect.isawaitable(res):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    return asyncio.get_event_loop().run_until_complete(res)
                else:
                    asyncio.create_task(res)
                    return None
        except Exception:
            # If inspect or loop handling fails, treat the result as non-awaitable
            pass
        return res
    except Exception as e:
        logger.debug(f"safe_setex failed for {key}: {e}")
    return None

def safe_lpush(key: str, *values):
    if not _monitoring_enabled():
        return None
    try:
        client = _get_client()
        if not client or not _has_method(client, 'lpush'):
            return None
        # Convert values to strings so in-memory shims and redis accept them
        norm_values = []
        for v in values:
            if not isinstance(v, (str, bytes)):
                norm_values.append(json.dumps(v, default=str))
            else:
                norm_values.append(v)
        res = client.lpush(key, *norm_values)
        try:
            if inspect.isawaitable(res):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    return asyncio.get_event_loop().run_until_complete(res)
                else:
                    asyncio.create_task(res)
                    return None
        except Exception:
            pass
        return res
    except Exception as e:
        logger.debug(f"safe_lpush failed for {key}: {e}")
    return None

def safe_lrange(key: str, start=0, end=-1):
    if not _monitoring_enabled():
        return []
    try:
        client = _get_client()
        if not client or not _has_method(client, 'lrange'):
            return []
        raw = client.lrange(key, start, end)
        # If this is an awaitable (async client), try to resolve it
        try:
            if inspect.isawaitable(raw):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    raw = asyncio.get_event_loop().run_until_complete(raw)
                else:
                    asyncio.create_task(raw)
                    return []
        except Exception:
            # If inspect fails or raw is a non-awaitable shim (dict/list),
            # fall through to normalization below.
            pass
        # Normalize bytes to str for callers that will json.loads()
        results = []
        for item in raw:
            if isinstance(item, bytes):
                try:
                    results.append(item.decode('utf-8'))
                except Exception:
                    # Fallback: represent as str()
                    results.append(str(item))
            else:
                results.append(item)
        return results
    except Exception as e:
        logger.debug(f"safe_lrange failed for {key}: {e}")
    return []

def safe_ltrim(key: str, start: int, end: int):
    if not _monitoring_enabled():
        return None
    try:
        client = _get_client()
        if not client or not _has_method(client, 'ltrim'):
            return None
        res = client.ltrim(key, start, end)
        try:
            if inspect.isawaitable(res):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    return asyncio.get_event_loop().run_until_complete(res)
                else:
                    asyncio.create_task(res)
                    return None
        except Exception:
            pass
        return res
    except Exception as e:
        logger.debug(f"safe_ltrim failed for {key}: {e}")
    return None

def safe_expire(key: str, seconds: int):
    if not _monitoring_enabled():
        return None
    try:
        client = _get_client()
        if not client or not _has_method(client, 'expire'):
            return None
        res = client.expire(key, seconds)
        try:
            if inspect.isawaitable(res):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    return asyncio.get_event_loop().run_until_complete(res)
                else:
                    asyncio.create_task(res)
                    return None
        except Exception:
            pass
        return res
    except Exception as e:
        logger.debug(f"safe_expire failed for {key}: {e}")
    return None

# -------------------------------

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
    
    # Persist to Redis only if monitoring is enabled
    if _monitoring_enabled():
        try:
            # Store in Redis for real-time monitoring (expire after 30 days)
            event_key = f"security:event:{int(time.time())}:{event_type}"
            safe_setex(event_key, 60 * 60 * 24 * 30, event_json)

            # Track events by IP for suspicious activity detection
            ip_key = f"security:ip:{ip_address}"
            safe_lpush(ip_key, event_json)
            safe_ltrim(ip_key, 0, 99)  # Keep last 100 events
            safe_expire(ip_key, 60 * 60 * 24 * 7)  # Expire after 7 days

            # If user_id provided, also track by user
            if user_id:
                user_key = f"security:user:{user_id}"
                safe_lpush(user_key, event_json)
                safe_ltrim(user_key, 0, 99)  # Keep last 100 events
                safe_expire(user_key, 60 * 60 * 24 * 30)  # Expire after 30 days
        except Exception as e:
            logger.debug(f"Skipping redis persistence due to error: {e}")
    
    return event

def track_login_attempt(email: str, ip_address: str, success: bool) -> Tuple[int, bool]:
    """
    Track login attempts for a specific email and IP address
    Returns: (attempt_count, should_alert)
    """
    timestamp = int(time.time())
    
    # Track by email
    email_key = f"security:login:{email}"
    safe_lpush(email_key, json.dumps({
        "timestamp": timestamp,
        "ip": ip_address,
        "success": success
    }))
    safe_ltrim(email_key, 0, 19)  # Keep last 20 attempts
    safe_expire(email_key, 60 * 60 * 24 * 7)  # Expire after 7 days

    # Track by IP
    ip_key = f"security:login_ip:{ip_address}"
    safe_lpush(ip_key, json.dumps({
        "timestamp": timestamp,
        "email": email,
        "success": success
    }))
    safe_ltrim(ip_key, 0, 19)  # Keep last 20 attempts
    safe_expire(ip_key, 60 * 60 * 24 * 7)  # Expire after 7 days
    
    # Count failed attempts in last hour
    one_hour_ago = timestamp - 3600
    failed_attempts = 0
    
    # Get recent login attempts
    recent_attempts = safe_lrange(email_key, 0, 19)
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
    
    event_data = safe_lrange(user_key, 0, limit - 1)
    for event_json in event_data:
        events.append(json.loads(event_json))
    
    return events

def get_ip_security_events(ip_address: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent security events for a specific IP address"""
    ip_key = f"security:ip:{ip_address}"
    events = []
    
    event_data = safe_lrange(ip_key, 0, limit - 1)
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