import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorProvider, useErrorContext } from '../context/ErrorContext';
import { getErrorMessage } from '../hooks/useErrorHandler';
import { vi } from 'vitest';

// Mock the useErrorHandler module to return a deterministic default message
vi.mock('../hooks/useErrorHandler', () => ({
  getErrorMessage: vi.fn().mockReturnValue('Default error message')
}));

// Test component that uses the error context
const TestComponent = ({ throwError = false, customError = null }) => {
  const { error, setError, clearError, catchError } = useErrorContext();

  const handleClick = () => {
    if (throwError) {
      throw new Error('Test error');
    } else if (customError) {
      // Toggle: if an error is already present, clear it; otherwise set it
      if (error) {
        clearError();
      } else {
        setError(customError);
      }
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

  const children = [];
  children.push(React.createElement('button', { 'data-testid': 'action-button', onClick: handleClick }, 'Action Button'));
  children.push(React.createElement('button', { 'data-testid': 'async-button', onClick: handleAsyncClick }, 'Async Action'));
  if (error) {
    children.push(React.createElement('div', { 'data-testid': 'error-message' }, error.message));
  }

  return React.createElement('div', null, ...children);
};

describe('ErrorContext', () => {
  test('should throw error when used outside of provider', () => {
  // Silence console.error during this test
  const originalError = console.error;
  console.error = vi.fn();
    
    expect(() => render(React.createElement(TestComponent))).toThrow(
      'useErrorContext must be used within an ErrorProvider'
    );
    
    console.error = originalError;
  });
  
  test('should initialize with null error state', () => {
    render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent))
    );
    
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
  
  test('should set error when setError is called', () => {
    const customError = { customMessage: 'Custom test error' };
    
    render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent, { customError }))
    );
    
  fireEvent.click(screen.getByTestId('action-button'));
    
    expect(getErrorMessage).toHaveBeenCalledWith(customError);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Default error message');
  });
  
  test('should clear error when clearError is called', () => {
    const customError = { customMessage: 'Custom test error' };
    
    render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent, { customError }))
    );
    
  fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    
    // Now clear the error
    fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
  
  test('should set error when async operation fails', async () => {
    render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent))
    );
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('async-button'));
    });
    
    expect(getErrorMessage).toHaveBeenCalled();
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });
});
