import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/fallback-ui.css';

/**
 * LoadingOverlay component displays a full-screen loading spinner overlay
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether the overlay is visible
 * @param {string} props.message - Optional message to display
 * @param {React.ReactNode} props.spinnerComponent - Custom spinner component
 * @param {string} props.overlayClass - Additional CSS class for the overlay
 * @param {string} props.spinnerClass - Additional CSS class for the spinner
 */
const LoadingOverlay = ({
  isVisible,
  message = 'Loading...',
  spinnerComponent,
  overlayClass = '',
  spinnerClass = '',
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className={`loading-overlay ${overlayClass}`}
      aria-live="polite"
      aria-busy={isVisible}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          maxWidth: '80%'
        }}
        className="loading-overlay-content"
      >
        {spinnerComponent ? (
          spinnerComponent
        ) : (
          <div className={`loading-spinner ${spinnerClass}`} role="status" />
        )}
        
        {message && (
          <div 
            className="loading-message"
            style={{
              marginTop: '1rem',
              fontSize: '1rem',
              color: '#333'
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  message: PropTypes.string,
  spinnerComponent: PropTypes.node,
  overlayClass: PropTypes.string,
  spinnerClass: PropTypes.string
};

export default LoadingOverlay;