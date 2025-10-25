// File removed to unblock Vitest test runs. All global stubs and mocks are now in setupTests.js.
// --- Force all toast utility functions to be vi.fn() ---
import { vi } from 'vitest';
globalThis.toast = globalThis.toast || {};
globalThis.toast.success = vi.fn();
globalThis.toast.error = vi.fn();
globalThis.toast.info = vi.fn();
globalThis.toast.warn = vi.fn();
globalThis.toast.dismiss = vi.fn();
globalThis.toast.isActive = vi.fn(() => true);
globalThis.toast.update = vi.fn();
globalThis.toast.promise = vi.fn();
globalThis.showError = vi.fn();
globalThis.showWarning = vi.fn();
globalThis.showInfo = vi.fn();
globalThis.showPromise = vi.fn();
globalThis.dismissAll = vi.fn();
globalThis.updateToast = vi.fn();
// vitest.setup.js - A setup file that doesn't rely on external dependencies
import { vi, expect } from 'vitest';
// --- Toast Utility Global Mocks ---
global.showSuccess = vi.fn();
global.showError = vi.fn();
global.showWarning = vi.fn();
global.showInfo = vi.fn();
global.showPromise = vi.fn();
global.dismissAll = vi.fn();
global.updateToast = vi.fn();

// Ensure a minimal navigator exists early so tests that mutate navigator
// properties don't fail in worker environments where navigator may be absent.
try {
  if (typeof globalThis !== 'undefined' && typeof globalThis.navigator === 'undefined') {
    try { globalThis.navigator = { onLine: true }; } catch (e) { /* ignore */ }
  }
} catch (e) {}

// If the test environment didn't provide a DOM (document/window), create a
// minimal one using jsdom so tests and @testing-library/react can run safely.
try {
  if (typeof globalThis !== 'undefined' && typeof globalThis.document === 'undefined') {
    try {
      const { JSDOM } = await import('jsdom').catch(() => ({}));
      if (JSDOM && typeof JSDOM === 'function') {
        const dom = new JSDOM('<!doctype html><html><body></body></html>');
        try { global.window = dom.window; } catch (e) { global.window = dom.window; }
        try { global.document = dom.window.document; } catch (e) { global.document = dom.window.document; }
        try { global.Node = dom.window.Node; } catch (e) {}
        try { global.HTMLElement = dom.window.HTMLElement; } catch (e) {}
        try { global.navigator = dom.window.navigator; } catch (e) { global.navigator = { onLine: true }; }
        try { global.window.getComputedStyle = dom.window.getComputedStyle; } catch (e) {}
      }
    } catch (e) {
      // if jsdom isn't available, tests that need a DOM will still fail loudly
    }
  }
} catch (e) {}

