import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';

import { useOfflineStatus } from '../hooks/useOfflineStatus';

// Mock the useToast hook
vi.mock('../contexts/ToastContext.jsx', () => ({
  useToast: vi.fn(() => ({
    addToast: vi.fn(),
  })),
}));

describe('useOfflineStatus Hook', () => {
  // Helper to ensure a configurable navigator exists in the test env
  const ensureNavigator = (initial = { onLine: true }) => {
    if (typeof global.navigator === 'undefined' || global.navigator === null) {
      try {
        Object.defineProperty(global, 'navigator', { value: initial, configurable: true });
      } catch (e) {
        // fallback to assigning
        global.navigator = initial;
      }
    }
  };

  const originalNavigatorOnLine = (function () {
    try {
      if (typeof navigator === 'undefined' || navigator === null) return undefined;
      return Object.getOwnPropertyDescriptor(navigator, 'onLine');
    } catch (e) {
      return undefined;
    }
  })();
  let mockFetch;
  let prevFetch;

  beforeEach(() => {
    // Capture current fetch at test runtime (may be MSW-installed interceptor)
    prevFetch = global.fetch;

    // Install mock fetch for the test
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Ensure navigator exists in this JS environment and reset online status between tests
    // Ensure navigator exists in this JS environment
    if (typeof global.navigator === 'undefined' || global.navigator === null) {
      // create a mock navigator object; we'll restore it in afterEach
      global['__mockedNavigator'] = {};
      Object.defineProperty(global, 'navigator', { value: global['__mockedNavigator'], configurable: true });
    }
    // Try to define onLine; if it fails (read-only), replace navigator with a shallow mock
    try {
      Object.defineProperty(global.navigator, 'onLine', {
        configurable: true,
        value: true,
        writable: true,
      });
    } catch (e) {
      // replace with a simple mock object to allow assignment in tests
      try {
        const saved = global.navigator;
        Object.defineProperty(global, '__originalNavigator', { value: saved, configurable: true });
      } catch (ee) { /* ignore */ }
      Object.defineProperty(global, 'navigator', { value: { onLine: true }, configurable: true });
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear any pending timers created by the environment/hook if fake timers used
    try {
      vi.clearAllTimers();
    } catch (e) {
      // ignore if not using fake timers
    }

    // Restore previous global.fetch (could be MSW interceptor or undefined)
    try {
      if (typeof prevFetch === 'undefined') {
        try { delete global.fetch; } catch (e) { /* ignore */ }
      } else {
        global.fetch = prevFetch;
      }
    } catch (e) {
      // ignore
    }

    // Restore original navigator.onLine property
    try {
      if (typeof global['__originalNavigator'] !== 'undefined') {
        Object.defineProperty(global, 'navigator', { value: global['__originalNavigator'], configurable: true });
        try { delete global['__originalNavigator']; } catch (e) { /* ignore */ }
      } else if (originalNavigatorOnLine && typeof global.navigator !== 'undefined' && global.navigator !== null) {
        try {
          Object.defineProperty(global.navigator, 'onLine', originalNavigatorOnLine);
        } catch (e) {
          // ignore
        }
      } else if (typeof global['__mockedNavigator'] !== 'undefined') {
        try { delete global['__mockedNavigator']; } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore restoration errors
    }
  });

  it('should initially detect online status from navigator', () => {
    // Ensure navigator is available and set online state
    ensureNavigator({ onLine: true });
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }); } catch (e) { navigator.onLine = true; }

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should initially detect offline status from navigator', () => {
    // Ensure navigator is available and set offline state
    ensureNavigator({ onLine: false });
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, value: false }); } catch (e) { navigator.onLine = false; }

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should respond to online event', () => {
    // Start offline
    ensureNavigator({ onLine: false });
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, value: false }); } catch (e) { navigator.onLine = false; }

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOffline).toBe(true);

    // Simulate going online
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }); } catch (e) { navigator.onLine = true; }

    // Dispatch online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOnline).toBe(true);
  });

  it('should respond to offline event', () => {
    // Start online
    ensureNavigator({ onLine: true });
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }); } catch (e) { navigator.onLine = true; }

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, value: false }); } catch (e) { navigator.onLine = false; }

    // Dispatch offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOnline).toBe(false);
  });

  it('should perform active connection check', async () => {
    // Resolve with a Response-like object so the hook can call .json() if needed
    // Use mockResolvedValue so multiple calls (React strict-mode double renders)
    // receive the same successful response.
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });

    // Disable automatic interval in test to avoid background timers
    const { result } = renderHook(() =>
      useOfflineStatus({ showToasts: false, checkInterval: 0, endpoint: '/api/health' })
    );

    // Call check connection manually and await the returned promise inside act
    await act(async () => {
      await result.current.checkConnection();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
    expect(result.current.isOnline).toBe(true);
  });

  it('should handle failed connection checks', async () => {
    // Return a Response-like failure so the hook's parsing path runs
    // Use mockResolvedValue so any duplicate calls still return a failure.
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'fail' }) });

    const { result } = renderHook(() =>
      useOfflineStatus({ showToasts: false, checkInterval: 0, endpoint: '/api/health' })
    );

    // Call checkConnection directly and await it inside act. The state update
    // is flushed by act, so assert directly after.
    await act(async () => {
      await result.current.checkConnection();
    });

  expect(mockFetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
  expect(result.current.isOffline).toBe(true);
  });

  it('should handle fetch errors during connection checks', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() =>
      useOfflineStatus({ showToasts: false, checkInterval: 0, endpoint: '/api/health' })
    );

    // Call checkConnection directly and wait for the hook to update state
    await act(async () => {
      await result.current.checkConnection();
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    }, { timeout: 2000 });

    expect(mockFetch).toHaveBeenCalled();
  });
});