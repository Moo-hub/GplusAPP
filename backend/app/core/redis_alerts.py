"""
Notification provider for Redis monitoring alerts.
This module provides interfaces for sending alerts through various channels
like email, Slack, and system logs.
"""

import logging
import smtplib
import json
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

from app.core.config import settings

# Configure logging
logger = logging.getLogger("redis_alerts")
logger.setLevel(logging.INFO)

# Add a handler to write to Redis alerts log file
file_handler = logging.FileHandler(filename="logs/redis_alerts.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Alert severity levels
class AlertSeverity:
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

# Alert types
class AlertType:
    MEMORY = "memory"
    PERFORMANCE = "performance"
    CONNECTION = "connection"
    KEYS = "keys"
    GENERAL = "general"

# Alert channels
class AlertChannel:
    EMAIL = "email"
    SLACK = "slack"
    LOG = "log"
    WEBHOOK = "webhook"
    
async def send_alert(
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    details: Dict[str, Any] = None,
    channels: List[str] = None
) -> Dict[str, Any]:
    """
    Send an alert through specified channels
    
    Args:
        alert_type: Type of alert (AlertType enum)
        severity: Alert severity (AlertSeverity enum)
        title: Alert title
        message: Alert message
        details: Additional alert details
        channels: List of channels to send the alert to (defaults to LOG)
    
    Returns:
        Dict with delivery status for each channel
    """
    channels = channels or [AlertChannel.LOG]
    details = details or {}
    results = {}
    
    # Always log the alert
    logger.log(
        logging.CRITICAL if severity == AlertSeverity.CRITICAL else
        logging.WARNING if severity == AlertSeverity.WARNING else
        logging.INFO,
        f"[{severity.upper()}] {title}: {message}"
    )
    results[AlertChannel.LOG] = True
    
    # For test environment, only log alerts
    if settings.ENVIRONMENT == "test":
        return {"status": "success", "channels": results}
    
# Default alert configuration
DEFAULT_ALERT_CONFIG = {
    "enabled": True,
    "channels": {
        AlertChannel.EMAIL: {
            "enabled": False,
            "recipients": [],
            "from_address": settings.SMTP_SENDER if hasattr(settings, 'SMTP_SENDER') else "",
            "smtp_server": settings.SMTP_SERVER if hasattr(settings, 'SMTP_SERVER') else "",
            "smtp_port": settings.SMTP_PORT if hasattr(settings, 'SMTP_PORT') else 587,
            "username": settings.SMTP_USERNAME if hasattr(settings, 'SMTP_USERNAME') else "",
            "password": settings.SMTP_PASSWORD if hasattr(settings, 'SMTP_PASSWORD') else "",
            "use_tls": True
        },
        AlertChannel.SLACK: {
            "enabled": False,
            "webhook_url": settings.SLACK_WEBHOOK_URL if hasattr(settings, 'SLACK_WEBHOOK_URL') else "",
            "channel": settings.SLACK_CHANNEL if hasattr(settings, 'SLACK_CHANNEL') else "#alerts"
        },
        AlertChannel.LOG: {
            "enabled": True,  # Logging is always enabled
            "min_level": AlertSeverity.WARNING  # Min level to log
        },
        AlertChannel.WEBHOOK: {
            "enabled": False,
            "url": settings.ALERT_WEBHOOK_URL if hasattr(settings, 'ALERT_WEBHOOK_URL') else "",
            "headers": {}
        }
    },
    "thresholds": {
        "memory_warning_percent": 75.0,
        "memory_critical_percent": 90.0,
        "connection_warning_percent": 75.0,
        "connection_critical_percent": 90.0,
        "slow_operation_threshold_ms": 50.0,
        "hit_rate_threshold_percent": 50.0
    },
    "cooldown": {
        # Cooldown periods in minutes to prevent alert flooding
        AlertType.MEMORY: 30,
        AlertType.PERFORMANCE: 15,
        AlertType.CONNECTION: 10,
        AlertType.KEYS: 60,
        AlertType.GENERAL: 30
    },
    "last_alerts": {}  # Track last alert time for each type
}


def format_alert_message(
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Format an alert message for consistent delivery across channels
    
    Args:
        alert_type: The type of alert (from AlertType)
        severity: Alert severity (from AlertSeverity)
        title: Short alert title
        message: Detailed alert message
        details: Additional structured data for the alert
        
    Returns:
        Formatted alert message dictionary
    """
    timestamp = datetime.now().isoformat()
    
    return {
        "type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
        "details": details or {},
        "timestamp": timestamp,
        "service": "redis-cache"
    }


def send_email_alert(alert: Dict[str, Any]) -> bool:
    """
    Send an alert via email
    
    Args:
        alert: Formatted alert dictionary
        
    Returns:
        True if email was sent successfully
    """
    try:
        config = DEFAULT_ALERT_CONFIG["channels"][AlertChannel.EMAIL]
        if not config["enabled"] or not config["recipients"]:
            logger.debug("Email alerts are disabled or no recipients configured")
            return False
            
        # Create message
        msg = MIMEMultipart()
        msg['From'] = config["from_address"]
        msg['To'] = ", ".join(config["recipients"])
        msg['Subject'] = f"[{alert['severity'].upper()}] Redis Alert: {alert['title']}"
        
        # Format email body
        body = f"""
        <html>
        <body>
            <h2>Redis Alert: {alert['title']}</h2>
            <p><strong>Severity:</strong> {alert['severity'].upper()}</p>
            <p><strong>Type:</strong> {alert['type']}</p>
            <p><strong>Time:</strong> {alert['timestamp']}</p>
            <p><strong>Message:</strong> {alert['message']}</p>
            
            <h3>Details:</h3>
            <pre>{json.dumps(alert['details'], indent=2)}</pre>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Connect to SMTP server and send
        server = smtplib.SMTP(config["smtp_server"], config["smtp_port"])
        if config["use_tls"]:
            server.starttls()
        
        if config["username"] and config["password"]:
            server.login(config["username"], config["password"])
            
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email alert sent: {alert['title']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")
        return False


def send_slack_alert(alert: Dict[str, Any]) -> bool:
    """
    Send an alert to Slack
    
    Args:
        alert: Formatted alert dictionary
        
    Returns:
        True if alert was sent successfully
    """
    try:
        config = DEFAULT_ALERT_CONFIG["channels"][AlertChannel.SLACK]
        if not config["enabled"] or not config["webhook_url"]:
            logger.debug("Slack alerts are disabled or webhook URL not configured")
            return False
        
        # Determine color based on severity
        if alert["severity"] == AlertSeverity.CRITICAL:
            color = "#FF0000"  # Red
        elif alert["severity"] == AlertSeverity.WARNING:
            color = "#FFA500"  # Orange
        else:
            color = "#36A64F"  # Green
            
        # Format Slack message
        slack_message = {
            "channel": config["channel"],
            "attachments": [
                {
                    "color": color,
                    "title": f"Redis Alert: {alert['title']}",
                    "text": alert['message'],
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert["severity"].upper(),
                            "short": True
                        },
                        {
                            "title": "Type",
                            "value": alert["type"],
                            "short": True
                        }
                    ],
                    "footer": f"Redis Cache • {alert['timestamp']}"
                }
            ]
        }
        
        # Add details as fields if available
        for key, value in alert["details"].items():
            if isinstance(value, (int, float, str, bool)):
                slack_message["attachments"][0]["fields"].append({
                    "title": key,
                    "value": str(value),
                    "short": True
                })
        
        # Send to Slack
        response = requests.post(
            config["webhook_url"],
            data=json.dumps(slack_message),
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            logger.warning(f"Failed to send Slack alert: {response.text}")
            return False
            
        logger.info(f"Slack alert sent: {alert['title']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Slack alert: {e}")
        return False


def send_webhook_alert(alert: Dict[str, Any]) -> bool:
    """
    Send an alert to a generic webhook
    
    Args:
        alert: Formatted alert dictionary
        
    Returns:
        True if webhook was called successfully
    """
    try:
        config = DEFAULT_ALERT_CONFIG["channels"][AlertChannel.WEBHOOK]
        if not config["enabled"] or not config["url"]:
            logger.debug("Webhook alerts are disabled or URL not configured")
            return False
        
        # Send to webhook
        response = requests.post(
            config["url"],
            json=alert,
            headers=config["headers"] or {"Content-Type": "application/json"}
        )
        
        if response.status_code not in [200, 201, 202, 204]:
            logger.warning(f"Failed to send webhook alert: {response.text}")
            return False
            
        logger.info(f"Webhook alert sent: {alert['title']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send webhook alert: {e}")
        return False


def log_alert(alert: Dict[str, Any]) -> bool:
    """
    Log an alert to the application logs
    
    Args:
        alert: Formatted alert dictionary
        
    Returns:
        True if alert was logged
    """
    try:
        config = DEFAULT_ALERT_CONFIG["channels"][AlertChannel.LOG]
        
        # Convert severity to logging level
        if alert["severity"] == AlertSeverity.CRITICAL:
            logger.critical(f"REDIS ALERT [{alert['type']}]: {alert['title']} - {alert['message']}")
        elif alert["severity"] == AlertSeverity.WARNING:
            logger.warning(f"REDIS ALERT [{alert['type']}]: {alert['title']} - {alert['message']}")
        else:
            logger.info(f"REDIS ALERT [{alert['type']}]: {alert['title']} - {alert['message']}")
            
        return True
    except Exception as e:
        # Fall back to print if logging fails
        print(f"Failed to log alert: {e}")
        return False


def can_send_alert(alert_type: str, alert_subtype: str = "") -> bool:
    """
    Check if an alert can be sent based on cooldown periods
    
    Args:
        alert_type: The type of alert (from AlertType)
        alert_subtype: Optional subtype for more granular control
        
    Returns:
        True if alert can be sent
    """
    now = datetime.now()
    
    # Create a unique key for this alert type + subtype
    key = f"{alert_type}:{alert_subtype}" if alert_subtype else alert_type
    
    # Get the last time this alert was sent
    last_sent = DEFAULT_ALERT_CONFIG["last_alerts"].get(key)
    
    if last_sent is None:
        # First time this alert is being sent
        DEFAULT_ALERT_CONFIG["last_alerts"][key] = now
        return True
        
    # Get cooldown period in minutes
    cooldown_minutes = DEFAULT_ALERT_CONFIG["cooldown"].get(alert_type, 30)
    
    # Check if enough time has passed
    if (now - last_sent).total_seconds() >= cooldown_minutes * 60:
        # Update last sent time
        DEFAULT_ALERT_CONFIG["last_alerts"][key] = now
        return True
    
    return False


def send_alert(
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    alert_subtype: str = "",
    channels: Optional[List[str]] = None
) -> bool:
    """
    Send an alert through configured channels
    
    Args:
        alert_type: The type of alert (from AlertType)
        severity: Alert severity (from AlertSeverity)
        title: Short alert title
        message: Detailed alert message
        details: Additional structured data for the alert
        alert_subtype: Optional subtype for more granular cooldown control
        channels: Optional list of specific channels to use
        
    Returns:
        True if alert was sent through at least one channel
    """
    # Check if alerts are enabled
    if not DEFAULT_ALERT_CONFIG["enabled"]:
        logger.debug(f"Alerts are disabled, not sending {severity} alert: {title}")
        return False
        
    # Check cooldown period
    if not can_send_alert(alert_type, alert_subtype):
        logger.debug(f"Alert on cooldown, not sending {severity} alert: {title}")
        return False
    
    # Format the alert
    alert = format_alert_message(alert_type, severity, title, message, details)
    
    # Determine which channels to use
    if not channels:
        channels = [
            channel for channel, config in DEFAULT_ALERT_CONFIG["channels"].items()
            if config.get("enabled", False)
        ]
    
    # Always include logging unless explicitly excluded
    if AlertChannel.LOG not in channels:
        channels.append(AlertChannel.LOG)
    
    # Send through each channel
    success = False
    for channel in channels:
        if channel == AlertChannel.EMAIL:
            if send_email_alert(alert):
                success = True
        elif channel == AlertChannel.SLACK:
            if send_slack_alert(alert):
                success = True
        elif channel == AlertChannel.WEBHOOK:
            if send_webhook_alert(alert):
                success = True
        elif channel == AlertChannel.LOG:
            if log_alert(alert):
                success = True
    
    return success