// --- EARLY TEST INFRA INITIALIZATION -------------------------------------------------
// Make fetch and axios test-friendly as early as possible to avoid import-time
// codepaths performing real network calls before MSW is ready. This block
// attempts to set a reliable global.fetch and axios adapter/baseURL.
try {
  // 1) Ensure a usable global.fetch exists. Prefer undici/node-fetch if available.
  if (typeof globalThis.fetch === 'undefined') {
    try {
      // Resolve via createRequire at runtime to avoid bundler/static analysis
      const { createRequire } = await import('module');
      const req = createRequire(import.meta.url);
      try {
        // Try undici first (may be ESM or CJS depending on installation)
        const undici = req('undici');
        if (undici && typeof undici.fetch === 'function') {
          globalThis.fetch = undici.fetch;
        } else if (undici && undici.default && typeof undici.default.fetch === 'function') {
          globalThis.fetch = undici.default.fetch;
        }
      } catch (e) {
        // Fallback to node-fetch if undici not present
        try {
          const nodeFetch = req('node-fetch');
          globalThis.fetch = typeof nodeFetch === 'function' ? nodeFetch : nodeFetch.default || nodeFetch;
        } catch (e2) {
          // leave fetch undefined; MSW may still work if tests mock fetch
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 2) Attempt to set axios node http adapter and deterministic baseURL early
  try {
    const { default: axios } = await import('axios').catch(() => ({}));
    if (axios && axios.defaults) {
      try {
        // Try common adapter paths via createRequire for CJS layout
        const { createRequire } = await import('module');
        const req = createRequire(import.meta.url);
        const adapterCandidates = [
          'axios/lib/adapters/http',
          'axios/lib/adapters/node',
          'axios/dist/node/axios.cjs'
        ];
        for (const p of adapterCandidates) {
          try {
            const httpAdapter = req(p);
            if (httpAdapter) {
              axios.defaults.adapter = httpAdapter;
              break;
            }
          } catch (err) { /* try next */ }
        }
      } catch (e) {
        // ignore adapter resolution errors
      }
      try { if (!axios.defaults.baseURL) axios.defaults.baseURL = 'http://localhost'; } catch (e) {}
    }
  } catch (e) {
    // ignore if axios isn't available
  }
} catch (e) {}
// --- END EARLY TEST INFRA INITIALIZATION ---------------------------------------------

// --- BOOT BARRIER: ensure MSW, fetch, and axios are ready before any tests run ---
try {
  try {
    const mswProxy = await import('./frontend/src/mocks/server.js').catch(() => null);
    if (mswProxy && mswProxy.server) {
      // Wait for the proxy's ready promise (the proxy exposes `ready`)
      try {
        const ready = mswProxy.server.ready || Promise.resolve();
        // race with a short timeout to avoid hanging the setup in degenerate cases
        await Promise.race([ready, new Promise((r) => setTimeout(r, 3000))]);
      } catch (e) {
        // ignore readiness failures; we'll still attempt to start/listen below
      }

      // Ensure the server is listening now so imports that trigger network
      // requests during module initialization are intercepted.
      try { await mswProxy.server.listen({ onUnhandledRequest: 'warn' }); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    // swallow errors in boot barrier to avoid masking test failures
  }
} catch (e) {}
// --- end boot barrier ---------------------------------------------------------------

// Force axios to use the Node http adapter in the test environment so
// msw/node can intercept requests made by axios. We attempt several
// resolution strategies to be robust across install layouts.
try {
  try {
    const { default: axios } = await import('axios');
    const { createRequire } = await import('module');
    const requireCjs = createRequire(import.meta.url);
    const adapterCandidates = [
      'axios/lib/adapters/http',
      'axios/lib/adapters/node',
      'axios/dist/node/axios.cjs'
    ];
    for (const p of adapterCandidates) {
      try {
        const httpAdapter = requireCjs(p);
        if (httpAdapter) {
          axios.defaults.adapter = httpAdapter;
          break;
        }
      } catch (e) {
        // try next
      }
    }
      // Also set a deterministic baseURL for axios in tests so Node's
      // http adapter resolves to localhost instead of ::1 which helps
      // msw match handlers reliably across environments.
      try {
        if (axios && (!axios.defaults || !axios.defaults.baseURL)) {
          axios.defaults.baseURL = 'http://localhost';
        }
      } catch (e) {}
  } catch (e) {
    // ignore when axios or module isn't resolvable in this environment
  }
} catch (e) {}

// Extend expect with DOM matchers from jest-dom for better assertions
try {
  // Use dynamic import so this setup file remains ESM-friendly for Vitest
  try {
    const matchersMod = await import('@testing-library/jest-dom');
    const matchers = matchersMod && (matchersMod.default || matchersMod);
    if (matchers && typeof matchers.extendExpect === 'function') {
      matchers.extendExpect(expect);
    }
  } catch (err) {
    // ignore if jest-dom can't be imported in this environment
  }
} catch (e) {
  // If jest-dom isn't available, tests using DOM matchers will fail explicitly.


// Fix for matchMedia not available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Stub canvas.getContext so axe-core doesn't throw during accessibility checks
try {
  // Some jsdom versions have getContext implemented but it throws 'Not implemented'.
  // Override unconditionally to return null safely so axe can inspect styles/colors
  if (typeof HTMLCanvasElement !== 'undefined') {
    try {
      HTMLCanvasElement.prototype.getContext = function () { return null; };
    } catch (e) {
      // ignore if environment prevents assignment
    }
  }
} catch (e) {}

// Mock for IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  // Helper to simulate an intersection
  simulateIntersection(isIntersecting) {
    this.callback([{ isIntersecting }], this);
  }
}

// Apply IntersectionObserver mock
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Helper for local storage mock
const localStorageMock = (() => {
  let store = {};
  

                }
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
} catch (e) {}

// Strong per-test cleanup: run RTL cleanup and clear document.body to remove
// any leaked portal nodes, toast DOM, or other side-effects. This is more
// aggressive but increases test isolation significantly.
try {
  const rtl = await import('@testing-library/react').catch(() => null);
  try {
    afterEach(() => {
      try { if (rtl && typeof rtl.cleanup === 'function') rtl.cleanup(); } catch (e) {}
      try { document.querySelectorAll('[data-testid="toast"], .toast, [data-testid="invoked-user"], [data-portal]').forEach(n => n.remove()); } catch (e) {}
      try { document.body.innerHTML = ''; } catch (e) {}
      try { if (typeof vi !== 'undefined' && vi.useRealTimers) vi.useRealTimers(); } catch (e) {}
      try { if (typeof vi !== 'undefined' && vi.restoreAllMocks) vi.restoreAllMocks(); } catch (e) {}
    });
  } catch (e) {}
try {
  const hasLocalStorage = typeof window.localStorage !== 'undefined' && typeof window.localStorage.getItem === 'function';
  if (!hasLocalStorage) {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });
  } else {
    Object.defineProperty(window, '__originalLocalStorage', { value: window.localStorage, configurable: true });
  }
} catch (e) {
  // ignore environments that prevent property definitions on window
}

// Mock sessionStorage too (only if missing)
const sessionStorageMock = (() => {
  let store = {};
  
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

try {
  const hasSessionStorage = typeof window.sessionStorage !== 'undefined' && typeof window.sessionStorage.getItem === 'function';
  if (!hasSessionStorage) {
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, configurable: true, writable: true });
  } else {
    Object.defineProperty(window, '__originalSessionStorage', { value: window.sessionStorage, configurable: true });
  }
} catch (e) {
  // ignore environments that prevent property definitions on window
}

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Apply ResizeObserver mock
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Add simple mock for navigator
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    serviceWorker: {
      register: vi.fn().mockResolvedValue({}),
      getRegistrations: vi.fn().mockResolvedValue([]),
      ready: Promise.resolve({
        unregister: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true)
      })
    },
    clipboard: {
      writeText: vi.fn().mockResolvedValue(true)
    }
  },
  writable: true
});

