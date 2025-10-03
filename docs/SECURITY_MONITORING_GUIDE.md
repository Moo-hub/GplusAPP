# Security Monitoring Guide

This document provides comprehensive information about the security monitoring system implemented in the G+ Recycling App. It covers setup, configuration, real-time monitoring, event types, alerting mechanisms, and best practices.

## Overview

The security monitoring system in G+ Recycling App provides real-time tracking of security-related events, detection of suspicious activities, and alerting mechanisms for potential security incidents. The system uses Redis for event storage and tracking, and logs security events to dedicated log files.

## Architecture

The security monitoring system consists of the following components:

1. **Event Logger**: Records security events to log files with appropriate severity levels
2. **Redis Storage**: Stores security events for real-time analysis and pattern detection
3. **Detection Engine**: Analyzes patterns to identify suspicious activities
4. **Alerting System**: Notifies administrators of critical security events
5. **Rate Limiting**: Prevents brute force attacks and abuse
6. **Monitoring Dashboard**: Visualizes security events and trends

## Setup and Configuration

### Prerequisites

1. Redis server must be installed and running
2. Proper logging directory permissions must be configured
3. Python 3.9+ with required packages installed

### Environment Configuration

The security monitoring system relies on several environment variables that can be configured in your `.env` file:

```
# Redis connection string
REDIS_URL=redis://localhost:6379/0

# Log levels (INFO, WARNING, ERROR, CRITICAL)
SECURITY_LOG_LEVEL=INFO

# Security event retention period (in days)
SECURITY_EVENT_RETENTION=30

# Rate limiting configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW=3600
```

### Initializing the Monitoring System

The security monitoring system is automatically initialized when the application starts. The initialization process:

1. Sets up the logging configuration
2. Establishes a connection to Redis
3. Registers middleware for request monitoring
4. Initializes the alerting system

## Security Event Types

The security monitoring system tracks the following types of events:

| Event Type | Description | Default Severity |
|------------|-------------|------------------|
| `AUTH_FAILURE` | Failed authentication attempts | WARNING |
| `AUTH_SUCCESS` | Successful authentication | INFO |
| `TOKEN_REFRESH` | JWT token refresh operations | INFO |
| `CSRF_FAILURE` | Cross-Site Request Forgery protection failures | WARNING |
| `RATE_LIMIT_EXCEEDED` | User exceeded rate limits | WARNING |
| `ACCESS_DENIED` | User attempted to access unauthorized resources | WARNING |
| `SUSPICIOUS_ACTIVITY` | Detected potentially malicious behavior | CRITICAL |
| `PASSWORD_RESET_REQUESTED` | User requested password reset | INFO |
| `PASSWORD_RESET_COMPLETED` | User completed password reset | INFO |
| `EMAIL_VERIFIED` | User verified their email address | INFO |
| `VERIFICATION_EMAIL_SENT` | System sent verification email | INFO |

## Real-time Monitoring

The security monitoring system provides real-time tracking of security events through Redis. Events are stored with the following data structure:

```json
{
  "event_type": "auth_failure",
  "timestamp": "2025-09-28T14:32:10.123456",
  "user_id": 1234,  // Optional
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "details": {  // Event-specific details
    "email": "user@example.com",
    "reason": "invalid_password"
  },
  "severity": 2  // 1=INFO, 2=WARNING, 3=CRITICAL
}
```

### Accessing Real-time Events

You can access real-time security events through the Redis interface:

```bash
# Connect to Redis
redis-cli

# List all security events (most recent first)
KEYS security:event:*

# Get specific event details
GET security:event:1695923750:auth_failure

# List events by IP address (most recent first)
LRANGE security:ip:192.168.1.1 0 9

# List events by user ID (most recent first)
LRANGE security:user:1234 0 9
```

## Suspicious Activity Detection

The security monitoring system automatically detects suspicious activity patterns, including:

1. **Multiple Failed Logins**: Detection of brute force attempts
2. **Account Enumeration**: Attempts to discover valid usernames
3. **Session Anomalies**: Unusual session behavior or token usage
4. **Geolocation Anomalies**: Login attempts from unusual locations
5. **Time-based Anomalies**: Activity outside of normal usage patterns
6. **Rate Limiting Violations**: Excessive API requests

### Detection Configuration

Suspicious activity detection thresholds can be configured in the application settings:

```python
# Example detection configuration
SUSPICIOUS_ACTIVITY_SETTINGS = {
    "failed_login_threshold": 5,        # Max failed logins before alert
    "failed_login_window": 3600,       # Time window in seconds (1 hour)
    "ip_geolocation_tracking": True,   # Track IP location changes
    "session_anomaly_detection": True,  # Monitor unusual session behavior
    "alert_on_country_change": True    # Alert on login from new country
}
```

## Alerting System

The security monitoring system can trigger alerts through multiple channels:

1. **Log Files**: All security events are logged to `logs/security_events.log`
2. **Console**: Critical events are output to the console
3. **Email Notifications**: Optional email alerts for critical events
4. **Webhook Integration**: Notifications to external systems (e.g., Slack)
5. **Admin Dashboard**: Real-time alerts in the admin interface

## Reviewing Security Events

### Security Log Files

The security monitoring system logs all events to `logs/security_events.log`. The log format is JSON for easy parsing and analysis:

