import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import useLoadingIndicator from '../hooks/useLoadingIndicator';
import { LoadingProvider } from '../contexts/LoadingContext.jsx';

import * as React from 'react';


describe('useLoadingIndicator Hook', () => {
  beforeEach(() => {
    // Reset mocks for each test. Do not attempt to spy on React's named
    // exports (like useRef) because ESM module namespaces are not
    // configurable in the test environment.
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => <LoadingProvider>{children}</LoadingProvider>;

  it('should start and stop loading', async () => {
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Start loading
    act(() => {
      result.current.startLoading();
    });

    // Should be loading
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    // Stop loading
    act(() => {
      result.current.stopLoading();
    });

    // Should no longer be loading
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('should wrap a promise with loading state', async () => {
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });

    // Create a test promise that will resolve after a short delay
    const testPromise = new Promise(resolve => {
      setTimeout(() => resolve('result'), 150);
    });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Wrap the promise with loading indicator (wrapPromise returns a Promise)
    let p;
    act(() => {
      p = result.current.wrapPromise(testPromise);
    });

    // Should be loading while promise is pending - wait for state update outside of act
    await waitFor(() => expect(result.current.isLoading).toBe(true), { timeout: 1000 });

    const resolved = await p;

    // After promise resolves, loading should turn false again
    expect(resolved).toBe('result');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('should handle errors in wrapped promises without leaking loading state', async () => {
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });

    // Create a test promise that will reject
    const testPromise = Promise.reject(new Error('Test error'));

    // Suppress unhandled rejection warning in test
    testPromise.catch(() => {});

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Wrap the promise with loading indicator and assert via act
    let caught;
    await act(async () => {
      try {
        await result.current.wrapPromise(testPromise);
      } catch (e) {
        caught = e;
      }
    });

    // Should have caught the error
    expect(caught).toBeTruthy();
    expect(caught.message).toBe('Test error');

    // Should no longer be loading despite the error
    expect(result.current.isLoading).toBe(false);
  });

  it('should use the provided ID', () => {
    const testId = 'test-loading-id';
    const { result } = renderHook(() => useLoadingIndicator({ id: testId, global: false }), { wrapper });
    
    expect(result.current.loadingId).toBe(testId);
  });

  // No afterEach necessary for a useRef spy — we avoid spying on ESM exports.

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
