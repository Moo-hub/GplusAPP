import { useCallback, useState } from 'react';
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast';
import { useErrorContext } from '../context/ErrorContext';

/**
 * Hook that combines toast notifications with API handling
 * @param {Object} options - Configuration options
 * @returns {Object} Functions and state for handling API operations with toast feedback
 */
export const useToastHandler = (options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { catchError } = useErrorContext();
  const { updateGlobalError = true } = options;

  /**
   * Handles an async operation with loading state and toast notifications
   * @param {Function} asyncFn - The async function to execute
   * @param {Object} toastMessages - Toast messages for different states
   * @param {Object} toastOptions - Options for the toast notifications
   * @returns {Promise<any>} - The result of the async function
   */
  const handleAsync = useCallback(async (asyncFn, toastMessages = {}, toastOptions = {}) => {
    const {
      loading,
      success,
      error: errorMsg,
    } = toastMessages;

    setIsLoading(true);
    if (loading) {
      showInfo(loading, toastOptions);
    }

    try {
      // Use catchError to update global error state if updateGlobalError is true
      const result = updateGlobalError 
        ? await catchError(asyncFn())
        : await asyncFn();
        
      setIsLoading(false);
      
      if (success) {
        showSuccess(success, toastOptions);
      }
      
      return result;
    } catch (error) {
      setIsLoading(false);
      
      // Only show toast if we're not updating global error (avoids duplicate errors)
      if (!updateGlobalError && errorMsg) {
        showError(errorMsg || error, toastOptions);
      }
      
      throw error;
    }
  }, [catchError, updateGlobalError]);

  /**
   * Simplified function to show a success toast
   * @param {string} message - Success message
   * @param {Object} options - Toast options
   */
  const success = useCallback((message, options = {}) => {
    showSuccess(message, options);
  }, []);

  /**
   * Simplified function to show an error toast
   * @param {string|Error} message - Error message or object
   * @param {Object} options - Toast options
   */
  const error = useCallback((message, options = {}) => {
    showError(message, options);
  }, []);

  /**
   * Simplified function to show a warning toast
   * @param {string} message - Warning message
   * @param {Object} options - Toast options
   */
  const warning = useCallback((message, options = {}) => {
    showWarning(message, options);
  }, []);

  /**
   * Simplified function to show an info toast
   * @param {string} message - Info message
   * @param {Object} options - Toast options
   */
  const info = useCallback((message, options = {}) => {
    showInfo(message, options);
  }, []);

  return {
    isLoading,
    handleAsync,
    success,
    error,
    warning,
    info
  };
};

export default useToastHandler;