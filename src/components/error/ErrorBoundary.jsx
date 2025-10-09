import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.node,
    t: PropTypes.func.isRequired,
    onError: PropTypes.func
  };

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // Log the error
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You could also log to an error monitoring service here
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, errorInfo);
    // }
  }

  render() {
    const { t, fallback, children } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // If a fallback component is provided, render it
      if (fallback) {
        return fallback;
      }

      // Otherwise render a default error UI
      return (
        <div className="error-boundary">
          <h2>{t('errors.somethingWentWrong')}</h2>
          <details>
            <summary>{t('errors.showDetails')}</summary>
            <p>{error && (error.toString())}</p>
          </details>
          <button 
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            {t('errors.tryAgain')}
          </button>
        </div>
      );
    }

    // If no error, render children normally
    return children;
  }
}

export default withTranslation()(ErrorBoundary);