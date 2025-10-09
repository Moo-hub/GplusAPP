import React from 'react';
import axios from 'axios';
import { authHeader, API_URL } from './apiClient';
import { logError } from '../logError';

/**
 * Service for managing notifications in the frontend
 */
class NotificationService {
  /**
   * Get all notifications for the current user
   * @param {Object} options - Query options
   * @param {number} options.skip - Number of notifications to skip
   * @param {number} options.limit - Maximum number of notifications to return
   * @param {boolean} options.unreadOnly - Whether to return only unread notifications
   * @returns {Promise<Object>} Object containing notifications list and unread count
   */
  async getNotifications({ skip = 0, limit = 50, unreadOnly = false } = {}) {
    try {
      const response = await axios.get(
        `${API_URL}/notifications?skip=${skip}&limit=${limit}&unread_only=${unreadOnly}`, 
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      logError('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>} Number of unread notifications
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(
        `${API_URL}/notifications/unread-count`, 
        { headers: authHeader() }
      );
      return response.data.count;
    } catch (error) {
      logError('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification to mark as read
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(
        `${API_URL}/notifications/${notificationId}`,
        { read: true },
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      logError('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Result with success status and count
   */
  async markAllAsRead() {
    try {
      const response = await axios.post(
        `${API_URL}/notifications/mark-all-read`,
        {},
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      logError('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await axios.put(
        `${API_URL}/notifications/preferences`,
        preferences,
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      logError('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Current notification preferences
   */
  async getPreferences() {
    try {
      const response = await axios.get(
        `${API_URL}/notifications/preferences`,
        { headers: authHeader() }
      );
      return response.data;
    } catch (error) {
      logError('Error fetching notification preferences:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;