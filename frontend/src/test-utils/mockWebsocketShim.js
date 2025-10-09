// Helper to standardize mocking the production websocket.service to the
// ESM-compatible test shim located at ../test-shims/websocket.service.
// Usage in a test file (top of file):
// import { useWebsocketShimMock } from '../../test-utils/mockWebsocketShim';
// useWebsocketShimMock();

// @ts-nocheck
/* global vi */
/* eslint-disable no-undef */
export function useWebsocketShimMock() {
  // Protect against repeated calls from the same test file
  if (globalThis.__websocketShimMockInstalled) return;

  // Module-mock the production import path so components importing
  // '../services/websocket.service' receive the test shim instead.
  // This must be called before the system under test imports the
  // production module (i.e. at top-level of the test file).
  vi.mock('../../services/websocket.service', async () => {
    const mod = await import('../test-shims/websocket.service');
    return {
      default: mod.default,
      websocketService: mod.websocketService,
      resetWebsocketShim: mod.resetWebsocketShim,
      emitToTest: mod.emitToTest,
      getUnreadCountForTest: mod.getUnreadCountForTest,
    };
  });

  globalThis.__websocketShimMockInstalled = true;

  // Ensure the shim is reset before each test in the current file. Tests
  // can still call resetWebsocketShim() directly when needed.
  beforeEach(() => {
    // Lazy-import the shim and reset it. Use void to avoid unhandled promise
    // warnings in environments that don't await beforeEach hooks.
    void import('../test-shims/websocket.service').then((m) => m.resetWebsocketShim());
  });
}

// Convenience re-export if tests prefer to call reset directly.
export async function resetWebsocketShim() {
  const m = await import('../test-shims/websocket.service');
  return m.resetWebsocketShim();
}

/* eslint-enable no-undef */
