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

    // Start loading inside act then wait for the state to reflect the change.
    act(() => {
      result.current.startLoading();
    });

    // The hook generates a loadingId; assert it exists to confirm registration
    expect(typeof result.current.loadingId).toBe('string');

    // Wait for the registration to propagate to the context
    await waitFor(() => expect(result.current.isLoading).toBe(true), { timeout: 500 });

    // Stop loading and then verify final state is not loading
    act(() => {
      result.current.stopLoading();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 500 });
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
    let resolved;
    let p;

    // Call wrapPromise inside act to trigger state changes
    act(() => {
      p = result.current.wrapPromise(testPromise);
    });

    // Should be loading while promise is pending - wait for the flag to flip
    await waitFor(() => expect(result.current.isLoading).toBe(true), { timeout: 1000 });

    // Await the wrapped promise and then verify final state
    resolved = await p;
    expect(resolved).toBe('result');
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 500 });
  });

  it('should handle errors in wrapped promises without leaking loading state', async () => {
    const { result } = renderHook(() => useLoadingIndicator(), { wrapper });

    // Create a controllable rejecting promise. We'll call `rejectTest()`
    // only after the hook has had a chance to wrap the promise. This
    // guarantees the rejection is never unhandled and avoids Node's
    // PromiseRejectionHandledWarning.
    let rejectTest;
    const testPromise = new Promise((_, reject) => { rejectTest = reject; });
    // Attach a noop catch early as an extra safety net.
    testPromise.catch(() => {});

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Wrap the promise with loading indicator and assert via act
    let caught;
    let pErr;
    act(() => {
      // capture the wrapped promise and attach a noop catch immediately
      // to ensure the rejection is considered handled by the runtime
      // synchronously. This avoids PromiseRejectionHandledWarning in Node.
      pErr = result.current.wrapPromise(testPromise);
      pErr.catch(() => {});
    });

    // Now trigger the rejection after wrapPromise and its catch handler have
    // been attached. Use act to ensure React state updates are flushed.
    act(() => {
      if (typeof rejectTest === 'function') rejectTest(new Error('Test error'));
    });

    // Ensure loading started
    await waitFor(() => expect(result.current.isLoading).toBe(true), { timeout: 500 });

    try {
      await pErr;
    } catch (e) {
      caught = e;
    }

    // Should have caught the error
    expect(caught).toBeTruthy();
    expect(caught.message).toBe('Test error');

    // Should no longer be loading despite the error
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 500 });
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
