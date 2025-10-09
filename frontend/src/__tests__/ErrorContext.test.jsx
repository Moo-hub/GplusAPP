import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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
    const { container } = render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent))
    );
    
    // Scope queries to the component render container to avoid matching
    // global / leaked DOM nodes (toasts, invoked-user, etc.)
    const root = within(container);
    expect(root.queryByTestId('error-message')).not.toBeInTheDocument();
  });
  
  test('should set error when setError is called', () => {
    const customError = { customMessage: 'Custom test error' };
    const { container } = render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent, { customError }))
    );

    const root = within(container);
    fireEvent.click(root.getByTestId('action-button'));

    expect(getErrorMessage).toHaveBeenCalledWith(customError);
    expect(root.getByTestId('error-message')).toBeInTheDocument();
    expect(root.getByTestId('error-message')).toHaveTextContent('Default error message');
  });
  
  test('should clear error when clearError is called', () => {
    const customError = { customMessage: 'Custom test error' };
    
    const { container } = render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent, { customError }))
    );

    // Scope queries to the render container to prevent matching leaked DOM
    const root = within(container);
    fireEvent.click(root.getByTestId('action-button'));
    expect(root.getByTestId('error-message')).toBeInTheDocument();

    // Now clear the error
    fireEvent.click(root.getByTestId('action-button'));
    expect(root.queryByTestId('error-message')).not.toBeInTheDocument();
  });
  
  test('should set error when async operation fails', async () => {
    const { container } = render(
      React.createElement(ErrorProvider, null, React.createElement(TestComponent))
    );

    const root = within(container);
    await act(async () => {
      fireEvent.click(root.getByTestId('async-button'));
    });

    expect(getErrorMessage).toHaveBeenCalled();
    expect(root.getByTestId('error-message')).toBeInTheDocument();
  });
});
