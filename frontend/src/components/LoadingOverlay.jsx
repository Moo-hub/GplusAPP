import React from 'react';
import PropTypes from 'prop-types';

const LoadingOverlay = ({ isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="loading-overlay" data-testid="loading-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="spinner" style={{ width: 48, height: 48, border: '4px solid #6366f1', borderRadius: '50%', borderTop: '4px solid #fff', animation: 'spin 1s linear infinite' }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

LoadingOverlay.propTypes = {
  isVisible: PropTypes.bool,
};

export default LoadingOverlay;
