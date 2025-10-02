/* eslint-env vitest */
// @ts-nocheck - keep this file free of TypeScript complaints during test runs
// Minimal Vitest setup bootstrap for the frontend tests.
// Purpose: keep this file small and valid so Vite's import-analysis can run.
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import React from 'react';

// Robust wrapper for EventTarget.addEventListener: try calling the original
// implementation with the provided options; if jsdom throws the specific
// TypeError about AddEventListenerOptions.signal being invalid, retry by
// calling the original with the same options but without the `signal` key.
try {
  const orig = (EventTarget && EventTarget.prototype && EventTarget.prototype.addEventListener) || null;
  if (orig) {
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      try {
        // First attempt: call original with provided options
        return orig.call(this, type, listener, options);
      } catch (err) {
        try {
          const msg = err && (err.message || (err.reason && err.reason.message) || String(err));
          if (msg && String(msg).includes("parameter 3 dictionary has member 'signal'")) {
            // Clone options without `signal` and retry
            try {
              if (options && typeof options === 'object') {
                const { signal, ...rest } = options;
                return orig.call(this, type, listener, rest);
              }
            } catch (e2) {
              // If cloning/options manipulation fails, fall through to rethrow
            }
          }
        } catch (e3) {}
        // If it's a different error or sanitized retry failed, rethrow to surface real issues
        throw err;
      }
    };
  }
} catch (e) { /* best-effort; ignore if environment doesn't support EventTarget */ }

// Provide a small compatibility shim: some tests (or older Jest-based suites)
// call `vi.unstubAllGlobals()` which isn't present in older Vitest versions.
// Map it to `vi.restoreAllMocks()` when possible or a no-op otherwise.
try {
  if (typeof vi !== 'undefined' && !vi.unstubAllGlobals) {
    vi.unstubAllGlobals = vi.restoreAllMocks ? vi.restoreAllMocks : (() => {});
  }
} catch (e) {}

// Make React available globally so tests that use JSX without an explicit
// `import React from 'react'` continue to work in this environment.
// Be defensive: some bundlers or module shapes provide a { default: React }
// object when imported via CJS interop. Normalize to the actual runtime
// React object and ensure hooks exist to avoid "reading 'useEffect' of null".
try {
  const RealReact = (React && React.default) ? React.default : React;
  if (!RealReact || typeof RealReact.useEffect !== 'function') {
    // Try resolving via requireCjs if available to handle CJS environments
    try {
      const maybe = createRequire && createRequire(process.cwd())('react');
      const resolved = (maybe && maybe.default) ? maybe.default : maybe;
      globalThis.React = resolved || RealReact || React;
    } catch (e) {
      globalThis.React = RealReact || React;
    }
  } else {
    globalThis.React = RealReact;
  }
} catch (e) {
  try { globalThis.React = React; } catch (er) { /* best effort */ }
}

// Quiet common React testing noise that currently floods Vitest output
// during the migration to React 18. We only suppress very specific
// known messages so genuine errors still surface. Keep this small and
// targeted to avoid hiding real test failures.
try {
  const _consoleError = console.error.bind(console);
  console.error = (...args) => {
    try {
      const text = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ');
      // messages we intentionally silence in test runs
      const suppressPatterns = [
        'not wrapped in act(', // React state updates not wrapped in act
        'ReactDOM.render is no longer supported', // React 18 createRoot deprecation
        'ReactDOMTestUtils.act is deprecated', // deprecation noise from older helpers
        "parameter 3 dictionary has member 'signal'", // jsdom AddEventListenerOptions.signal noise
        'React does not recognize the `isLoading` prop', // noisy prop passthrough warnings
      ];
      for (const p of suppressPatterns) {
        if (text.includes(p)) return;
      }
    } catch (e) {
      // fall through to original logger
    }
    _consoleError(...args);
  };

  const _consoleWarn = console.warn.bind(console);
  console.warn = (...args) => {
    try {
      const text = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ');
      // suppress router/feature flag warnings and React deprecation/act
      // warnings that currently flood test output.
      const warnSuppress = [
        'React Router Future Flag Warning',
        'ReactDOMTestUtils.act is deprecated',
        'ReactDOM.render is no longer supported',
        'unmountComponentAtNode is deprecated',
        'not wrapped in act('
      ];
      for (const p of warnSuppress) if (text.includes(p)) return;
    } catch (e) {}
    _consoleWarn(...args);
  };
} catch (e) {}