```bash
# View all security events
cat logs/security_events.log

# View the last 50 events
tail -50 logs/security_events.log

# Search for specific event types
grep '"event_type":"auth_failure"' logs/security_events.log

# Search for events from a specific IP
grep '"ip_address":"192.168.1.1"' logs/security_events.log

# Count events by type
grep -o '"event_type":"[^"]*"' logs/security_events.log | sort | uniq -c
```

### Admin Dashboard

The G+ Recycling App includes a security monitoring dashboard at `/admin/security/events` that provides:

1. Real-time event visualization
2. Filtering by event type, severity, and time range
3. User activity timelines
4. IP address analysis
5. Alert management

### Redis Event Storage

Security events are stored in Redis for real-time access and analysis. You can query Redis directly to inspect events:

```bash
redis-cli

# List all security-related keys
> KEYS security:*

# Check login attempts for a specific email
> LRANGE security:login:user@example.com 0 -1

# Check events by IP address
> LRANGE security:ip:192.168.1.1 0 -1

# Check events by user ID
> LRANGE security:user:1234 0 -1
```

## Rate Limiting

The security monitoring system includes a rate limiting mechanism to prevent abuse. Rate limiting is applied to:

1. Authentication endpoints
2. Password reset functionality
3. Account creation
4. API endpoints with sensitive operations

### Rate Limiting Configuration

Rate limiting can be configured in the application settings:

```python
# Example rate limiting configuration
RATE_LIMIT_SETTINGS = {
    "/api/v1/auth/login": {"limit": 5, "window": 300},    # 5 attempts per 5 minutes
    "/api/v1/auth/register": {"limit": 3, "window": 3600}, # 3 attempts per hour
    "/api/v1/users/reset-password": {"limit": 3, "window": 3600}
}
```

### Testing Rate Limiting

You can test rate limiting by making repeated requests to rate-limited endpoints:

```bash
# Test login rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test@example.com&password=wrongpassword"
  echo ""
  sleep 0.5
done
```

After exceeding the configured limit, you will receive a 429 Too Many Requests response.

## Testing Security Monitoring

A dedicated test script is available to verify security monitoring functionality:

```bash
# Run security monitoring tests
python -m tests.test_security_monitoring
```

The test script simulates various scenarios:

1. User registration (with security event logging)
2. Duplicate registration attempts (should trigger security events)
3. Successful login (with security event tracking)
4. Failed login attempts (to test login monitoring and rate limiting)
5. Token refresh operations (to verify token rotation and monitoring)
6. Logout functionality (to test token blacklisting)

## Best Practices

### Security Monitoring Implementation

1. **Complete Coverage**: Ensure all authentication and authorization flows use the security monitoring system
2. **Appropriate Severity Levels**: Assign correct severity levels to different event types
3. **Privacy Protection**: Ensure sensitive data is never logged (passwords, tokens, etc.)
4. **Regular Auditing**: Review security events periodically to identify patterns
5. **Retention Policy**: Implement a data retention policy for security events

### Responding to Security Events

1. **Triage Process**: Establish a process for triaging security alerts
2. **Response Plan**: Develop a response plan for different types of security incidents
3. **Escalation Path**: Define clear escalation paths for critical security events
4. **Documentation**: Document all security incidents and responses
5. **Post-Mortem**: Conduct post-mortem analysis of security incidents

## API Reference

The security monitoring system provides a programmatic API for custom integrations:

### Logging Security Events

```python
from app.core.security_monitoring import log_security_event

# Log a security event
log_security_event(
    event_type="custom_event",
    request=request,             # FastAPI request object
    user_id=user.id,            # Optional user ID
    details={"custom": "data"}, # Event-specific details
    severity=2                  # 1=INFO, 2=WARNING, 3=CRITICAL
)
```

### Retrieving Security Events

```python
from app.core.security_monitoring import get_user_security_events, get_ip_security_events

# Get events for a specific user
user_events = get_user_security_events(user_id=1234, limit=20)

# Get events for a specific IP address
ip_events = get_ip_security_events(ip_address="192.168.1.1", limit=20)
```

### Detecting Suspicious Activity

```python
from app.core.security_monitoring import detect_suspicious_activity

# Check for suspicious activity
suspicious = detect_suspicious_activity(
    request=request,
    user_id=user.id  # Optional
)

# Handle suspicious activity
if suspicious["is_suspicious"]:
    # Take appropriate action
    log_security_event(
        event_type="suspicious_activity",
        request=request,
        user_id=user.id,
        details=suspicious,
        severity=3  # CRITICAL
    )
```

## Integration with Other Systems

The security monitoring system can integrate with external systems:

1. **SIEM Integration**: Send events to Security Information and Event Management systems
2. **Log Aggregation**: Forward logs to centralized logging platforms (e.g., ELK stack)
3. **Alerting Services**: Integrate with PagerDuty, OpsGenie, or other alerting services
4. **Analytics Platforms**: Export data to analytics platforms for advanced analysis

## Troubleshooting

If security events are not being logged or alerts aren't triggering:

1. Check that Redis is running and properly configured
2. Verify that the log directory exists and is writable
3. Ensure that the security middleware is properly registered in `main.py`
4. Check that the security monitoring imports are correct in all endpoints
5. Verify environment variables are properly configured

## Future Enhancements

Planned enhancements for the security monitoring system:

1. Machine learning-based anomaly detection
2. Advanced geolocation-based security rules
3. Integration with threat intelligence feeds
4. Enhanced visualization and reporting dashboard
5. Automated incident response workflows
