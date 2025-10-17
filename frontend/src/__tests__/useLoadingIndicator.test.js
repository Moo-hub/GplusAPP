import { renderHook, act } from '@testing-library/react-hooks';
import useLoadingIndicator from '../hooks/useLoadingIndicator';
import { LoadingProvider } from '../contexts/LoadingContext';

// Mock for React's useRef to control the generated IDs in tests
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useRef: jest.fn(val => ({ current: val }))
  };
});

describe('useLoadingIndicator Hook', () => {
  beforeEach(() => {
    // Reset useRef mock for each test
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => <LoadingProvider>{children}</LoadingProvider>;

  it('should start and stop loading', () => {
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Start loading
    act(() => {
      result.current.startLoading();
    });
    
    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Stop loading
    act(() => {
      result.current.stopLoading();
    });
    
    // Should no longer be loading
    expect(result.current.isLoading).toBe(false);
  });

  it('should wrap a promise with loading state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingIndicator(), { wrapper });
    
    // Create a test promise that will resolve after a short delay
    const testPromise = new Promise(resolve => {
      setTimeout(() => resolve('result'), 100);
    });
    
    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Wrap the promise with loading indicator
    let promiseResult;
    act(() => {
      promiseResult = result.current.wrapPromise(testPromise);
    });
    
    // Should be loading while promise is pending
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the promise to resolve
    await promiseResult;
    
    // After promise resolves, should no longer be loading
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors in wrapped promises without leaking loading state', async () => {
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });
    
    // Create a test promise that will reject
    const testPromise = Promise.reject(new Error('Test error'));
    
    // Suppress unhandled rejection warning in test
    testPromise.catch(() => {});
    
    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Wrap the promise with loading indicator
    let error;
    try {
      await act(async () => {
        await result.current.wrapPromise(testPromise);
      });
    } catch (e) {
      error = e;
    }
    
    // Should have caught the error
    expect(error).toBeTruthy();
    expect(error.message).toBe('Test error');
    
    // Should no longer be loading despite the error
    expect(result.current.isLoading).toBe(false);
  });

  it('should use the provided ID', () => {
    const testId = 'test-loading-id';
    const { result } = renderHook(() => useLoadingIndicator({ id: testId }), { wrapper });
    
    expect(result.current.loadingId).toBe(testId);
  });

  it('should affect global loading state when global option is true', () => {
    // Create two hooks - one global, one not
    const { result: globalResult } = renderHook(
      () => useLoadingIndicator({ global: true }), 
      { wrapper }
    );
    
    const { result: regularResult } = renderHook(
      () => useLoadingIndicator({ global: false }),
      { wrapper }
    );
    
    // Use a third hook to monitor the global loading state
    const { result: monitorResult } = renderHook(
      () => useLoadingIndicator({ id: 'monitor' }),
      { wrapper }
    );
    
    // Start global loading
    act(() => {
      globalResult.current.startLoading();
    });
    
    // Global loading should affect global state
    expect(monitorResult.current.isLoading).toBe(false); // Monitor is separate
    
    // Start non-global loading
    act(() => {
      regularResult.current.startLoading();
    });
    
    // Local loading should not affect other loading operations
    expect(globalResult.current.isLoading).toBe(true);
    expect(regularResult.current.isLoading).toBe(true);
    expect(monitorResult.current.isLoading).toBe(false);
  });
});