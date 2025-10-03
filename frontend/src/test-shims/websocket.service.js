// ESM-compatible websocket test shim
// Methods will be wrapped with vitest's `vi.fn` when available so tests
// can assert calls with toHaveBeenCalled / toHaveBeenCalledWith. When
// `vi` is not available (e.g. runtime outside tests), falls back to
// plain functions.
const listeners = {};

// Helper to wrap a function with vi.fn if present
const makeSpy = (fn) => {
  if (typeof globalThis !== 'undefined' && globalThis.vi && typeof globalThis.vi.fn === 'function') {
    return globalThis.vi.fn(fn);
  }
  // attach a mock object so assertion helpers can still detect a mock-like API
  const fallback = (...args) => fn(...args);
  try { fallback.mock = { calls: [] }; } catch (e) { /* ignore */ }
  return function (...args) {
    try { fallback.mock.calls.push(args); } catch (e) { /* ignore */ }
    return fallback(...args);
  };
};

const _on_impl = (event, cb) => {
  listeners[event] = cb;
  const unsubscribe = () => { delete listeners[event]; };
  return unsubscribe;
};

const _off_impl = (event) => { delete listeners[event]; };

const _emit_impl = (event, payload) => {
  if (event === 'notification') {
    svc._unreadCount += 1;
  }
  if (listeners[event]) listeners[event](payload);
};

const svc = {
  ws: { readyState: 3 },
  _unreadCount: 0,
  connect: () => {},
  // exported spies
  on: null,
  off: null,
  emitToTest: null,
  getUnreadCountForTest: null,
};

svc.on = makeSpy(_on_impl);
svc.off = makeSpy(_off_impl);
svc.emitToTest = makeSpy(_emit_impl);
svc.getUnreadCountForTest = makeSpy(() => svc._unreadCount);

export default svc;
export const websocketService = svc;
export function resetWebsocketShim() { svc._unreadCount = 0; }
