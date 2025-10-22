import { useState } from 'react';
import { useToastHandler } from '../hooks/useToastHandler';
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showPromise, 
  dismissAll 
} from '../utils/toast';

/**
 * Example component demonstrating the toast notification system
 */
const ToastExample = () => {
  const { 
    isLoading, 
    handleAsync, 
    success, 
    error, 
    warning, 
    info 
  } = useToastHandler();
  
  const [promiseState, setPromiseState] = useState('idle');

  // Simple examples using direct toast utilities
  const showSuccessExample = () => {
    showSuccess('Operation completed successfully!');
  };
  
  const showErrorExample = () => {
    showError('Something went wrong. Please try again.');
  };
  
  const showWarningExample = () => {
    showWarning('This action might cause problems.');
  };
  
  const showInfoExample = () => {
    showInfo('The system is currently updating.');
  };
  
  const dismissAllExample = () => {
    dismissAll();
  };
  
  // Example using hook methods
  const hookSuccessExample = () => {
    success('Success from the hook!');
  };
  
  const hookErrorExample = () => {
    error('Error from the hook!');
  };
  
  // Example using handleAsync with a simulated API call
  const handleAsyncExample = async () => {
    try {
      await handleAsync(
        // Simulated API call
        () => new Promise((resolve) => setTimeout(resolve, 2000)),
        {
          loading: 'Processing your request...',
          success: 'Request completed successfully!',
          error: 'Failed to process your request.'
        }
      );
    } catch (err) {
      try { require('../utils/logger').error('Error caught:', err); } catch (e) { void e; }
    }
  };
  
  // Example using promise toast
  const handlePromiseExample = () => {
    setPromiseState('pending');
    
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.5;
        if (success) {
          resolve('Data loaded successfully');
          setPromiseState('success');
        } else {
          reject(new Error('Could not load data'));
          setPromiseState('error');
        }
      }, 3000);
    });
    
    showPromise(
      promise,
      {
        pending: 'Loading data...',
        success: 'Data loaded successfully!',
        error: 'Failed to load data!'
      }
    );
    
    return promise.catch(() => {}); // Prevent unhandled rejection
  };
  
  return (
    <div className="toast-examples">
      <h2>Toast Notification Examples</h2>
      
      <section className="example-section">
        <h3>Basic Toast Examples</h3>
        <div className="button-grid">
          <button onClick={showSuccessExample} className="btn btn-success">
            Show Success Toast
          </button>
          
          <button onClick={showErrorExample} className="btn btn-danger">
            Show Error Toast
          </button>
          
          <button onClick={showWarningExample} className="btn btn-warning">
            Show Warning Toast
          </button>
          
          <button onClick={showInfoExample} className="btn btn-info">
            Show Info Toast
          </button>
          
          <button onClick={dismissAllExample} className="btn btn-secondary">
            Dismiss All Toasts
          </button>
        </div>
      </section>
      
      <section className="example-section">
        <h3>Hook Toast Examples</h3>
        <div className="button-grid">
          <button onClick={hookSuccessExample} className="btn btn-success">
            Success from Hook
          </button>
          
          <button onClick={hookErrorExample} className="btn btn-danger">
            Error from Hook
          </button>
          
          <button 
            onClick={handleAsyncExample} 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Async Operation with Toast'}
          </button>
        </div>
      </section>
      
      <section className="example-section">
        <h3>Promise Toast Example</h3>
        <div className="button-grid">
          <button 
            onClick={handlePromiseExample} 
            className="btn btn-primary"
            disabled={promiseState === 'pending'}
          >
            {promiseState === 'pending' ? 'Loading...' : 'Start Promise Operation'}
          </button>
          
          <div className="promise-state">
            Current state: <strong>{promiseState}</strong>
          </div>
        </div>
        <p className="hint">
          This example has a 50% chance of success/failure to demonstrate both outcomes.
        </p>
      </section>
      
      <section className="example-section docs">
        <h3>How to Use</h3>
        <div className="code-example">
          <pre>
            {`
// Direct usage:
import { showSuccess, showError } from '../utils/toast';

showSuccess('Operation successful!');
showError('Something went wrong');

// Hook usage:
import { useToastHandler } from '../hooks/useToastHandler';

const { handleAsync, success, error } = useToastHandler();

// With async operations:
await handleAsync(
  () => api.createItem(data),
  {
    loading: 'Creating item...',
    success: 'Item created!',
    error: 'Failed to create item'
  }
);
            `}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ToastExample;