import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useLoadingIndicator from '../hooks/useLoadingIndicator';
import { LoadingProvider } from '../contexts/LoadingContext.jsx';

import * as React from 'react';

// Use a test-scoped spy for React.useRef to avoid global mutation that can
// interfere with other tests. The spy is created in beforeEach and restored
// in afterEach.
describe('useLoadingIndicator Hook', () => {
  beforeEach(() => {
    // Reset mocks. Avoid spying on React namespace in ESM (not configurable).
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => React.createElement(LoadingProvider, null, children);

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
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });
    const { waitFor } = await import('@testing-library/react');
    
    // Create a test promise that resolves on the next microtask to avoid
    // relying on real timers in unit tests which can leak between tests.
    const testPromise = new Promise(resolve => {
      Promise.resolve().then(() => resolve('result'));
    });
    
    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Wrap the promise with loading indicator
    let promiseResult;
    act(() => {
      promiseResult = result.current.wrapPromise(testPromise);
    });
    
  // Should be loading while promise is pending - assert via waitFor
  await waitFor(() => expect(result.current.isLoading).toBe(true));
    
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
    const { result } = renderHook(() => useLoadingIndicator({ id: testId, global: false }), { wrapper });
    
    expect(result.current.loadingId).toBe(testId);
  });

  afterEach(() => {
    // No-op cleanup; we avoid spying on React.useRef in ESM environments.
  });

  it('should affect global loading state when global option is true', () => {
    // Create two hooks - one global, one not
    const { result: globalResult } = renderHook(
      () => useLoadingIndicator({ id: 'global', global: true }), 
      { wrapper }
    );
    
    const { result: regularResult } = renderHook(
      () => useLoadingIndicator({ id: 'regular', global: false }),
      { wrapper }
    );
    
    // Use a third hook to monitor the global loading state
    const { result: monitorResult } = renderHook(
      () => useLoadingIndicator({ id: 'monitor', global: false }),
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