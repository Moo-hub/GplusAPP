import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorProvider, useErrorContext } from '../context/ErrorContext';
import { getErrorMessage } from '../hooks/useErrorHandler';

// Mock the useErrorHandler module
jest.mock('../hooks/useErrorHandler', () => ({
  getErrorMessage: jest.fn().mockImplementation((error) => 
    error.customMessage || 'Default error message'
  )
}));

// Test component that uses the error context
const TestComponent = ({ throwError = false, customError = null }) => {
  const { error, setError, clearError, catchError } = useErrorContext();
  
  const handleClick = () => {
    if (throwError) {
      throw new Error('Test error');
    } else if (customError) {
      setError(customError);
    } else {
      clearError();
    }
  };

  const handleAsyncClick = async () => {
    try {
      await catchError(Promise.reject(new Error('Async error')));
    } catch (e) {
      // Error will be caught by catchError and passed to setError
      // We catch it here to prevent test failures
    }
  };
  
  return (
    <div>
      <button data-testid="action-button" onClick={handleClick}>
        Action Button
      </button>
      <button data-testid="async-button" onClick={handleAsyncClick}>
        Async Action
      </button>
      {error && (
        <div data-testid="error-message">
          {error.message}
        </div>
      )}
    </div>
  );
};

describe('ErrorContext', () => {
  test('should throw error when used outside of provider', () => {
    // Silence console.error during this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => render(<TestComponent />)).toThrow(
      'useErrorContext must be used within an ErrorProvider'
    );
    
    console.error = originalError;
  });
  
  test('should initialize with null error state', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );
    
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
  
  test('should set error when setError is called', () => {
    const customError = { customMessage: 'Custom test error' };
    
    render(
      <ErrorProvider>
        <TestComponent customError={customError} />
      </ErrorProvider>
    );
    
    fireEvent.click(screen.getByTestId('action-button'));
    
    expect(getErrorMessage).toHaveBeenCalledWith(customError);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Default error message');
  });
  
  test('should clear error when clearError is called', () => {
    const customError = { customMessage: 'Custom test error' };
    
    render(
      <ErrorProvider>
        <TestComponent customError={customError} />
      </ErrorProvider>
    );
    
    fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    
    // Now clear the error
    fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
  
  test('should set error when async operation fails', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('async-button'));
    });
    
    expect(getErrorMessage).toHaveBeenCalled();
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });
});