// Create a require() compatible with ESM execution. Use a stable filename
// based on the workspace package.json to avoid using import.meta.url which
// may trigger TS/lint issues in some environments.
const requireCjs = createRequire(path.resolve(process.cwd(), 'package.json'));

// Compatibility shim: map react-dom/test-utils.act to React.act when possible
// This avoids noisy deprecation warnings from tests that import the old API.
try {
  try {
    const reactDomTestUtils = requireCjs('react-dom/test-utils');
    if (reactDomTestUtils && typeof reactDomTestUtils.act === 'function' && globalThis.React && typeof globalThis.React.act === 'function') {
      reactDomTestUtils.act = globalThis.React.act;
    }
  } catch (e) {
    // ignore if module isn't available in this worker
  }
} catch (e) {}

// Try to initialize a lightweight i18n instance for tests using the
// project's English resources. This ensures translation keys are
// resolved to readable strings during unit tests and avoids flakes
// where components render translation keys instead of text.
try {
  let enJson = null;
  const candidates = [
    path.resolve(process.cwd(), 'frontend', 'src', 'i18n', 'locales', 'en.json'),
    path.resolve(process.cwd(), 'src', 'i18n', 'locales', 'en.json'),
    path.resolve(process.cwd(), '..', 'frontend', 'src', 'i18n', 'locales', 'en.json'),
  ];
  for (const p of candidates) {
    try { enJson = requireCjs(p); if (enJson) break; } catch (e) { enJson = null; }
  }
  try {
    const i18next = requireCjs('i18next');
    const { initReactI18next } = (function () {
      try {
        return requireCjs('react-i18next');
      } catch (e) {
        return { initReactI18next: null };
      }
    })();
    if (i18next && typeof i18next.init === 'function') {
      // If we found an English JSON file, use it; otherwise fall back to an
      // empty translation object so tests render readable strings.
      const resources = enJson ? { en: { translation: enJson } } : { en: { translation: {} } };
      try {
        if (initReactI18next) i18next.use(initReactI18next);
      } catch (e) {}
      try {
        // Avoid re-initializing if already initialized in another worker
        if (!i18next.isInitialized) {
          i18next.init({ lng: 'en', resources, fallbackLng: 'en', interpolation: { escapeValue: false } });
        }
      } catch (e) {
        // if init fails, try a safe re-init call without plugins
        try { i18next.init({ lng: 'en', resources, fallbackLng: 'en' }); } catch (er) {}
      }
      if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = i18next;
    }
  } catch (err) {
    // ignore if i18next isn't installed in this environment
  }
} catch (e) {}

// Start MSW server synchronously (CJS) so it runs in the same Vitest worker.
let server = null;
// Signal to handlers that we're running in a test environment so they can
// bypass Authorization header checks where appropriate. Set the flag on
// multiple global objects because handlers may check `global` or `globalThis`.
try {
  if (typeof globalThis !== 'undefined') globalThis.__TEST__ = true;
  if (typeof global !== 'undefined') global.__TEST__ = true;
  if (typeof window !== 'undefined') window.__TEST__ = true;
} catch (e) {}
// Ensure VITEST env flag is present early so helper modules can detect test env
try {
  if (typeof process !== 'undefined' && !process.env.VITEST) {
    process.env.VITEST = 'true';
  }
} catch (e) {}
// Ensure fetch uses a Node implementation (node-fetch) so msw/node can intercept
try {
  let nodeFetch = null;
  try { nodeFetch = requireCjs('node-fetch'); } catch (e) { nodeFetch = null; }
  if (nodeFetch && typeof globalThis !== 'undefined' && !globalThis.fetch) {
    // node-fetch exports a default in CJS builds; normalize to a callable
    // function signature expected by tests.
    // eslint-disable-next-line no-undef
    globalThis.fetch = (...args) => (typeof nodeFetch === 'function' ? nodeFetch(...args) : nodeFetch.default(...args));
  }
} catch (e) {
  // ignore if node-fetch isn't installed
}
try {
  // NOTE: we intentionally avoid creating a CJS msw/node server here.
  // The ESM server proxy (frontend/src/mocks/server.js) will initialize
  // msw via dynamic imports and expose a single server instance that the
  // tests and application code can share. Creating a synchronous CJS
  // server here can result in two msw instances (duplicate interception)
  // if msw is resolved differently by CJS vs ESM. To keep the environment
  // deterministic we use a noop server here and let the ESM proxy create
  // the real server.
  server = { listen: () => {}, use: () => {}, resetHandlers: () => {}, close: () => {} };
} catch (e) {
  // provide a no-op server to avoid null checks in tests
  server = { listen: () => {}, use: () => {}, resetHandlers: () => {}, close: () => {} };
}

