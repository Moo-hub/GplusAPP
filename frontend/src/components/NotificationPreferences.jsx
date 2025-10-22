import React from 'react';
import { useState, useEffect } from 'react';
import useSafeTranslation from '../hooks/useSafeTranslation';
import { toast } from 'react-toastify';
import notificationService from '../services/notification.service';
import './NotificationPreferences.css';

const NotificationPreferences = () => {
  const { t } = useSafeTranslation();
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    push: true,
    pickup_reminders: true,
    status_updates: true,
    point_changes: true,
    promotional: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Fetch current preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const data = await notificationService.getPreferences();
        setPreferences(data);
      } catch (error) {
        toast.error(t('notifications.preferences.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [t]);
  
  // Handle input changes
  const handleChange = (event) => {
    const { name, checked } = event.target;
    setPreferences(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Save preferences
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      setSaving(true);
      await notificationService.updatePreferences(preferences);
      toast.success(t('notifications.preferences.saved'));
    } catch (error) {
      toast.error(t('notifications.preferences.error.saving'));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="preferences-loading">
        <p>{t('notifications.preferences.loading')}</p>
      </div>
    );
  }
  
  return (
    <div className="notification-preferences">
      <h2>{t('notifications.preferences.title')}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="preferences-section">
          <h3>{t('notifications.preferences.channels')}</h3>
          <p className="section-description">{t('notifications.preferences.channelsDescription')}</p>
          
          <div className="preferences-options">
            <label className="preference-option">
              <input
                type="checkbox"
                name="email"
                checked={preferences.email}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.email')}</span>
                <span className="option-description">{t('notifications.preferences.emailDescription')}</span>
              </div>
            </label>
            
            <label className="preference-option">
              <input
                type="checkbox"
                name="sms"
                checked={preferences.sms}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.sms')}</span>
                <span className="option-description">{t('notifications.preferences.smsDescription')}</span>
              </div>
            </label>
            
            <label className="preference-option">
              <input
                type="checkbox"
                name="push"
                checked={preferences.push}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.push')}</span>
                <span className="option-description">{t('notifications.preferences.pushDescription')}</span>
              </div>
            </label>
          </div>
        </div>
        
        <div className="preferences-section">
          <h3>{t('notifications.preferences.types')}</h3>
          <p className="section-description">{t('notifications.preferences.typesDescription')}</p>
          
          <div className="preferences-options">
            <label className="preference-option">
              <input
                type="checkbox"
                name="pickup_reminders"
                checked={preferences.pickup_reminders}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.pickupReminders')}</span>
                <span className="option-description">{t('notifications.preferences.pickupRemindersDescription')}</span>
              </div>
            </label>
            
            <label className="preference-option">
              <input
                type="checkbox"
                name="status_updates"
                checked={preferences.status_updates}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.statusUpdates')}</span>
                <span className="option-description">{t('notifications.preferences.statusUpdatesDescription')}</span>
              </div>
            </label>
            
            <label className="preference-option">
              <input
                type="checkbox"
                name="point_changes"
                checked={preferences.point_changes}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.pointChanges')}</span>
                <span className="option-description">{t('notifications.preferences.pointChangesDescription')}</span>
              </div>
            </label>
            
            <label className="preference-option">
              <input
                type="checkbox"
                name="promotional"
                checked={preferences.promotional}
                onChange={handleChange}
              />
              <div className="option-content">
                <span className="option-label">{t('notifications.preferences.promotional')}</span>
                <span className="option-description">{t('notifications.preferences.promotionalDescription')}</span>
              </div>
            </label>
          </div>
        </div>
        
        <div className="preferences-actions">
          <button 
            type="submit" 
            className="save-button"
            disabled={saving}
          >
            {saving 
              ? t('notifications.preferences.saving') 
              : t('notifications.preferences.save')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;