// Provide a minimal `jest` compatibility shim for tests that use a subset of
// the jest.* APIs. We don't attempt to fully emulate jest; supply the
// common helpers used across the codebase.
try {
  if (!global.jest) {
    global.jest = {
      mock: vi.mock.bind(vi),
      fn: vi.fn.bind(vi),
      spyOn: vi.spyOn.bind(vi),
      resetAllMocks: () => vi.resetAllMocks(),
      clearAllMocks: () => vi.clearAllMocks(),
    };
  }
} catch (e) {
  // If the environment doesn't allow assigning to global.jest, tests
  // that rely on `jest` should import `vi` directly. This fallback keeps
  // setup from throwing in restricted environments.
}

// Ensure crypto.randomUUID exists and is configurable in environment
try {
  const hasCrypto = typeof global.crypto !== 'undefined' && typeof global.crypto.randomUUID === 'function';
  if (!hasCrypto) {
    if (typeof global.crypto === 'object' && global.crypto !== null) {
      if (!global.crypto.randomUUID) global.crypto.randomUUID = () => 'test-uuid-root';
    } else {
      try {
        Object.defineProperty(global, 'crypto', {
          value: { randomUUID: () => 'test-uuid-root' },
          configurable: true,
        });
      } catch (err) {
        Object.defineProperty(global, '__test_crypto_fallback', {
          value: { randomUUID: () => 'test-uuid-root' },
          configurable: true,
        });
      }
    }
  }
} catch (e) {
  // ignore if environment prevents defining crypto
}