// Try to set axios to the Node http adapter so msw/node can intercept requests
try {
  const axios = requireCjs('axios');
  let httpAdapter = null;
  try { httpAdapter = requireCjs('axios/lib/adapters/http'); } catch (e) { httpAdapter = null; }
  if (!httpAdapter) {
    // fallback to workspace node_modules path
    try { httpAdapter = requireCjs(path.resolve(process.cwd(), 'node_modules', 'axios', 'lib', 'adapters', 'http')); } catch (e) { httpAdapter = null; }
  }
  if (httpAdapter && axios) {
    axios.defaults.adapter = httpAdapter;
  }
} catch (e) {
  // ignore if axios isn't available in the test worker
}

// Lightweight polyfills commonly used in tests
try {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  });
} catch (e) {}

try { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; } catch (e) {}
try { global.IntersectionObserver = class { constructor(cb) { this.cb = cb } observe() {} unobserve() {} disconnect() {} }; } catch (e) {}

// Minimal HTMLCanvasElement.getContext shim used by axe/axe-core when
// running in jsdom. This quiets the "Not implemented: HTMLCanvasElement.prototype.getContext"
// errors and provides the minimal surface area axe expects.
try {
  if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = function getContext() {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      };
    };
  }
} catch (e) {}

try {
  if (typeof window.localStorage === 'undefined') {
    const store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      },
      configurable: true,
    });
  }
} catch (e) {}

// Global safety: some msw/WebSocket interceptor paths can produce a rejected
// promise with a jsdom TypeError about AddEventListenerOptions.signal not
// being an AbortSignal. Vitest treats unhandled rejections as failures.
// Install a targeted handler that swallows only that specific error so the
// test run can continue; other unhandled rejections are re-thrown so we
// don't hide genuine test issues.
try {
  const swallowSignalTypeError = (err) => {
    try {
      const msg = err && (err.message || (err.reason && err.reason.message) || String(err));
      if (!msg) return false;
      if (String(msg).includes("parameter 3 dictionary has member 'signal'")) return true;
      return false;
    } catch (e) { return false; }
  };
  // Node-level unhandled rejection: make unhandled rejections fail tests loudly
  if (typeof process !== 'undefined' && process && typeof process.on === 'function') {
    // Remove existing handlers to avoid double-handling in some worker setups
    try {
      process.removeAllListeners && process.removeAllListeners('unhandledRejection');
    } catch (e) {}
    process.on('unhandledRejection', (reason) => {
      try {
        // If the error is the specific jsdom signal TypeError, swallow it
        if (swallowSignalTypeError(reason)) return;
      } catch (e) {}
      // For all other unhandled rejections, rethrow synchronously so Vitest
      // surface them as test failures rather than silent warnings.
      // Log to stderr first to make CI logs clearer before process termination.
      try { console.error('[unhandledRejection] Rethrowing unexpected rejection:', reason); } catch (e) {}
      throw reason;
    });
  }
  // Browser-level unhandledrejection
  if (typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
    window.addEventListener('unhandledrejection', (ev) => {
      try {
        if (swallowSignalTypeError(ev.reason)) { ev.preventDefault(); }
      } catch (e) {}
    });
  }
} catch (e) {}

