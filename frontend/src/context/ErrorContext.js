import React, { createContext, useContext, useState, useCallback } from 'react';
import { getErrorMessage } from '../hooks/useErrorHandler';

// Create the error context
const ErrorContext = createContext(null);

/**
 * Provider component for global error handling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ErrorProvider = ({ children }) => {
  const [globalError, setGlobalError] = useState(null);

  // Set a global error
  const setError = useCallback((error) => {
    const message = getErrorMessage(error);
    setGlobalError({ 
      original: error,
      message,
      timestamp: new Date()
    });
  }, []);

  // Clear the global error
  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  // Error handling for async functions
  const catchError = useCallback(async (promise) => {
    try {
      return await promise;
    } catch (error) {
      setError(error);
      throw error;
    }
  }, [setError]);

  // Context value
  const contextValue = {
    error: globalError,
    setError,
    clearError,
    catchError,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Custom hook to use the error context
 * @returns {Object} The error context value
 */
export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (context === null) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;