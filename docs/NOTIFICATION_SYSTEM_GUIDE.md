# Notification System Guide

The G+ App includes a comprehensive notification system to keep users informed about important events such as pickup reminders, status updates, and points earned. This guide explains how to use and extend the notification functionality.

## Notification Types

The system supports multiple notification types:

- **Pickup Reminders**: Sent 24 hours before scheduled pickups
- **Pickup Status Updates**: Sent when pickup status changes (scheduled, confirmed, in progress, completed, cancelled)
- **Points Earned**: Sent when users earn points through various activities
- **Points Redeemed**: Sent when users redeem points for rewards
- **System Notifications**: Administrative and system-wide announcements
- **Promotional Notifications**: Special offers and promotional content

## Notification Channels

Notifications can be delivered through multiple channels:

1. **In-app Notifications**: Always enabled, shown in the notification center
2. **Email Notifications**: Optional, can be enabled/disabled by users
3. **SMS Notifications**: Optional, requires user phone number and opt-in
4. **Push Notifications**: (Planned for future) For mobile app users

## User Preferences

Users can manage their notification preferences through:

- Web interface: `/notifications/preferences`
- API: `PUT /api/v1/notifications/preferences`

Preferences include:
- Channel selection (email, SMS, push)
- Notification type preferences (which types to receive)

## Implementation Details

### Backend Components

1. **Models**: 
   - `Notification`: Database model for storing notifications
   - `NotificationType`: Enum of notification types
   - `NotificationPriority`: Priority levels (low, normal, high)

2. **Services**:
   - `NotificationService`: Central service for creating and sending notifications
   - Methods for different notification types (pickup reminders, status updates, etc.)
   - Channel handling based on user preferences

3. **Background Tasks**:
   - `send_pickup_reminders()`: Scheduled task to send reminders for upcoming pickups
   - `cleanup_old_notifications()`: Maintenance task to remove old notifications

4. **API Endpoints**:
   - `GET /api/v1/notifications/`: List user notifications
   - `GET /api/v1/notifications/{notification_id}`: Get specific notification
   - `PATCH /api/v1/notifications/{notification_id}`: Update notification (mark as read)
   - `DELETE /api/v1/notifications/{notification_id}`: Delete notification
   - `POST /api/v1/notifications/mark-all-read`: Mark all notifications as read
   - `GET /api/v1/notifications/unread-count`: Get unread notification count
   - `GET /api/v1/notifications/preferences`: Get user notification preferences
   - `PUT /api/v1/notifications/preferences`: Update notification preferences

### Frontend Components

1. **Services**:
   - `notification.service.js`: Service for interacting with notification API endpoints

2. **Components**:
   - `NotificationsList`: Main component for displaying all notifications
   - `NotificationPreferences`: Component for managing notification settings
   - `NotificationBadge`: Header badge showing unread notification count

3. **WebSocket**:
   - Real-time notification delivery
   - Connected via `websocket.service.js`
   - Automatic badge updates and toast notifications

## Extending the Notification System

### Adding a New Notification Type

1. Add the new type to `NotificationType` enum in `models/notification.py`:
   ```python
   class NotificationType(str, Enum):
       # Existing types...
       NEW_TYPE = "new_type"
   ```

2. Add a new method to `NotificationService` in `services/notification_service.py`:
   ```python
   @staticmethod
   def send_new_type_notification(
       db: Session,
       background_tasks: BackgroundTasks,
       user: User,
       # other parameters...
   ) -> Dict[str, Any]:
       # Implementation...
   ```

3. Use the new method in relevant places in your codebase.

### Creating Custom Email Templates

Email templates are currently defined inline in the `NotificationService`. To use custom HTML templates:

1. Create HTML templates in a dedicated directory (e.g., `templates/emails/`)
2. Use template rendering system (Jinja2) to render templates with context
3. Update `NotificationService` methods to use these templates

Example:
```python
from jinja2 import Environment, FileSystemLoader

templates_env = Environment(loader=FileSystemLoader("templates/emails"))

@staticmethod
def send_pickup_reminder(...):
    # ...
    template = templates_env.get_template("pickup_reminder.html")
    html_content = template.render(
        user_name=user.name,
        scheduled_time=scheduled_time,
        address=address
    )
    # ...
```

## Best Practices

1. **Timing**: Schedule pickup reminders at appropriate times (24h before)
2. **Content**: Keep notification messages clear and concise
3. **Priority**: Use priority levels appropriately
   - High: Important time-sensitive updates (cancellations)
   - Normal: Standard notifications (reminders, status updates)
   - Low: Informational content (tips, promotions)
4. **Testing**: Test notifications across all channels before deployment
5. **Monitoring**: Monitor delivery success rates and user engagement
6. **Cleanup**: Implement policies to clean up old notifications

## Future Enhancements

- Push notifications for mobile devices
- Notification categories and filtering
- Enhanced templating system
- Notification analytics and engagement metrics
- Bulk notification management tools for administrators