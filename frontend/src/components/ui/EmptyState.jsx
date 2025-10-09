import React from 'react';
import PropTypes from 'prop-types';
import '../styles/fallback-ui.css';

/**
 * EmptyState component for showing when no data is available
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title text to display
 * @param {string} props.message - The message text to display
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {React.ReactNode} props.action - Action component (button, link, etc.)
 * @param {string} props.className - Additional CSS class
 * @param {React.CSSProperties} props.style - Additional inline styles
 * @param {React.ReactNode} props.children - Child elements to render instead of default content
 */
const EmptyState = ({
  title,
  message,
  icon,
  action,
  className = '',
  style = {},
  children
}) => {
  if (children) {
    return (
      <div 
        className={`empty-state ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`empty-state ${className}`}
      style={style}
      role="status"
    >
      {icon && (
        <div className="empty-state-icon">
          {icon}
        </div>
      )}
      
      {title && (
        <h3 className="empty-state-title">
          {title}
        </h3>
      )}
      
      {message && (
        <p className="empty-state-message">
          {message}
        </p>
      )}
      
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node
};

export default EmptyState;