import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useToastHandler } from '../hooks/useToastHandler';
import * as toast from '../utils/toast';
import { useErrorContext } from '../context/ErrorContext';

// Mock the toast utilities
vi.mock('../utils/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn()
}));

// Mock the ErrorContext hook
vi.mock('../context/ErrorContext', () => ({
  useErrorContext: vi.fn()
}));

describe('useToastHandler', () => {
  const mockCatchError = vi.fn();
  
  beforeEach(() => {
    // Setup mock implementation of useErrorContext
    useErrorContext.mockReturnValue({
      catchError: mockCatchError
    });
    
  // Clear all mocks
  vi.clearAllMocks();
  });
  
  test('should initialize with correct default values', () => {
    const { result } = renderHook(() => useToastHandler());
    
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.handleAsync).toBe('function');
    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.warning).toBe('function');
    expect(typeof result.current.info).toBe('function');
  });
  
  test('should call success toast utility', () => {
    const { result } = renderHook(() => useToastHandler());

    // no async state updates here, act is unnecessary
    result.current.success('Test success message');

    expect(toast.showSuccess).toHaveBeenCalledWith('Test success message', {});
  });
  
  test('should call error toast utility', () => {
    const { result } = renderHook(() => useToastHandler());

    // no async state updates here, act is unnecessary
    result.current.error('Test error message');

    expect(toast.showError).toHaveBeenCalledWith('Test error message', {});
  });
  
  test('should call warning toast utility', () => {
    const { result } = renderHook(() => useToastHandler());

    // no async state updates here, act is unnecessary
    result.current.warning('Test warning message');

    expect(toast.showWarning).toHaveBeenCalledWith('Test warning message', {});
  });
  
  test('should call info toast utility', () => {
    const { result } = renderHook(() => useToastHandler());

    // no async state updates here, act is unnecessary
    result.current.info('Test info message');

    expect(toast.showInfo).toHaveBeenCalledWith('Test info message', {});
  });
  
  test('handleAsync should manage loading state and show appropriate toasts on success', async () => {
    const { result } = renderHook(() => useToastHandler());
  const mockFn = vi.fn().mockResolvedValue('success result');
    mockCatchError.mockImplementation(promise => promise);
    
    let asyncResult;
    
    await act(async () => {
      asyncResult = await result.current.handleAsync(
        mockFn,
        {
          loading: 'Loading message',
          success: 'Success message',
          error: 'Error message'
        }
      );
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(toast.showInfo).toHaveBeenCalledWith('Loading message', {});
    expect(toast.showSuccess).toHaveBeenCalledWith('Success message', {});
    expect(toast.showError).not.toHaveBeenCalled();
    expect(mockCatchError).toHaveBeenCalled();
    expect(asyncResult).toBe('success result');
  });
  
  test('handleAsync should manage loading state and not update global error when specified', async () => {
    const { result } = renderHook(() => useToastHandler({ updateGlobalError: false }));
  const mockFn = vi.fn().mockResolvedValue('success result');
    
    await act(async () => {
      await result.current.handleAsync(mockFn);
    });
    
    expect(mockCatchError).not.toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalled();
  });
  
  test('handleAsync should handle errors and show error toast when not updating global error', async () => {
    const { result } = renderHook(() => useToastHandler({ updateGlobalError: false }));
    const testError = new Error('Test error');
  const mockFn = vi.fn().mockRejectedValue(testError);
    
    await act(async () => {
      try {
        await result.current.handleAsync(
          mockFn,
          {
            loading: 'Loading message',
            success: 'Success message',
            error: 'Error message'
          }
        );
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(toast.showInfo).toHaveBeenCalledWith('Loading message', {});
    expect(toast.showSuccess).not.toHaveBeenCalled();
    expect(toast.showError).toHaveBeenCalledWith('Error message', {});
    expect(mockCatchError).not.toHaveBeenCalled();
  });
  
  test('handleAsync should handle errors with global error context and not show duplicate toast', async () => {
    const { result } = renderHook(() => useToastHandler({ updateGlobalError: true }));
    const testError = new Error('Test error');
  const mockFn = vi.fn().mockRejectedValue(testError);
    // Ensure the mocked catchError consumes the passed-in promise so the original
    // rejected promise doesn't become an unhandled rejection. It should return
    // a promise that rejects with the same test error.
    mockCatchError.mockImplementation(promise => promise.catch(() => Promise.reject(testError)));
    
    await act(async () => {
      try {
        await result.current.handleAsync(
          mockFn,
          {
            loading: 'Loading message',
            success: 'Success message',
            error: 'Error message'
          }
        );
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(toast.showInfo).toHaveBeenCalledWith('Loading message', {});
    expect(toast.showSuccess).not.toHaveBeenCalled();
    // Error toast should not be shown when using global error context
    expect(toast.showError).not.toHaveBeenCalled();
    expect(mockCatchError).toHaveBeenCalled();
  });
});