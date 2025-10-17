// Helpers to safely save and restore global objects in tests
export function saveGlobals() {
  return {
    localStorage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined,
    crypto: typeof global !== 'undefined' && global.crypto ? global.crypto : undefined,
    WebSocket: typeof global !== 'undefined' && global.WebSocket ? global.WebSocket : undefined,
    navigator: typeof window !== 'undefined' && window.navigator ? window.navigator : undefined,
  };
}

export function restoreGlobals(orig) {
  try {
    if (orig.localStorage !== undefined) {
      try { Object.defineProperty(window, 'localStorage', { configurable: true, writable: true, value: orig.localStorage }); } catch (e) { window.localStorage = orig.localStorage; }
    }
  } catch (e) {}
  try {
    if (orig.crypto !== undefined) {
      try { Object.defineProperty(global, 'crypto', { configurable: true, writable: true, value: orig.crypto }); } catch (e) { global.crypto = orig.crypto; }
    }
  } catch (e) {}
  try {
    if (orig.WebSocket !== undefined) {
      try { Object.defineProperty(global, 'WebSocket', { configurable: true, writable: true, value: orig.WebSocket }); } catch (e) { global.WebSocket = orig.WebSocket; }
    }
  } catch (e) {}
  try {
    if (orig.navigator !== undefined) {
      try { Object.defineProperty(window, 'navigator', { configurable: true, writable: true, value: orig.navigator }); } catch (e) { window.navigator = orig.navigator; }
    }
  } catch (e) {}
}
