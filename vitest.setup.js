// vitest.setup.js - A setup file that doesn't rely on external dependencies
import { vi, expect } from 'vitest';

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
}

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

// Apply localStorage mock only when missing. Some test environments already
// provide working localStorage; avoid overwriting it to prevent TypeErrors
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
  } catch (e) {}

  // Make global.crypto writable/configurable to allow assignment in tests
  try {
    if (typeof global.crypto !== 'undefined') {
      const desc = Object.getOwnPropertyDescriptor(global, 'crypto');
      if (!desc || !desc.writable || !desc.configurable) {
        const orig = global.crypto;
        try { Object.defineProperty(global, 'crypto', { value: orig, writable: true, configurable: true }); } catch (e) {}
      }
    }
  } catch (e) {}

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

// Provide a global mock for react-i18next using our test-utils helper so
// tests that don't explicitly mock react-i18next still receive stable
// translations. This reduces raw key rendering and makes assertions
// tolerant of i18n in many tests.
try {
  const testUtils = await import('./frontend/src/test-utils.jsx');
  if (testUtils && typeof testUtils.setupI18nMock === 'function') {
    // Attach a global module mock for react-i18next so imports resolve
    // to our factory when tests run without per-file mocks.
    try {
      // eslint-disable-next-line no-undef
      vi.mock('react-i18next', () => testUtils.setupI18nMock());
    } catch (e) {
      // If vi is not available in this context, skip
    }
  }
} catch (e) {}

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
    try { afterEach(() => mswServer.resetHandlers()); } catch (e) {}
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
          try { afterEach(() => realServer.resetHandlers()); } catch (e) {}
          try { afterAll(() => realServer.close()); } catch (e) {}
          // diagnostic
          try { console.log('MSW: real server created early in vitest.setup'); } catch (e) {}
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
try {
  // prefer the frontend i18n entry
  try {
    // Before importing the full i18n initializer, install a safe mock for
    // `react-i18next` so tests that don't wrap components with an
    // I18nextProvider still render readable English strings instead of
    // raw translation keys. We prefer reading the project's English
    // translations file so fallbacks match the app.
    try {
      const enMod = await import('./frontend/src/i18n/locales/en.json');
      const en = enMod && (enMod.default || enMod);
      const resolveKey = (obj, key) => {
        if (!key) return key;
        const parts = key.split('.');
        let cur = obj;
        for (const p of parts) {
          if (!cur) return undefined;
          cur = cur[p];
        }
        return cur;
      };

      // Install the mock only if vitest's vi is available. Inline the
      // resolution logic so it doesn't rely on outer-scope helpers that
      // may not be visible when the mock factory runs in another context.
      try {
        // Mock react-i18next using an async factory that imports the
        // project's English JSON inside the factory so it remains self-
        // contained and doesn't rely on outer-scope variables (vitest
        // hoists mock factories).
        vi.mock('react-i18next', async () => {
          const ReactLocal = await import('react').catch(() => null);
          const enMod = await import('./frontend/src/i18n/locales/en.json').catch(() => ({}));
          const translations = (enMod && (enMod.default || enMod)) || {};

          const resolveKeyFallback = (k) => {
            try {
              if (!k || typeof k !== 'string') return '';
              const parts = k.split('.');
              let cur = translations;
              for (const p of parts) {
                if (!cur) { cur = undefined; break; }
                cur = cur[p];
              }
              if (typeof cur === 'string') return cur;
              // If the resolved value is an object (common for grouped
              // translations like 'points'), return a safe string fallback
              // (the last key segment) instead of returning the object which
              // would cause React to try rendering an object as a child.
              const last = k.split('.').slice(-1)[0];
              const lastVal = translations && translations[last];
              if (typeof lastVal === 'string') return lastVal;
              return last || k;
            } catch (err) { return k; }
          };

          if (ReactLocal && ReactLocal.createContext) {
            const I18nContext = ReactLocal.createContext(null);
            const I18nextProvider = ({ i18n, children }) => ReactLocal.createElement(I18nContext.Provider, { value: i18n }, children);
            const useTranslation = () => {
              const ctx = ReactLocal.useContext ? ReactLocal.useContext(I18nContext) : null;
              if (ctx && typeof ctx.t === 'function') return { t: (k, opts) => ctx.t(k, opts), i18n: ctx };
              return { t: (k, opts) => {
                const raw = resolveKeyFallback(k);
                if (!opts || typeof opts !== 'object') return raw;
                return raw.replace(/{{\s*(\w+)\s*}}/g, (_, name) => (opts[name] != null ? String(opts[name]) : ''));
              }, i18n: { language: 'en', changeLanguage: async () => {} } };
            };
            return { useTranslation, I18nextProvider, initReactI18next: { init: () => {} } };
          }

          return {
            useTranslation: () => ({ t: (k, opts) => {
              const raw = resolveKeyFallback(k);
              if (!opts || typeof opts !== 'object') return raw;
              return raw.replace(/{{\s*(\w+)\s*}}/g, (_, name) => (opts[name] != null ? String(opts[name]) : ''));
            }, i18n: { language: 'en', changeLanguage: async () => {} } }),
            I18nextProvider: ({ children }) => children,
            initReactI18next: { init: () => {} }
          };
        });
      } catch (e) {
        // if vi or react can't be imported here, ignore and continue
      }
      // Also mock the app's i18n initializer module so tests that import
      // the real `i18n` module receive a simple translator that resolves
      // keys from the English JSON. This prevents raw keys appearing in
      // tests that import the initializer directly.
      try {
        const makeI18nMock = () => {
          const translations = en || {};
          const resolve = (key) => {
            try {
              if (!key || typeof key !== 'string') return key;
              const parts = key.split('.');
              let cur = translations;
              for (const p of parts) {
                if (!cur) { cur = undefined; break; }
                cur = cur[p];
              }
              if (typeof cur === 'string') return cur;
              const last = key.split('.').slice(-1)[0];
              return (translations && translations[last]) || last || key;
            } catch (err) {
              return key;
            }
          };

          return { default: { t: resolve, language: 'en' } };
        };
        try {
          // Mock the app initializer module via an async factory to avoid
          // hoisting issues and to use the en.json content directly.
          vi.mock('./frontend/src/i18n/i18n', async () => {
            const enMod = await import('./frontend/src/i18n/locales/en.json').catch(() => ({}));
            const translations = (enMod && (enMod.default || enMod)) || {};
            const resolve = (k) => {
              try {
                if (!k || typeof k !== 'string') return k;
                const parts = k.split('.');
                let cur = translations;
                for (const p of parts) {
                  if (!cur) { cur = undefined; break; }
                  cur = cur[p];
                }
                if (typeof cur === 'string') return cur;
                const last = k.split('.').slice(-1)[0];
                const lastVal = translations && translations[last];
                if (typeof lastVal === 'string') return lastVal;
                return last || k;
              } catch (err) { return k; }
            };
            return { default: { t: resolve, language: 'en' } };
          });
        } catch (e) {
          // ignore if module resolution differs in some environments
        }
      } catch (e) {
        // ignore errors constructing the app i18n mock
      }
    } catch (e) {
      // ignore errors reading en.json; fall back to importing real initializer
    }
    // Do not import the full app i18n initializer here: several tests
    // and environments prefer the lightweight mock above. Importing the
    // real initializer can cause plugin/type errors during test setup.
  } catch (e) {
    // fall back to other likely paths
    try { await import('./src/i18n.js'); } catch (e2) {}
  }
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
      msw.server.listen({ onUnhandledRequest: 'bypass' });
    } catch (e) {
      // ignore if server already started in another context
    }
    afterEach(() => msw.server.resetHandlers());
    afterAll(() => msw.server.close());
  }
} catch (e) {
  // MSW not present; tests that rely on it should mock network calls explicitly
}