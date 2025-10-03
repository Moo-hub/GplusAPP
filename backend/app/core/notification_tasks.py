"""
Background tasks for notification system
"""
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.pickup_request import PickupRequest
from app.services.notification_service import notification_service
from fastapi import BackgroundTasks

# Configure logging
logger = logging.getLogger("notification_tasks")
logger.setLevel(logging.INFO)

# Add a file handler
file_handler = logging.FileHandler(filename="logs/notification_tasks.log")
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

async def send_pickup_reminders() -> None:
    """
    Scheduled task to send pickup reminders
    
    This function checks for upcoming pickups and sends reminders
    for pickups happening in the next 24 hours
    """
    logger.info("Running scheduled task: send_pickup_reminders")
    
    # Get DB session
    db = SessionLocal()
    try:
        # Time range for reminders: 24-25 hours in the future
        # (to avoid sending duplicate reminders)
        reminder_start = datetime.utcnow() + timedelta(hours=24)
        reminder_end = reminder_start + timedelta(hours=1)
        
        # Find pickups scheduled in the target time range that haven't been reminded yet
        upcoming_pickups = (
            db.query(PickupRequest)
            .filter(
                PickupRequest.scheduled_date.between(reminder_start, reminder_end),
                PickupRequest.status.in_(["scheduled", "confirmed"]),
                PickupRequest.reminder_sent == False
            )
            .all()
        )
        
        # Create background tasks instance for this function context
        background_tasks = BackgroundTasks()
        
        # Send reminders for each pickup
        for pickup in upcoming_pickups:
            try:
                notification_service.send_pickup_reminder(
                    db=db,
                    background_tasks=background_tasks,
                    pickup=pickup
                )
                
                # Mark reminder as sent
                pickup.reminder_sent = True
                db.add(pickup)
                
                logger.info(f"Sent pickup reminder for pickup_id={pickup.id}, user_id={pickup.user_id}")
            except Exception as e:
                logger.error(f"Error sending pickup reminder for pickup_id={pickup.id}: {str(e)}")
        
        # Commit all changes
        db.commit()
        
        # Execute background tasks (sending emails)
        await background_tasks()
        
        logger.info(f"Completed sending reminders for {len(upcoming_pickups)} pickups")
    except Exception as e:
        logger.error(f"Error in send_pickup_reminders: {str(e)}")
        db.rollback()
    finally:
        db.close()

async def cleanup_old_notifications() -> None:
    """
    Scheduled task to clean up old read/dismissed notifications
    
    This function removes notifications older than 30 days that have been 
    read and dismissed to prevent the database from growing too large
    """
    logger.info("Running scheduled task: cleanup_old_notifications")
    
    # Get DB session
    db = SessionLocal()
    try:
        from app.crud.notification import delete_old_notifications
        
        # Delete notifications older than 30 days
        deleted_count = delete_old_notifications(db, days_old=30)
        
        logger.info(f"Deleted {deleted_count} old notifications")
    except Exception as e:
        logger.error(f"Error in cleanup_old_notifications: {str(e)}")
        db.rollback()
    finally:
        db.close()