import React, { createContext, useContext } from 'react';
import { useCSRF } from '../services/csrf';

// Create the context
const CSRFContext = createContext(null);

/**
 * Provider component for CSRF token handling
 */
export const CSRFProvider = ({ children }) => {
  const csrf = useCSRF();

  return (
    <CSRFContext.Provider value={csrf}>
      {children}
    </CSRFContext.Provider>
  );
};

/**
 * Hook to access CSRF functionality in components
 * @returns {Object} CSRF token and functions
 */
export const useCSRFContext = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRFContext must be used within a CSRFProvider');
  }
  return context;
};

export default CSRFContext;