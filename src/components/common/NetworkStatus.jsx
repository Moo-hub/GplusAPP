/**
 * @file NetworkStatus.jsx - مكون لعرض حالة اتصال الشبكة
 * @module components/common/NetworkStatus
 */

import React from 'react';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { useLanguage } from '../../i18nSetup';
import { useDirectionalStyles } from '../../utils/directionalHelpers';

/**
 * مكون لعرض حالة اتصال الشبكة بتصميم متجاوب ودعم متعدد اللغات
 *
 * @param {Object} props - خصائص المكون
 * @param {string} [props.variant='inline'] - نوع العرض: 'inline', 'banner', أو 'detailed'
 * @param {Object} [props.styles={}] - أنماط CSS إضافية
 * @returns {React.ReactElement} مكون حالة الشبكة
 */
const NetworkStatus = ({ variant = 'inline', styles = {} }) => {
  // استخدام هوك كشف حالة الشبكة
  const { 
    isOnline, 
    connectionType, 
    statusMessage, 
    timeSinceLastOnline 
  } = useNetworkStatus({ showNotification: true });
  
  const { isRTL } = useLanguage();
  const directionalStyles = useDirectionalStyles();
  
  // تحديد اللون بناءً على حالة الاتصال
  const getStatusColor = () => {
    if (!isOnline) {
      return '#f44336'; // أحمر
    }
    
    if (connectionType) {
      switch (connectionType) {
        case 'slow-2g':
        case '2g':
          return '#ff9800'; // برتقالي
        case '3g':
          return '#2196f3'; // أزرق
        case '4g':
          return '#4caf50'; // أخضر
        default:
          return '#4caf50'; // أخضر
      }
    }
    
    return '#4caf50'; // أخضر افتراضي للاتصال
  };
  
  // عرض مضغوط (inline)
  if (variant === 'inline') {
    return (
      <span 
        className={`network-status-indicator ${isOnline ? 'online' : 'offline'}`}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          ...styles 
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            marginRight: isRTL ? '0' : '5px',
            marginLeft: isRTL ? '5px' : '0',
          }}
        />
        <span>{statusMessage}</span>
      </span>
    );
  }
  
  // عرض شريط (banner)
  if (variant === 'banner') {
    if (isOnline && connectionType === '4g') {
      // لا نعرض شيئاً إذا كان الاتصال جيداً
      return null;
    }
    
    return (
      <div
        className={`network-status-banner ${isOnline ? 'online' : 'offline'}`}
        style={{
          backgroundColor: getStatusColor(),
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          width: '100%',
          ...styles
        }}
      >
        {statusMessage}
        {!isOnline && timeSinceLastOnline && (
          <span style={{ marginInlineStart: '10px' }}>
            ({timeSinceLastOnline})
          </span>
        )}
      </div>
    );
  }
  
  // عرض تفصيلي (detailed)
  return (
    <div 
      className={`network-status-detailed ${isOnline ? 'online' : 'offline'}`}
      style={{
        border: `1px solid ${getStatusColor()}`,
        borderRadius: '4px',
        padding: '15px',
        ...directionalStyles.direction(),
        ...styles
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            marginRight: isRTL ? '0' : '10px',
            marginLeft: isRTL ? '10px' : '0',
          }}
        />
        <h4 style={{ margin: 0 }}>{statusMessage}</h4>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        {connectionType && isOnline && (
          <p style={{ margin: '5px 0' }}>
            <strong>Connection Type:</strong> {connectionType}
          </p>
        )}
        
        {!isOnline && timeSinceLastOnline && (
          <p style={{ margin: '5px 0' }}>
            {timeSinceLastOnline}
          </p>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;