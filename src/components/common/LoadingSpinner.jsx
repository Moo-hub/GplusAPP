import React from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingSpinner.css';

/**
 * LoadingSpinner component - displays a loading indicator with optional message
 * @param {Object} props
 * @param {string} props.size - Size of the spinner (small, medium, large)
 * @param {string} props.message - Message to display below the spinner
 * @param {boolean} props.fullscreen - Whether the spinner should take up the full screen
 * @param {string} props.color - Color of the spinner
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  message, 
  fullscreen = false,
  color = 'primary'
}) => {
  const { t } = useTranslation();
  const defaultMessage = t('common.loading');
  
  const spinnerClasses = [
    'loading-spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    fullscreen ? 'spinner-fullscreen' : ''
  ].join(' ');

  return (
    <div className={`loading-container ${fullscreen ? 'fullscreen' : ''}`}>
      <div className={spinnerClasses}></div>
      {(message || defaultMessage) && (
        <p className="loading-message">{message || defaultMessage}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;