import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for managing loading states across the application
 */
const LoadingContext = createContext({
  isLoading: false,
  setGlobalLoading: () => {},
  startLoading: () => {},
  stopLoading: () => {},
  loadingOperations: {},
  registerLoadingOperation: () => {},
  unregisterLoadingOperation: () => {}
});

/**
 * Provider component for loading state management
 */
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOperations, setLoadingOperations] = useState({});
  
  /**
   * Set global loading state directly
   * @param {boolean} state - The new loading state
   */
  const setGlobalLoading = useCallback((state) => {
    setIsLoading(state);
  }, []);

  /**
   * Start global loading state
   */
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  /**
   * Stop global loading state
   */
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Register a named loading operation
   * @param {string} operationId - Unique identifier for the operation
   * @param {boolean} state - The loading state for this operation
   */
  const registerLoadingOperation = useCallback((operationId, state = true) => {
    setLoadingOperations(prev => ({
      ...prev,
      [operationId]: state
    }));
  }, []);

  /**
   * Unregister a loading operation
   * @param {string} operationId - Unique identifier for the operation to remove
   */
  const unregisterLoadingOperation = useCallback((operationId) => {
    setLoadingOperations(prev => {
      const newOperations = { ...prev };
      delete newOperations[operationId];
      return newOperations;
    });
  }, []);

  /**
   * The context value object with all loading management methods
   */
  const contextValue = {
    isLoading,
    setGlobalLoading,
    startLoading,
    stopLoading,
    loadingOperations,
    registerLoadingOperation,
    unregisterLoadingOperation
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * Custom hook to use the loading context
 * @returns {Object} Loading context value
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  
  return context;
};

/**
 * Higher-order component that injects loading state and methods into a component
 * @param {React.Component} Component - The component to wrap
 * @returns {React.Component} Enhanced component with loading props
 */
export const withLoading = (Component) => {
  const WithLoading = (props) => {
    const loadingProps = useLoading();
    return <Component {...props} {...loadingProps} />;
  };
  
  WithLoading.displayName = `WithLoading(${Component.displayName || Component.name || 'Component'})`;
  return WithLoading;
};

export default LoadingContext;