// Additional hardening and test environment defaults
try {
  // Ensure localStorage is configurable so tests can restore/delete it safely
  try {
    if (typeof window.localStorage !== 'undefined') {
      const desc = Object.getOwnPropertyDescriptor(window, 'localStorage');
      if (!desc || !desc.configurable) {
        const orig = window.localStorage;
        try { Object.defineProperty(window, 'localStorage', { configurable: true, writable: true, value: orig }); } catch (e) {}
      }
    }


  // Make global.crypto writable/configurable to allow assignment in tests
  try {
    if (typeof global.crypto !== 'undefined') {
      const desc = Object.getOwnPropertyDescriptor(global, 'crypto');
      if (!desc || !desc.writable || !desc.configurable) {
        const orig = global.crypto;
        try { Object.defineProperty(global, 'crypto', { value: orig, writable: true, configurable: true }); } catch (e) {}
      }
    }


  // Provide deterministic environment values for analytics/tests
  try { Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 Test UserAgent', configurable: true }); } catch (e) {}
  try { global.innerWidth = 1920; global.innerHeight = 1080; } catch (e) {}
  try { if (window.localStorage && window.localStorage.setItem) window.localStorage.setItem('token', 'test-token-0001'); } catch (e) {}

  // Try to disable unknown axe rule gracefully if axe-core is present
  try {
    // eslint-disable-next-line global-require
    const axe = require('axe-core');
    if (axe && typeof axe.configure === 'function') {
      try { axe.configure({ rules: [{ id: 'aria-alert', enabled: false }] }); } catch (err) {}
    }

} catch (e) {}

// Expose React as a global to support test files that use JSX without an
// explicit `import React from 'react'`. Some test files rely on the older
// JSX transform and Vitest may not inject React automatically in all paths.
try {
  // dynamic import keeps this file ESM-friendly
  const reactMod = await import('react');
  const React = reactMod && (reactMod.default || reactMod);
  if (React && !global.React) {
    // Make available as a global for test files
    try { Object.defineProperty(global, 'React', { value: React, configurable: true }); } catch (e) { global.React = React; }
  }
} catch (e) {
  // ignore if react can't be imported in this environment
}

// Install the websocket test shim globally so tests that import the
// production path receive the deterministic ESM shim. This keeps tests
// deterministic and avoids needing manual per-file mocks.
try {
  // path is relative to the repository root where vitest runs
  await import('./frontend/src/test-utils/mockWebsocketShim.js');
} catch (e) {
  // ignore if the helper isn't present in certain environments
}


// Provide a global mock for ThemeContext to fix getEffectiveTheme error
try {
  vi.mock('./frontend/src/contexts/ThemeContext', () => ({
    usePreferences: () => ({
      preferences: {},
      setPreference: vi.fn(),
      getEffectiveTheme: vi.fn(() => 'light'),
    }),
    ThemeProvider: ({ children }) => children,
  }));
} catch (e) {}

// --- Unified deterministic i18n mock ---
try {
  const enMod = await import('./frontend/src/i18n/locales/en.json').catch(() => ({}));
  const translations = (enMod && (enMod.default || enMod)) || {};

// --- Unified deterministic i18n mock (always in scope) ---
const changeLanguageMock = vi.fn(() => Promise.resolve());
const fallbackText = (key) => {
  if (!key) return '';
  const parts = key.split(/[._ ]+/).filter(Boolean);
  return parts.map(
    part => part
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^([a-zA-Z])/, (l) => l.toUpperCase())
  ).join(' ').trim();
};
const resolveKey = (key, opts) => {
  if (!key) return '';
  const parts = key.split('.');
  let cur = typeof translations !== 'undefined' ? translations : undefined;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      cur = undefined;
      break;
    }
  }
  if (typeof cur === 'string') {
    let resolvedString = cur;
    if (opts && typeof opts === 'object') {
      for (const [k, v] of Object.entries(opts)) {
        resolvedString = resolvedString.replace(`{{${k}}}`, String(v));
      }
    }
    if (!resolvedString.trim() || resolvedString === key) {
      return fallbackText(key);
    }
    return resolvedString;
  }
  return fallbackText(key);
};
const t = (key, opts) => resolveKey(key, opts);
const i18nUnified = {
  changeLanguage: changeLanguageMock,
  addResourceBundle: vi.fn(),
  language: 'en',
  t,
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: i18nUnified.t,
    i18n: i18nUnified,
  }),
  I18nextProvider: ({ children }) => children,
  Trans: ({ children }) => children,
  _changeLanguageMock: changeLanguageMock,
}));
vi.mock('./frontend/src/hooks/useSafeTranslation', () => ({
  __esModule: true,
  default: () => ({ t: i18nUnified.t })
}));
vi.mock('./frontend/src/i18n/i18n', () => ({
  default: i18nUnified
}));

