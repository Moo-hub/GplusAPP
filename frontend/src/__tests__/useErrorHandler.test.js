import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-toastify';
import { useErrorHandler, getErrorMessage } from '../hooks/useErrorHandler';
import { vi } from 'vitest';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn()
  }
}));

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
  vi.clearAllMocks();
});

describe('useErrorHandler', () => {
  test('should initialize with correct default values', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.handleAsync).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  test('should handle successful async operations', async () => {
    const { result } = renderHook(() => useErrorHandler());
  const mockAsyncFn = vi.fn().mockResolvedValue('success');
    
    let value;
    await act(async () => {
      value = await result.current.handleAsync(mockAsyncFn);
    });
    
    expect(value).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('should handle async operation errors', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');
  const mockAsyncFn = vi.fn().mockRejectedValue(testError);
    const toastMessage = 'Something went wrong';
    
    await act(async () => {
      try {
        await result.current.handleAsync(mockAsyncFn, toastMessage);
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
    
    expect(result.current.error).toBe(testError);
    expect(result.current.isLoading).toBe(false);
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(toastMessage);
    expect(console.error).toHaveBeenCalled();
  });

  test('should call custom onError function when provided', async () => {
  const onError = vi.fn();
    const { result } = renderHook(() => useErrorHandler({ onError }));
    const testError = new Error('Test error');
  const mockAsyncFn = vi.fn().mockRejectedValue(testError);
    
    await act(async () => {
      try {
        await result.current.handleAsync(mockAsyncFn);
      } catch (error) {
        // Just to catch the rejection
      }
    });
    
    expect(onError).toHaveBeenCalledWith(testError);
  });

  test('should not show toast when showToast is false', async () => {
    const { result } = renderHook(() => useErrorHandler({ showToast: false }));
    const testError = new Error('Test error');
  const mockAsyncFn = vi.fn().mockRejectedValue(testError);
    
    await act(async () => {
      try {
        await result.current.handleAsync(mockAsyncFn, 'Error message');
      } catch (error) {
        // Just to catch the rejection
      }
    });
    
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('clearError should reset error state', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');
  const mockAsyncFn = vi.fn().mockRejectedValue(testError);
    
    await act(async () => {
      try {
        await result.current.handleAsync(mockAsyncFn);
      } catch (error) {
        // Just to catch the rejection
      }
    });
    
    expect(result.current.error).toBe(testError);
    
    // Wrap state updates in act to ensure the hook flushes updates
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });
});

describe('getErrorMessage', () => {
  test('should handle network errors', () => {
    const networkError = new Error('Network Error');
    expect(getErrorMessage(networkError)).toBe('Unable to connect to the server. Please check your internet connection.');
  });
  
  test('should handle authentication errors (401)', () => {
    const authError = { response: { status: 401 } };
    expect(getErrorMessage(authError)).toBe('Your session has expired. Please log in again.');
  });
  
  test('should handle permission errors (403)', () => {
    const permissionError = { response: { status: 403 } };
    expect(getErrorMessage(permissionError)).toBe('You do not have permission to perform this action.');
  });
  
  test('should handle not found errors (404)', () => {
    const notFoundError = { response: { status: 404 } };
    expect(getErrorMessage(notFoundError)).toBe('The requested resource was not found.');
  });
  
  test('should handle validation errors (422) with array details', () => {
    const validationError = { 
      response: { 
        status: 422, 
        data: { 
          detail: [
            { msg: 'Field is required' },
            { msg: 'Value is invalid' }
          ] 
        } 
      } 
    };
    expect(getErrorMessage(validationError)).toBe('Field is required, Value is invalid');
  });
  
  test('should handle server errors (500)', () => {
    const serverError = { response: { status: 500 } };
    expect(getErrorMessage(serverError)).toBe('Server error. Our team has been notified.');
  });
  
  test('should handle other API errors with detail', () => {
    const otherError = { 
      response: { 
        status: 400, 
        data: { 
          detail: 'Bad request error' 
        } 
      } 
    };
    expect(getErrorMessage(otherError)).toBe('Bad request error');
  });
  
  test('should return default message for unknown errors', () => {
    const unknownError = { message: 'Unknown error' };
    expect(getErrorMessage(unknownError)).toBe('An unexpected error occurred. Please try again later.');
  });
});