"""
Notification service for centralized notification management

This module provides a unified service for sending notifications through multiple channels:
- In-app notifications
- Email notifications
- SMS notifications (if configured)
- Push notifications (if configured)
"""

from typing import Optional, Dict, Any, List, Union
from fastapi import BackgroundTasks
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.pickup_request import PickupRequest
from app.models.notification import NotificationType, NotificationPriority
from app.schemas.notification import NotificationCreate
from app.crud import notification as notification_crud
from app.utils.email import send_email
from app.core.config import settings

class NotificationService:
    """Service for sending notifications across different channels"""
    
    @staticmethod
    def send_pickup_reminder(
        db: Session,
        background_tasks: BackgroundTasks,
        pickup: PickupRequest,
        hours_before: int = 24
    ) -> Dict[str, Any]:
        """
        Send pickup reminder notification
        
        Args:
            db: Database session
            background_tasks: FastAPI background tasks
            pickup: The pickup request object
            hours_before: Hours before pickup to send reminder
            
        Returns:
            Dictionary with notification status
        """
        user = pickup.user
        
        # Format the scheduled date
        scheduled_time = pickup.scheduled_date.strftime("%A, %B %d at %I:%M %p")
        address = pickup.address
        
        # Create in-app notification
        in_app_notification = NotificationCreate(
            user_id=user.id,
            type=NotificationType.PICKUP_REMINDER,
            title=f"Pickup Reminder: {scheduled_time}",
            message=f"Your recycling pickup is scheduled for {scheduled_time} at {address}.",
            priority=NotificationPriority.NORMAL,
            action_url=f"/pickups/{pickup.id}"
        )
        
        notification = notification_crud.create_notification(db, in_app_notification)
        
        # Send email notification if enabled
        if user.notification_email:
            html_content = f"""
            <html>
                <body>
                    <h1>Recycling Pickup Reminder</h1>
                    <p>Hello {user.name},</p>
                    <p>This is a reminder about your upcoming recycling pickup:</p>
                    <ul>
                        <li><strong>Date/Time:</strong> {scheduled_time}</li>
                        <li><strong>Address:</strong> {address}</li>
                        <li><strong>Materials:</strong> {', '.join(pickup.materials)}</li>
                    </ul>
                    <p>Please ensure your recyclables are properly sorted and ready for collection.</p>
                    <p><a href="{settings.FRONTEND_URL}/pickups/{pickup.id}">View Pickup Details</a></p>
                    <p>Thank you for recycling with G+!</p>
                </body>
            </html>
            """
            
            subject = f"Reminder: Recycling Pickup on {pickup.scheduled_date.strftime('%A, %B %d')}"
            background_tasks.add_task(send_email, user.email, subject, html_content)
        
        # TODO: Implement SMS notification when SMS gateway is configured
        if user.notification_sms and hasattr(user, "phone") and user.phone:
            # This would be implemented with an SMS gateway integration
            pass
        
        return {
            "success": True,
            "notification_id": notification.id,
            "channels": ["in_app"] + (["email"] if user.notification_email else [])
        }
    
    @staticmethod
    def send_pickup_status_update(
        db: Session,
        background_tasks: BackgroundTasks,
        pickup: PickupRequest,
        old_status: str,
        new_status: str
    ) -> Dict[str, Any]:
        """
        Send notification about pickup status change
        
        Args:
            db: Database session
            background_tasks: FastAPI background tasks
            pickup: The pickup request object
            old_status: Previous status
            new_status: New status
            
        Returns:
            Dictionary with notification status
        """
        user = pickup.user
        
        # Format the status message based on new status
        if new_status == "confirmed":
            title = "Pickup Confirmed"
            message = f"Your recycling pickup for {pickup.scheduled_date.strftime('%A, %B %d')} has been confirmed."
            priority = NotificationPriority.NORMAL
        elif new_status == "completed":
            title = "Pickup Completed"
            message = f"Your recycling pickup has been completed. Thank you for recycling with G+!"
            priority = NotificationPriority.NORMAL
        elif new_status == "cancelled":
            title = "Pickup Cancelled"
            message = f"Your recycling pickup for {pickup.scheduled_date.strftime('%A, %B %d')} has been cancelled."
            priority = NotificationPriority.HIGH
        else:
            title = "Pickup Status Update"
            message = f"Your recycling pickup status has changed from {old_status} to {new_status}."
            priority = NotificationPriority.NORMAL
        
        # Create in-app notification
        in_app_notification = NotificationCreate(
            user_id=user.id,
            type=NotificationType.PICKUP_STATUS,
            title=title,
            message=message,
            priority=priority,
            action_url=f"/pickups/{pickup.id}"
        )
        
        notification = notification_crud.create_notification(db, in_app_notification)
        
        # Send email notification if enabled
        if user.notification_email:
            html_content = f"""
            <html>
                <body>
                    <h1>{title}</h1>
                    <p>Hello {user.name},</p>
                    <p>{message}</p>
                    <p><strong>Pickup Details:</strong></p>
                    <ul>
                        <li><strong>Date/Time:</strong> {pickup.scheduled_date.strftime("%A, %B %d at %I:%M %p")}</li>
                        <li><strong>Address:</strong> {pickup.address}</li>
                        <li><strong>Status:</strong> {new_status.upper()}</li>
                    </ul>
                    <p><a href="{settings.FRONTEND_URL}/pickups/{pickup.id}">View Pickup Details</a></p>
                    <p>Thank you for recycling with G+!</p>
                </body>
            </html>
            """
            
            subject = f"Pickup {new_status.capitalize()}: {pickup.scheduled_date.strftime('%A, %B %d')}"
            background_tasks.add_task(send_email, user.email, subject, html_content)
        
        return {
            "success": True,
            "notification_id": notification.id,
            "channels": ["in_app"] + (["email"] if user.notification_email else [])
        }
    
    @staticmethod
    def send_points_earned_notification(
        db: Session,
        background_tasks: BackgroundTasks,
        user: User,
        points: int,
        source: str = "system",
        source_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Send notification about points earned
        
        Args:
            db: Database session
            background_tasks: FastAPI background tasks
            user: User who earned points
            points: Number of points earned
            source: Source of the points (pickup, referral, etc.)
            source_id: Optional ID of the related source (pickup_id, etc.)
            
        Returns:
            Dictionary with notification status
        """
        # Create action URL based on source
        if source == "pickup" and source_id:
            action_url = f"/pickups/{source_id}"
        else:
            action_url = "/points"
        
        # Create message based on source
        source_message = ""
        if source == "pickup":
            source_message = "recycling pickup"
        elif source == "referral":
            source_message = "referring a friend"
        elif source == "bonus":
            source_message = "bonus rewards"
        else:
            source_message = "recycling contribution"
        
        # Create in-app notification
        in_app_notification = NotificationCreate(
            user_id=user.id,
            type=NotificationType.POINTS_EARNED,
            title=f"You Earned {points} Points!",
            message=f"You've earned {points} points for your {source_message}. Your total is now {user.points} points.",
            priority=NotificationPriority.NORMAL,
            action_url=action_url
        )
        
        notification = notification_crud.create_notification(db, in_app_notification)
        
        # Send email notification if enabled
        if user.notification_email:
            html_content = f"""
            <html>
                <body>
                    <h1>You Earned G+ Points!</h1>
                    <p>Hello {user.name},</p>
                    <p>Great news! You've earned <strong>{points} points</strong> for your {source_message}.</p>
                    <p>Your total balance is now <strong>{user.points} points</strong>.</p>
                    <p>These points can be redeemed for rewards in our rewards program.</p>
                    <p><a href="{settings.FRONTEND_URL}/points">View Your Points</a></p>
                    <p>Thank you for recycling with G+!</p>
                </body>
            </html>
            """
            
            subject = f"You Earned {points} G+ Points!"
            background_tasks.add_task(send_email, user.email, subject, html_content)
        
        return {
            "success": True,
            "notification_id": notification.id,
            "channels": ["in_app"] + (["email"] if user.notification_email else [])
        }
    
    @staticmethod
    def send_points_redeemed_notification(
        db: Session,
        background_tasks: BackgroundTasks,
        user: User,
        points_redeemed: int,
        reward_name: str,
        redemption_id: int
    ) -> Dict[str, Any]:
        """
        Send notification about points redeemed
        
        Args:
            db: Database session
            background_tasks: FastAPI background tasks
            user: User who redeemed points
            points_redeemed: Number of points redeemed
            reward_name: Name of the redeemed reward
            redemption_id: ID of the redemption record
            
        Returns:
            Dictionary with notification status
        """
        # Create in-app notification
        in_app_notification = NotificationCreate(
            user_id=user.id,
            type=NotificationType.POINTS_REDEEMED,
            title=f"Points Redeemed for {reward_name}",
            message=f"You've successfully redeemed {points_redeemed} points for {reward_name}. Your remaining balance is {user.points} points.",
            priority=NotificationPriority.NORMAL,
            action_url=f"/redemptions/{redemption_id}"
        )
        
        notification = notification_crud.create_notification(db, in_app_notification)
        
        # Send email notification if enabled
        if user.notification_email:
            html_content = f"""
            <html>
                <body>
                    <h1>Points Redemption Confirmation</h1>
                    <p>Hello {user.name},</p>
                    <p>You've successfully redeemed <strong>{points_redeemed} points</strong> for:</p>
                    <p style="font-size: 18px; font-weight: bold;">{reward_name}</p>
                    <p>Your remaining balance is <strong>{user.points} points</strong>.</p>
                    <p><a href="{settings.FRONTEND_URL}/redemptions/{redemption_id}">View Redemption Details</a></p>
                    <p>Thank you for recycling with G+!</p>
                </body>
            </html>
            """
            
            subject = f"Points Redeemed for {reward_name}"
            background_tasks.add_task(send_email, user.email, subject, html_content)
        
        return {
            "success": True,
            "notification_id": notification.id,
            "channels": ["in_app"] + (["email"] if user.notification_email else [])
        }
    
    @staticmethod
    def send_system_notification(
        db: Session,
        background_tasks: BackgroundTasks,
        user: User,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a system notification
        
        Args:
            db: Database session
            background_tasks: FastAPI background tasks
            user: User to notify
            title: Notification title
            message: Notification message
            priority: Notification priority
            action_url: Optional URL for notification action
            
        Returns:
            Dictionary with notification status
        """
        # Create in-app notification
        in_app_notification = NotificationCreate(
            user_id=user.id,
            type=NotificationType.SYSTEM,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url
        )
        
        notification = notification_crud.create_notification(db, in_app_notification)
        
        # Send email for high priority notifications or if email notifications are enabled
        if priority == NotificationPriority.HIGH or user.notification_email:
            html_content = f"""
            <html>
                <body>
                    <h1>{title}</h1>
                    <p>Hello {user.name},</p>
                    <p>{message}</p>
                    {f'<p><a href="{settings.FRONTEND_URL}{action_url}">View Details</a></p>' if action_url else ''}
                    <p>Thank you for using G+ App!</p>
                </body>
            </html>
            """
            
            subject = title
            background_tasks.add_task(send_email, user.email, subject, html_content)
        
        return {
            "success": True,
            "notification_id": notification.id,
            "channels": ["in_app"] + (["email"] if (priority == NotificationPriority.HIGH or user.notification_email) else [])
        }

# Create a singleton instance
notification_service = NotificationService()