// Start MSW server from our project's mocks so all tests and server.use
// calls share a single running server instance. This prevents ECONNREFUSED
// fallthroughs where tests call server.use on a different instance.
try {
  const mswServerMod = await import('./frontend/src/mocks/server.js');
  const mswServer = mswServerMod && (mswServerMod.server || mswServerMod.default || mswServerMod);
  if (mswServer && typeof mswServer.listen === 'function') {
    // Keep warnings for unhandled requests but don't fail tests
    mswServer.listen({ onUnhandledRequest: 'warn' });
    // Reset handlers between tests and close after all tests
    try { afterEach(() => {
      if (typeof mswServer?.restoreHandlers === 'function') mswServer.restoreHandlers();
    }); } catch (e) {}
    try { afterAll(() => mswServer.close()); } catch (e) {}
  }
} catch (e) {
  // ignore if msw server module isn't available in some environments
}

// Additional precaution: create the real msw server early using handlers
// if a real server hasn't been attached yet. Some test paths import the
// proxy first which can race with the dynamic initialization; this block
// ensures a concrete server exists on globalThis before tests run.
try {
  if (!(typeof globalThis !== 'undefined' && globalThis.__MSW_SERVER__)) {
    const handlersMod = await import('./frontend/src/mocks/handlers.js');
    const handlers = handlersMod && (handlersMod.handlers || (handlersMod.default && handlersMod.default.handlers)) || [];
    if (handlers && handlers.length > 0) {
      try {
        const mswNode = await import('msw/node');
        if (mswNode && typeof mswNode.setupServer === 'function') {
          const realServer = mswNode.setupServer(...handlers);
          realServer.listen({ onUnhandledRequest: 'warn' });
          // attach real server so server proxy picks it up synchronously
          try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: realServer, configurable: true }); } catch (e) { globalThis.__MSW_SERVER__ = realServer; }
          try { afterEach(() => {
            if (typeof realServer?.restoreHandlers === 'function') realServer.restoreHandlers();
          }); } catch (e) {}
          try { afterAll(() => realServer.close()); } catch (e) {}
          // diagnostic
      try { if ((typeof globalThis !== 'undefined' && !!globalThis.__MSW_DEBUG__) || (typeof process !== 'undefined' && process.env && !!process.env.MSW_DEBUG)) console.log('MSW: real server created early in vitest.setup'); } catch (e) {}
        }
      } catch (e) {
        // ignore failures; fallback proxy may still initialize later
      }
    }
  }
} catch (e) {}

// Provide a lightweight MockWebSocket implementation (vi.fn constructor)
// so tests can assert on constructor calls and instances via .mock.
try {
  class MockWebSocketImpl {
    constructor(url) {
      this.url = url;
      this.CONNECTING = 0;
      this.OPEN = 1;
      this.CLOSING = 2;
      this.CLOSED = 3;
      this.readyState = this.CONNECTING;
      this.sentMessages = [];
      this.eventListeners = {};

      // simulate open on next tick
      setTimeout(() => {
        this.readyState = this.OPEN;
        const ev = { type: 'open' };
        try { if (typeof this.onopen === 'function') this.onopen(ev); } catch (e) {}
        if (this.eventListeners.open) this.eventListeners.open.forEach(fn => { try { fn(ev); } catch (e) {} });
      }, 0);
    }

    send(data) {
      // record sent messages for assertions
      this.sentMessages.push(data);
      // also expose to static store for legacy tests
      MockWebSocketImpl.sentMessages.push(data);
    }

    close() {
      this.readyState = this.CLOSING;
      setTimeout(() => {
        this.readyState = this.CLOSED;
        const ev = { code: 1000, reason: 'closed', wasClean: true };
        try { if (typeof this.onclose === 'function') this.onclose(ev); } catch (e) {}
        if (this.eventListeners.close) this.eventListeners.close.forEach(fn => { try { fn(ev); } catch (e) {} });
      }, 0);
    }

    addEventListener(type, listener) {
      this.eventListeners[type] = this.eventListeners[type] || [];
      this.eventListeners[type].push(listener);
    }

    removeEventListener(type, listener) {
      if (!this.eventListeners[type]) return;
      this.eventListeners[type] = this.eventListeners[type].filter(fn => fn !== listener);
    }

    // helper for tests to simulate an incoming message
    simulateMessage(data) {
      const ev = { data };
      if (this.eventListeners.message) this.eventListeners.message.forEach(fn => { try { fn(ev); } catch (e) {} });
      try { if (typeof this.onmessage === 'function') this.onmessage(ev); } catch (e) {}
    }
  }

  // static store for convenience
  MockWebSocketImpl.sentMessages = [];

  // Create a vi.fn constructor that returns a MockWebSocketImpl instance
  try {
    const MockWebSocket = vi.fn().mockImplementation(function (url) {
      // allow usage both with and without `new`
      const inst = new MockWebSocketImpl(url);
      return inst;
    });

    // mirror static array for tests that reference MockWebSocket.sentMessages
    MockWebSocket.sentMessages = MockWebSocketImpl.sentMessages;

    // Define on global in a configurable/writable way to avoid read-only errors
    try {
      Object.defineProperty(global, 'WebSocket', { value: MockWebSocket, configurable: true, writable: true });
    } catch (e) {
      // fallback: assign directly if defineProperty fails
      global.WebSocket = MockWebSocket;
    }

    // also expose the implementation and constructor under globals for tests
    global.MockWebSocket = MockWebSocket;
    global.__MockWebSocketImpl = MockWebSocketImpl;
  } catch (e) {
    // if vi isn't available here, skip installing the mock
  }
} catch (e) {}

