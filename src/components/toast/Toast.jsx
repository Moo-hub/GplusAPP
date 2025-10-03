import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

// Types of toasts
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Create context
const ToastContext = createContext(null);

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now().toString();
    
    // Add the new toast to the list
    setToasts(prevToasts => [
      ...prevToasts, 
      { id, message, type, duration }
    ]);

    // Auto-remove after duration
    if (duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Utility methods for common toast types
  const showSuccess = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.SUCCESS, duration), [addToast]);
  
  const showError = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.ERROR, duration), [addToast]);
  
  const showInfo = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.INFO, duration), [addToast]);
  
  const showWarning = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.WARNING, duration), [addToast]);

  const contextValue = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className={`toast toast-${toast.type}`}
            >
              <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close-btn" 
                onClick={() => removeToast(toast.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use toast functionality
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default ToastContext;