// Mocks to avoid DOM side-effects and noisy integrations
vi.mock('react-icons/bs', () => ({ BsBell: () => null, BsBellFill: () => null }));
// Provide a lightweight stub for i18next to avoid initializing the real
// i18next instance in test workers. Some test suites intentionally mock
// `react-i18next` but importing `i18next` directly can still create a
// full instance and cause module re-import races. The stub implements the
// minimal interface our app expects.
// NOTE: do not mock 'i18next' here. Tests and the i18n unit-suite expect
// the real i18next API (including createInstance). We provide a safer
// react-i18next wrapper lower in this file that falls back gracefully.
// Provide a consistent toast mock with a callable toast function that also
// exposes convenience methods like toast.success / toast.error. Some parts of
// the app call `toast('message')` while others call `toast.success(...)`.
vi.mock('react-toastify', () => {
  // A test-friendly toast mock that also renders a DOM node when called so
  // tests that assert on visible toast content can find it via DOM queries.
  const toastFn = (msg) => {
    try {
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'toast');
      el.setAttribute('role', 'alert');
      el.textContent = typeof msg === 'string' ? msg : (msg && msg.message) || String(msg);
      document.body.appendChild(el);
      // remove after a short delay to mimic autoClose behavior
      setTimeout(() => { try { el.remove(); } catch (e) {} }, 3000);
      return el;
    } catch (e) {
      return null;
    }
  };
  toastFn.success = (m) => toastFn(m);
  toastFn.error = (m) => toastFn(m);
  toastFn.info = (m) => toastFn(m);
  toastFn.warn = (m) => toastFn(m);
  return {
    __esModule: true,
    toast: toastFn,
    ToastContainer: ({ children }) => children || null,
    default: {},
  };
});

// NOTE: react-i18next is intentionally NOT mocked globally here. Many test
// suites provide their own local mocks or create fresh i18n instances via
// `i18next.createInstance()` for deterministic behavior. Keeping the
// global environment unmocked ensures those per-test patterns work as
// authors intended.

// NOTE: do NOT globally mock `react-router-dom` or `react-router` here.
// Tests should mount their own `MemoryRouter` / `BrowserRouter` and supply
// `initialEntries` when they need deterministic navigation. Global router
// mocks cause MemoryRouter-based navigation to be no-op and broke several
// tests earlier; keep router mocking local to test files only.

// Make global WebSocket writable/configurable so tests can assign mocks.
try {
  if (typeof globalThis !== 'undefined') {
    try {
      // If WebSocket exists as a non-writable property, redefine it to be writable.
      const desc = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
      if (desc && !desc.writable) {
        Object.defineProperty(globalThis, 'WebSocket', { value: desc.value, writable: true, configurable: true });
      } else if (!desc) {
        // Ensure a default (noop) WebSocket exists so tests can override it.
        // Provide a small NoopWebSocket class so tests can instantiate if needed.
        const NoopWebSocket = class {
          constructor() {}
          // Minimal instance methods used in tests
          close() {}
          send() {}
        };
        // Common readyState constants used by code/tests
        NoopWebSocket.CONNECTING = 0;
        NoopWebSocket.OPEN = 1;
        NoopWebSocket.CLOSING = 2;
        NoopWebSocket.CLOSED = 3;
        Object.defineProperty(globalThis, 'WebSocket', { value: NoopWebSocket, writable: true, configurable: true });
      }
    } catch (e) {
      // fallback assignment
      try {
        const NoopWebSocketFallback = globalThis.WebSocket || (class { constructor() {}; close() {}; send() {} });
        NoopWebSocketFallback.CONNECTING = NoopWebSocketFallback.CONNECTING || 0;
        NoopWebSocketFallback.OPEN = NoopWebSocketFallback.OPEN || 1;
        NoopWebSocketFallback.CLOSING = NoopWebSocketFallback.CLOSING || 2;
        NoopWebSocketFallback.CLOSED = NoopWebSocketFallback.CLOSED || 3;
        Object.defineProperty(globalThis, 'WebSocket', { value: NoopWebSocketFallback, writable: true, configurable: true });
      } catch (er) {}
    }
  }
} catch (e) {}

