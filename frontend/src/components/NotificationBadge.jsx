import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BsBell, BsBellFill } from 'react-icons/bs';
import notificationService from '../services/notification.service';
import websocketService from '../services/websocket.service';
import './NotificationBadge.css';

const NotificationBadge = () => {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Silent fail
    }
  };
  
  // Fetch recent notifications
  const fetchRecentNotifications = async () => {
    if (showDropdown) {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications({
          limit: 5,
          unreadOnly: true
        });
        setRecentNotifications(response.items);
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };
  
  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      
      // Update local state
      setRecentNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Silent fail
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    
    // Connect to websocket if needed
    if (websocketService.ws === null || 
        websocketService.ws.readyState === WebSocket.CLOSED ||
        websocketService.ws.readyState === WebSocket.CLOSING) {
      websocketService.connect();
    }
    
    // Listen for real-time notifications
    const unsubscribe = websocketService.on('notification', () => {
      fetchUnreadCount();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    fetchRecentNotifications();
  }, [showDropdown]);
  
  return (
    <div className="notification-badge-container">
      <button
        className="notification-badge-button"
        onClick={toggleDropdown}
        aria-label={t('notifications.notifications')}
        aria-expanded={showDropdown}
      >
        {unreadCount > 0 ? <BsBellFill /> : <BsBell />}
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>{t('notifications.recentNotifications')}</h3>
            <Link 
              to="/notifications" 
              className="view-all-link"
              onClick={() => setShowDropdown(false)}
            >
              {t('notifications.viewAll')}
            </Link>
          </div>
          
          {loading ? (
            <div className="notification-dropdown-loading">
              <p>{t('notifications.loading')}</p>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="notification-dropdown-empty">
              <p>{t('notifications.noNew')}</p>
            </div>
          ) : (
            <ul className="notification-dropdown-list">
              {recentNotifications.map(notification => (
                <li 
                  key={notification.id}
                  className={`notification-dropdown-item ${!notification.read ? 'unread' : ''}`}
                >
                  <Link 
                    to={notification.action_url || '/notifications'} 
                    className="notification-link"
                    onClick={() => {
                      markAsRead(notification.id);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="notification-content">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-excerpt">
                        {notification.message.length > 80 
                          ? `${notification.message.substring(0, 80)}...` 
                          : notification.message}
                      </p>
                      <span className="notification-time">
                        {new Date(notification.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          <div className="notification-dropdown-footer">
            <Link 
              to="/notifications/preferences" 
              className="preferences-link"
              onClick={() => setShowDropdown(false)}
            >
              {t('notifications.preferences.manage')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;