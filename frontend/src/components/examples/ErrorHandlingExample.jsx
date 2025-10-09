import React, { useState, useCallback } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useErrorContext } from '../context/ErrorContext';
import { getCompanies } from '../services/api';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';

/**
 * Example component showing how to use the error handling system
 */
const ErrorHandlingExample = () => {
  const [companies, setCompanies] = useState([]);
  const { error, isLoading, handleAsync, clearError } = useErrorHandler();
  const { setError } = useErrorContext();
  
  // Example function using the hook
  const loadCompanies = useCallback(async () => {
    try {
      const data = await handleAsync(
        () => getCompanies(),
        'Failed to load companies'
      );
      setCompanies(data || []);
    } catch (err) {
      console.error('Error handled by hook:', err);
    }
  }, [handleAsync]);
  
  // Example function using the context
  const throwGlobalError = () => {
    setError(new Error('This is a global error from context'));
  };
  
  // Example of throwing an error to trigger ErrorBoundary
  const throwError = () => {
    throw new Error('This error will be caught by ErrorBoundary');
  };
  
  return (
    <div className="error-handling-examples">
      <h2>Error Handling Examples</h2>
      
      <section>
        <h3>Hook-based Error Handling</h3>
        {isLoading ? (
          <p>Loading companies...</p>
        ) : (
          <>
            {error ? (
              <div className="error-message">
                <p>{error.message}</p>
                <button onClick={clearError}>Clear Error</button>
              </div>
            ) : (
              <div>
                <p>Companies loaded: {companies.length}</p>
                <button onClick={loadCompanies} disabled={isLoading}>
                  Load Companies
                </button>
              </div>
            )}
          </>
        )}
      </section>
      
      <section>
        <h3>Global Error Context</h3>
        <button onClick={throwGlobalError}>
          Set Global Error
        </button>
      </section>
      
      <section>
        <h3>Error Boundary Example</h3>
        <ErrorBoundary
          FallbackComponent={({ error, resetError }) => (
            <div className="error-boundary-fallback">
              <p>Error caught by boundary: {error.message}</p>
              <button onClick={resetError}>Reset</button>
            </div>
          )}
        >
          <div>
            <p>This component is wrapped in an ErrorBoundary</p>
            <button onClick={throwError}>
              Throw Error (will be caught)
            </button>
          </div>
        </ErrorBoundary>
      </section>
    </div>
  );
};

export default ErrorHandlingExample;