// Wrap the global WebSocket constructor so we can intercept per-instance
// addEventListener calls and strip non-AbortSignal `signal` options before
// jsdom validates AddEventListenerOptions. msw's WebSocket proxy sometimes
// passes a plain `{ signal }` object that isn't a real AbortSignal which
// causes jsdom to throw. Wrapping per-instance avoids touching jsdom internals
// and ensures our shim runs before the platform validation.
try {
  if (typeof globalThis !== 'undefined' && typeof globalThis.WebSocket === 'function') {
    const NativeWebSocket = globalThis.WebSocket;
    function WrappedWebSocket(...args) {
      // Create the real instance
      const instance = new NativeWebSocket(...args);
      try {
        const originalAdd = instance.addEventListener && instance.addEventListener.bind(instance);
        if (typeof originalAdd === 'function') {
          instance.addEventListener = function (type, listener, options) {
            try {
              if (options && typeof options === 'object' && Object.prototype.hasOwnProperty.call(options, 'signal')) {
                const sig = options.signal;
                const isAbort = (typeof AbortSignal !== 'undefined' && sig instanceof AbortSignal) || (sig && typeof sig === 'object' && typeof sig.aborted === 'boolean');
                if (!isAbort) {
                  const { signal, ...rest } = options;
                  return originalAdd(type, listener, rest);
                }
              }
            } catch (err) {
              // ignore and fall through to call original with original options
            }
            return originalAdd(type, listener, options);
          };
        }
      } catch (e) {
        // best-effort, if something fails keep the original instance
      }
      return instance;
    }
    // copy constants
    WrappedWebSocket.CONNECTING = NativeWebSocket.CONNECTING || 0;
    WrappedWebSocket.OPEN = NativeWebSocket.OPEN || 1;
    WrappedWebSocket.CLOSING = NativeWebSocket.CLOSING || 2;
    WrappedWebSocket.CLOSED = NativeWebSocket.CLOSED || 3;
    try {
      Object.defineProperty(globalThis, 'WebSocket', { value: WrappedWebSocket, writable: true, configurable: true });
    } catch (err) {
      // if defineProperty fails, fallback to assignment
      globalThis.WebSocket = WrappedWebSocket;
    }
  }
} catch (e) {}

// Additionally, patch the WebSocket prototype's addEventListener (if present)
// to pre-sanitize the options before jsdom's internal AddEventListenerOptions
// conversion runs. This prevents jsdom from throwing when libraries pass a
// plain `{ signal }` object that isn't an actual AbortSignal.
try {
  if (typeof globalThis !== 'undefined' && globalThis.WebSocket && globalThis.WebSocket.prototype) {
    const wsProto = globalThis.WebSocket.prototype;
    const origWsAdd = wsProto.addEventListener;
    if (typeof origWsAdd === 'function') {
      wsProto.addEventListener = function (type, listener, options) {
        try {
          if (options && typeof options === 'object' && Object.prototype.hasOwnProperty.call(options, 'signal')) {
            const sig = options.signal;
            const isAbort = (typeof AbortSignal !== 'undefined' && sig instanceof AbortSignal) || (sig && typeof sig === 'object' && typeof sig.aborted === 'boolean');
            if (!isAbort) {
              const { signal, ...rest } = options;
              return origWsAdd.call(this, type, listener, rest);
            }
          }
        } catch (err) {
          // ignore and fall through to call original
        }
        return origWsAdd.call(this, type, listener, options);
      };
    }
  }
} catch (e) {}

// Safety shim: jsdom strictly validates AddEventListenerOptions.signal to be
// an AbortSignal. Some libraries (msw interceptors / WebSocket proxy)
// pass objects that look like `{ signal }` but aren't actual AbortSignal
// instances in certain environments. That causes jsdom to throw during
// test initialization and results in unhandled rejections. Patch the
// EventTarget.prototype.addEventListener to silently drop malformed
// `signal` options so tests remain stable.
try {
  const origAddEventListener = (EventTarget && EventTarget.prototype && EventTarget.prototype.addEventListener) || null;
  if (origAddEventListener) {
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      try {
        if (options && typeof options === 'object' && Object.prototype.hasOwnProperty.call(options, 'signal')) {
          const sig = options.signal;
          // If AbortSignal exists, use instanceof check; otherwise do a best-effort
          const isAbort = (typeof AbortSignal !== 'undefined' && sig instanceof AbortSignal) || (sig && typeof sig === 'object' && typeof sig.aborted === 'boolean');
          if (!isAbort) {
            // clone options without signal
            const { signal, ...rest } = options;
            return origAddEventListener.call(this, type, listener, rest);
          }
        }
      } catch (e) {
        // swallow any errors and fall back to original call
      }
      return origAddEventListener.call(this, type, listener, options);
    };
  }
} catch (e) {}

