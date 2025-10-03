import React from 'react';
import PropTypes from 'prop-types';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div 
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
      className="error-fallback"
    >
      <div className="error-fallback__container">
        <h2 className="error-fallback__title">Something went wrong</h2>
        
        <div className="error-fallback__content">
          <p>We're sorry, but an error has occurred.</p>
          {error && process.env.NODE_ENV !== 'production' && (
            <pre className="error-fallback__stack">
              {error.message}
            </pre>
          )}
        </div>

        <div className="error-fallback__actions">
          <button 
            onClick={resetErrorBoundary}
            className="error-fallback__button"
            autoFocus
          >
            Try again
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="error-fallback__button error-fallback__button--secondary"
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
  resetErrorBoundary: PropTypes.func.isRequired
};

export default ErrorFallback;