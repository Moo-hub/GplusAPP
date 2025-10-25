// import React from 'react'; // Commenting out the duplicate import
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.setState({ errorInfo });
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
  // Log to console in development (use centralized logError to minimize noisy stacks during tests)
  try { const { logError } = require('../../logError'); logError('Error caught by ErrorBoundary:', error, errorInfo); } catch (e) { try { require('../../utils/logger').error('Error caught by ErrorBoundary:', error, errorInfo); } catch (er) {} }
    
    // In a production app, you would send this to your error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Replace with actual error reporting service
      // Example: Sentry.captureException(error);
    }
  };

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallbackRender, fallbackComponent: FallbackComponent } = this.props;

    if (hasError) {
      if (fallbackRender) {
        return fallbackRender({
          error,
          resetErrorBoundary: this.resetErrorBoundary
        });
      }

      if (FallbackComponent) {
        return <FallbackComponent error={error} resetErrorBoundary={this.resetErrorBoundary} />;
      }

      return (
        <div role="alert" aria-live="assertive" className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but an error occurred. Please try again later.</p>
          <button onClick={this.resetErrorBoundary} autoFocus>
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackRender: PropTypes.func,
  fallbackComponent: PropTypes.elementType,
};

export default ErrorBoundary;