// Provide a global test auth object that tests can override per-suite.
// Default test auth: provide an authenticated user by default so components
// that expect a logged-in user render in tests. Test suites may override
// this using `globalThis.setTestAuth()` in their beforeEach/afterEach.
// Provide both variants (`__TEST_AUTH__` and `__TEST_AUTH`) to support
// different conventions used across tests and helpers in the codebase.
const defaultTestAuth = { currentUser: { id: 'u1', name: 'Test User', email: 'test@example.com' }, isAuthenticated: true, loading: false, logout: () => {} };
if (typeof globalThis !== 'undefined') {
  if (!globalThis.__TEST_AUTH__ && !globalThis.__TEST_AUTH) {
    globalThis.__TEST_AUTH__ = defaultTestAuth;
    globalThis.__TEST_AUTH = defaultTestAuth;
  } else if (globalThis.__TEST_AUTH__ && !globalThis.__TEST_AUTH) {
    globalThis.__TEST_AUTH = globalThis.__TEST_AUTH__;
  } else if (!globalThis.__TEST_AUTH__ && globalThis.__TEST_AUTH) {
    globalThis.__TEST_AUTH__ = globalThis.__TEST_AUTH;
  }
}

// Convenience helper for tests to set/clear auth state. Keep both globals in sync.
globalThis.setTestAuth = (auth) => {
  if (typeof auth === 'undefined' || auth === null) {
    const unauth = { currentUser: null, isAuthenticated: false, loading: false, logout: () => {} };
    globalThis.__TEST_AUTH__ = unauth;
    globalThis.__TEST_AUTH = unauth;
  } else {
    globalThis.__TEST_AUTH__ = auth;
    globalThis.__TEST_AUTH = auth;
  }
};

// Optional convenience to clear test auth (alias)
globalThis.clearTestAuth = () => globalThis.setTestAuth(null);

// Note: we intentionally avoid mocking the AuthContext module here because
// `useAuth` already checks for `globalThis.__TEST_AUTH__` and returns it when
// present. Tests can set `globalThis.__TEST_AUTH__` per-suite to simulate
// authenticated or unauthenticated states without fragile module mocks.

// Note: we do not mock AuthContext module paths here. `useAuth` already
// returns `globalThis.__TEST_AUTH__` when present, so tests should set that
// per-suite to simulate auth states. Dynamic/module-path mocks are fragile
// with Vitest hoisting and so are intentionally avoided.

// Note: we intentionally avoid a second re-mock here; the block above performs
// the necessary mocks and declares rootRrd/rootRr in outer scope so other
// parts of the setup can inspect them safely.

// Expose test server for tests that need direct access
export const __TEST_SERVER__ = server;
export default undefined;

// Also initialize the ESM server proxy so tests that import `./mocks/server`
// pick up the same server instance and buffered handlers. This ensures
// fetch/XHR requests performed by tests are intercepted by MSW.
(async () => {
  try {
    // Import the ESM server proxy from the same src path used in tests
    const mod = await import('./mocks/server');
    const proxied = mod && (mod.server || (mod.default && mod.default.server)) || null;
    if (proxied && typeof proxied.listen === 'function') {
      // Wait for any async initialization inside the proxy
      try { await (proxied.ready || Promise.resolve()); } catch (e) { /* ignore */ }
      try { await proxied.listen({ onUnhandledRequest: 'bypass' }); } catch (e) { /* ignore */ }
      try { await proxied.resetHandlers(); } catch (e) { /* ignore */ }
      if (typeof globalThis !== 'undefined') globalThis.__MSW_SERVER__ = proxied;
      // eslint-disable-next-line no-console
  // setupTests: proxied MSW server initialized (diag suppressed)
    }
  } catch (e) {
    // ignore initialization failures in constrained environments
  }
})();
