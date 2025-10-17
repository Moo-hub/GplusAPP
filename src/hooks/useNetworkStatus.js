/**
 * @file useNetworkStatus.js - هوك مخصص لكشف حالة اتصال الإنترنت مع دعم متعدد اللغات
 * @module hooks/useNetworkStatus
 */

import { useState, useEffect } from 'react';
import useTranslationNamespaces from './useTranslationNamespaces';

/**
 * هوك مخصص لكشف حالة اتصال الإنترنت وتوفير رسائل مترجمة
 *
 * @param {Object} [options] - خيارات إضافية
 * @param {boolean} [options.showNotification=false] - ما إذا كان سيتم عرض إشعار عند تغيير الحالة
 * @returns {Object} معلومات حالة الاتصال
 */
const useNetworkStatus = (options = {}) => {
  const { showNotification = false } = options;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(null);
  const [lastOnlineTime, setLastOnlineTime] = useState(
    isOnline ? new Date() : null
  );
  
  // استخدام هوك الترجمة لتحميل ملفات الترجمة اللازمة
  const { t } = useTranslationNamespaces(['common', 'network']);
  
  // تحديث نوع الاتصال عبر NetworkInformation API (إذا كان مدعوماً)
  const updateConnectionType = () => {
    if ('connection' in navigator) {
      setConnectionType(navigator.connection.effectiveType);
    }
  };
  
  useEffect(() => {
    // تحديث حالة الاتصال الأولية
    setIsOnline(navigator.onLine);
    
    if (navigator.onLine) {
      setLastOnlineTime(new Date());
    }
    
    // تحديث نوع الاتصال الأولي
    updateConnectionType();
    
    // معالجة أحداث الاتصال وانقطاع الاتصال
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
      
      if (showNotification) {
        // عرض إشعار استعادة الاتصال
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(t('network:status.onlineTitle'), {
            body: t('network:status.onlineMessage'),
            icon: '/icons/online.png'
          });
        }
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      if (showNotification) {
        // عرض إشعار فقدان الاتصال
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(t('network:status.offlineTitle'), {
            body: t('network:status.offlineMessage'),
            icon: '/icons/offline.png'
          });
        }
      }
    };
    
    // معالجة تغييرات نوع الاتصال (إذا كان NetworkInformation API مدعوماً)
    const handleConnectionChange = () => {
      updateConnectionType();
    };
    
    // تسجيل أحداث الاستماع
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }
    
    // إلغاء تسجيل أحداث الاستماع عند التنظيف
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [showNotification, t]);
  
  /**
   * الحصول على رسالة حالة الشبكة المترجمة
   *
   * @returns {string} رسالة حالة الشبكة المترجمة
   */
  const getStatusMessage = () => {
    if (!isOnline) {
      return t('network:status.offline');
    }
    
    if (connectionType) {
      switch (connectionType) {
        case 'slow-2g':
        case '2g':
          return t('network:connection.slow');
        case '3g':
          return t('network:connection.moderate');
        case '4g':
          return t('network:connection.good');
        default:
          return t('network:connection.unknown');
      }
    }
    
    return t('network:status.online');
  };
  
  /**
   * الحصول على وقت منذ آخر اتصال بتنسيق مقروء
   *
   * @returns {string} الوقت منذ آخر اتصال بتنسيق مقروء
   */
  const getTimeSinceLastOnline = () => {
    if (isOnline || !lastOnlineTime) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now - lastOnlineTime;
    
    // تحويل الفرق إلى دقائق
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return t('network:timeOffline.lessThanMinute');
    } else if (diffMinutes < 60) {
      return t('network:timeOffline.minutes', { count: diffMinutes });
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return t('network:timeOffline.hours', { count: hours });
    }
  };
  
  return {
    isOnline,
    connectionType,
    lastOnlineTime,
    statusMessage: getStatusMessage(),
    timeSinceLastOnline: getTimeSinceLastOnline()
  };
};

export default useNetworkStatus;