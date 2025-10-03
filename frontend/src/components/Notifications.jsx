import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import websocketService from '../services/websocket.service';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Listen for notification events
    const unsubscribeNotification = websocketService.on('notification', (data) => {
      // Add to notifications array
      setNotifications(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
      
      // Also show toast for new notifications
      toast.info(data.message, {
        position: "top-right",
        autoClose: 5000
      });
    });
    
    return () => {
      unsubscribeNotification();
    };
  }, []);
  
  if (notifications.length === 0) {
    return (
      <div className="notifications-empty">
        <p>No new notifications</p>
      </div>
    );
  }
  
  return (
    <div className="notifications-container">
      <h3>Recent Notifications</h3>
      <ul className="notifications-list">
        {notifications.map((notification, index) => (
          <li key={index} className="notification-item">
            <div className="notification-content">
              <p>{notification.message}</p>
              <span className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {notification.link && (
              <a href={notification.link} className="notification-action">
                View
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;