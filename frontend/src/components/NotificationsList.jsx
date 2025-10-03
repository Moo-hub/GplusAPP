import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaBell, FaCheck, FaTrash, FaCheckDouble } from 'react-icons/fa';
import notificationService from '../services/notification.service';
import websocketService from '../services/websocket.service';
import './NotificationsList.css';

const NotificationsList = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const ITEMS_PER_PAGE = 10;
  
  // Fetch notifications
  const fetchNotifications = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = refresh ? 0 : page;
      
      const response = await notificationService.getNotifications({
        skip: currentPage * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        unreadOnly: showUnreadOnly
      });
      
      const { items, unread_count } = response;
      
      if (refresh) {
        setNotifications(items);
      } else {
        setNotifications(prev => [...prev, ...items]);
      }
      
      setUnreadCount(unread_count);
      setHasMore(items.length === ITEMS_PER_PAGE);
      
      if (refresh) {
        setPage(0);
      }
    } catch (err) {
      setError(t('notifications.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [page, showUnreadOnly, t]);
  
  // Load more notifications
  const loadMore = () => {
    setPage(prev => prev + 1);
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, read_at: new Date().toISOString() } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(t('notifications.error.markRead'));
    }
  };
  
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success(t('notifications.allMarkedRead'));
      }
    } catch (err) {
      toast.error(t('notifications.error.markAllRead'));
    }
  };
  
  // Format notification date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pickup_reminder':
        return '🚚';
      case 'pickup_status':
        return '📦';
      case 'points_earned':
        return '🎯';
      case 'points_redeemed':
        return '🎁';
      case 'system':
        return '⚙️';
      case 'promotional':
        return '📣';
      default:
        return '🔔';
    }
  };
  
  // Initialize
  useEffect(() => {
    fetchNotifications(true);
    
    // Connect websocket if not already connected
    if (websocketService.ws === null || 
        websocketService.ws.readyState === WebSocket.CLOSED ||
        websocketService.ws.readyState === WebSocket.CLOSING) {
      websocketService.connect();
    }
    
    // Listen for real-time notifications
    const unsubscribe = websocketService.on('notification', (data) => {
      // Add to notifications array
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for new notifications
      toast.info(data.message, {
        position: "top-right",
        autoClose: 5000
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, [fetchNotifications]);
  
  // Refetch when page or filter changes
  useEffect(() => {
    if (page > 0) {
      fetchNotifications(false);
    }
  }, [page, fetchNotifications]);
  
  // Filter change handler
  const handleFilterChange = () => {
    setShowUnreadOnly(!showUnreadOnly);
    fetchNotifications(true);
  };
  
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-title">
          <FaBell className="notifications-icon" />
          <h2>{t('notifications.title')}</h2>
          {unreadCount > 0 && (
            <span className="notifications-badge">{unreadCount}</span>
          )}
        </div>
        
        <div className="notifications-actions">
          <label className="unread-filter">
            <input 
              type="checkbox"
              checked={showUnreadOnly}
              onChange={handleFilterChange}
            />
            <span>{t('notifications.showUnreadOnly')}</span>
          </label>
          
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={markAllAsRead}
              aria-label={t('notifications.markAllRead')}
            >
              <FaCheckDouble /> {t('notifications.markAllRead')}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="notifications-error">
          <p>{error}</p>
          <button onClick={() => fetchNotifications(true)}>{t('notifications.retry')}</button>
        </div>
      )}
      
      {!error && notifications.length === 0 && !loading && (
        <div className="notifications-empty">
          <p>{t('notifications.empty')}</p>
        </div>
      )}
      
      <ul className="notifications-list">
        {notifications.map((notification) => (
          <li 
            key={notification.id} 
            className={`notification-item ${!notification.read ? 'unread' : ''}`}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <h3 className="notification-title">{notification.title}</h3>
              <p className="notification-message">{notification.message}</p>
              <div className="notification-meta">
                <span className="notification-time">
                  {formatDate(notification.created_at)}
                </span>
                {notification.priority === 'high' && (
                  <span className="notification-priority high">
                    {t('notifications.priority.high')}
                  </span>
                )}
              </div>
            </div>
            <div className="notification-actions">
              {!notification.read && (
                <button 
                  className="notification-action read"
                  onClick={() => markAsRead(notification.id)}
                  aria-label={t('notifications.markRead')}
                >
                  <FaCheck />
                </button>
              )}
              {notification.action_url && (
                <a 
                  href={notification.action_url} 
                  className="notification-link"
                  aria-label={t('notifications.view')}
                >
                  {t('notifications.view')}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      {loading && (
        <div className="notifications-loading">
          <p>{t('notifications.loading')}</p>
        </div>
      )}
      
      {!loading && hasMore && (
        <button 
          className="notifications-load-more"
          onClick={loadMore}
        >
          {t('notifications.loadMore')}
        </button>
      )}
    </div>
  );
};

export default NotificationsList;