// Initialize i18n once for the test environment to avoid duplicate imports
// and potential module re-load issues that can surface as internal assertion
// errors in Node/Vitest when modules are imported multiple times.
// --- Unified react-i18next mock (only one global mock) ---
// --- Self-Test: Verify i18n mock integration ---
try {
  const { useTranslation, I18nextProvider } = await import('react-i18next');
  const React = (await import('react')).default || (await import('react'));
  const { render } = await import('@testing-library/react');
  // 1. Direct hook usage
  const { t, i18n } = useTranslation();
  if (!i18n || typeof i18n.changeLanguage !== 'function' || !('mock' in i18n.changeLanguage)) {
    // eslint-disable-next-line no-console
    console.error('[VITEST SETUP SELF-TEST] useTranslation i18n.changeLanguage is NOT a vi.fn!');
  } else {
    // eslint-disable-next-line no-console
    console.log('[VITEST SETUP SELF-TEST] useTranslation i18n.changeLanguage is a vi.fn as expected.');
  }
  // 2. Context usage via I18nextProvider
  let contextI18n = null;
  function TestComponent() {
    const { i18n: ctxI18n } = useTranslation();
    contextI18n = ctxI18n;
    return React.createElement('div', null);
  }
  render(React.createElement(I18nextProvider, { i18n }, React.createElement(TestComponent)));
  if (!contextI18n || typeof contextI18n.changeLanguage !== 'function' || !('mock' in contextI18n.changeLanguage)) {
    // eslint-disable-next-line no-console
    console.error('[VITEST SETUP SELF-TEST] I18nextProvider context i18n.changeLanguage is NOT a vi.fn!');
  } else {
    // eslint-disable-next-line no-console
    console.log('[VITEST SETUP SELF-TEST] I18nextProvider context i18n.changeLanguage is a vi.fn as expected.');
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('[VITEST SETUP SELF-TEST] Exception during i18n mock verification:', e);
}
try {
  const enMod = await import('./frontend/src/i18n/locales/en.json').catch(() => ({}));
  const translations = (enMod && (enMod.default || enMod)) || {};
  const changeLanguageMock = vi.fn(() => Promise.resolve());
  const i18nUnified = {
    changeLanguage: changeLanguageMock,
    addResourceBundle: vi.fn(),
    language: 'en',
    t: (key, opts) => resolveKey(key, opts),
  };
  vi.mock('react-i18next', () => ({
    useTranslation: () => ({
      t: i18nUnified.t,
      i18n: i18nUnified,
    }),
    I18nextProvider: ({ children }) => children,
    Trans: ({ children }) => children,
    _changeLanguageMock: changeLanguageMock,
  }));
  vi.mock('./frontend/src/i18n/i18n', () => ({
    default: i18nUnified
  }));
} catch (e) {}

// Mark environment so MSW handlers can detect test mode and skip auth checks
try { if (typeof global !== 'undefined') global.__TEST__ = true; if (typeof globalThis !== 'undefined') globalThis.__TEST__ = true; } catch (e) {}

// Start MSW server for tests if available. Try several relative paths so tests
// work whether run from the repository root or from the `frontend/` folder.
try {
  // Candidate paths (checked in order)
  const candidates = [
    './frontend/src/mocks/server',
    './src/mocks/server',
    './mocks/server',
    '../src/mocks/server'
  ];

  let msw;
  for (const p of candidates) {
    try {
      // Try dynamic import first to stay ESM-friendly
      try {
        const imported = await import(p);
        msw = imported && (imported.default || imported);
        if (msw && msw.server) break;
      } catch (err) {
        // fall back to require-style resolution via createRequire if needed
        try {
          // eslint-disable-next-line global-require
          // Attempt to resolve via require for compatibility
          const createRequire = (await import('module')).createRequire;
          const req = createRequire(import.meta.url);
          msw = req(p);
          if (msw && msw.server) break;
        } catch (err2) {
          // ignore and try next candidate
        }
      }
    } catch (err) {
      // ignore and try next candidate
    }
  }

    if (msw && msw.server) {
    // Start server immediately to avoid race where modules perform network
    // requests during import before the test-runner's beforeAll runs.
    try {
      // Use 'warn' to surface unexpected requests but avoid hard failures
      // that can mask setup races. If another context already started the
      // server, this will be a no-op.
      if (!msw.server.listening) msw.server.listen({ onUnhandledRequest: 'warn' });
    } catch (e) {
      // ignore if server already started in another context
    }
    afterEach(() => {
      try { if (typeof msw?.server?.restoreHandlers === 'function') msw.server.restoreHandlers(); } catch (e) {}
    });
    afterAll(() => {
      try { msw.server.close(); } catch (e) {}
    });
  }
} catch (e) {
  // MSW not present; tests that rely on it should mock network calls explicitly
}

// Ensure tests don't leak DOM between runs. Some helpers (toast, test utils)
// append nodes to document.body which can cause subsequent tests to find
// duplicate elements. Install a global cleanup that runs afterEach test
// and removes commonly leaked nodes.
try {
  try {
    const rtl = await import('@testing-library/react');
    if (rtl && typeof rtl.cleanup === 'function') {
      try {
        afterEach(() => {
          try { rtl.cleanup(); } catch (e) {}
          try { document.querySelectorAll('[data-testid="toast"]').forEach(n => n.remove()); } catch (e) {}
          try { document.querySelectorAll('.toast').forEach(n => n.remove()); } catch (e) {}
          try { document.querySelectorAll('[data-testid="invoked-user"]').forEach(n => n.remove()); } catch (e) {}
          try { if (typeof vi !== 'undefined' && typeof vi.useRealTimers === 'function') vi.useRealTimers(); } catch (e) {}
          try { if (typeof vi !== 'undefined' && typeof vi.restoreAllMocks === 'function') vi.restoreAllMocks(); } catch (e) {}
        });
      } catch (e) {}
    }

} catch (e) {}

// Lightweight stabilizers appended: ensure fetch/axios are test-friendly,
// remove leaked DOM nodes before each test, and provide a temporary
// axe-core.run mock to avoid parallel axe races while we stabilize tests.
try {
  // Prefer node-fetch as global.fetch so msw/node intercepts work reliably
  try {
    const { createRequire } = await import('module');
    const req = createRequire(import.meta.url);
    try {
      const nodeFetch = req('node-fetch');
      if (nodeFetch && typeof globalThis.fetch === 'undefined') {
        // CJS node-fetch exports a function directly in many versions
        try { globalThis.fetch = (...args) => (typeof nodeFetch === 'function' ? nodeFetch(...args) : nodeFetch.default(...args)); } catch (e) { /* ignore */ }
      }


    // Ensure axios uses the Node http adapter and has a deterministic baseURL
    try {
      const axios = req('axios');
      if (axios) {
        try {
          const httpAdapter = req('axios/lib/adapters/http');
          if (httpAdapter) axios.defaults.adapter = httpAdapter;
        } catch (e) {}
        try { if (!axios.defaults || !axios.defaults.baseURL) axios.defaults.baseURL = 'http://localhost'; } catch (e) {}
      }


  // Remove common leaked nodes before each test to avoid duplicate-element queries
  try {
    beforeEach(() => {
      try { document.querySelectorAll('[data-testid="toast"], .toast, [data-testid="invoked-user"], [data-portal]').forEach(n => n.remove()); } catch (e) {}
    });


  // (Removed temporary axe stubs) — axe.run will run normally; a11y tests should
  // use the serialized enqueueAxe helper to avoid concurrency issues.

} catch (e) {}

// --- More aggressive stabilizers (MSW sync start, strict cleanup, axe mock) ---
try {
  // Start a real msw/node server synchronously if one isn't already attached.
  try {
    if (typeof globalThis !== 'undefined' && !globalThis.__MSW_SERVER__) {
      try {
        const handlersModule = await import('./frontend/src/mocks/handlers.js').catch(() => null);
        const handlers = (handlersModule && (handlersModule.handlers || (handlersModule.default && handlersModule.default.handlers))) || [];
        if (handlers && handlers.length > 0) {
          const mswNode = await import('msw/node').catch(() => null);
          if (mswNode && typeof mswNode.setupServer === 'function') {
                  const _server = mswNode.setupServer(...handlers);
                  try { if (!(_server && _server.listening)) _server.listen({ onUnhandledRequest: 'warn' }); } catch (e) {}
                  try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: _server, configurable: true }); } catch (e) { globalThis.__MSW_SERVER__ = _server; }
                  try { afterEach(() => { try { if (typeof _server?.restoreHandlers === 'function') _server.restoreHandlers(); } catch (e) {} }); } catch (e) {}
                  try { afterAll(() => { try { _server.close(); } catch (e) {} }); } catch (e) {}
                  try { if ((typeof globalThis !== 'undefined' && !!globalThis.__MSW_DEBUG__) || (typeof process !== 'undefined' && process.env && !!process.env.MSW_DEBUG)) console.log('MSW: synchronous server created in vitest.setup (aggressive)'); } catch (e) {}
                }
        }
      } catch (e) {}
    }



  // Strong per-test cleanup: run RTL cleanup and clear document.body to remove
  // any leaked portal nodes, toast DOM, or other side-effects. This is more
  // aggressive but increases test isolation significantly.
  try {
    const rtl = await import('@testing-library/react').catch(() => null);
    try {
      afterEach(() => {
        try { if (rtl && typeof rtl.cleanup === 'function') rtl.cleanup(); } catch (e) {}
        try { document.querySelectorAll('[data-testid="toast"], .toast, [data-testid="invoked-user"], [data-portal]').forEach(n => n.remove()); } catch (e) {}
        try { document.body.innerHTML = ''; } catch (e) {}
        try { if (typeof vi !== 'undefined' && vi.useRealTimers) vi.useRealTimers(); } catch (e) {}
        try { if (typeof vi !== 'undefined' && vi.restoreAllMocks) vi.restoreAllMocks(); } catch (e) {}
      });
    }
  } catch (e) {}

// --- Explicit MSW lifecycle hooks and RTL cleanup ---
try {
  // Import the compiled server proxy which picks up any global real server
  // created earlier in this file or creates a proxy that will attach later.
  try {
    const { server } = await import('./frontend/src/mocks/server.js');

    // Start the server early if it's not already running. Use 'error' to
    // force tests to fail loudly when an unexpected network request occurs
    // instead of silently allowing network access.
    try {
      beforeAll(async () => {
        try {
          if (server.ready) await server.ready;
        } catch (e) {
          console.error('[MSW] Server init failed:', e);
        }
        try { server.listen({ onUnhandledRequest: 'error' }); } catch (e) { /* ignore */ }
      });
    } catch (e) {}

    // Clear DOM between tests to avoid leakage.
    try {
      beforeEach(() => {
        // Don't reset handlers! Just clean DOM
        try { document.body.innerHTML = ''; } catch (e) {}
      });
    } catch (e) {}

    try {
      afterAll(() => {
        try { server.close(); } catch (e) {}
      });
    } catch (e) {}
  } catch (e) {}

  // Ensure react-testing-library cleanup runs after each test
  try {
    const { cleanup } = await import('@testing-library/react');
    try { afterEach(() => { try { cleanup(); } catch (e) {} }); } catch (e) {}
  } catch (e) {}
