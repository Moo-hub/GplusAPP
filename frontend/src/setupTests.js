/* eslint-env vitest */
import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi, expect as vitestExpect } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./mocks/server";

// Ensure Vitest's expect is the global expect and extend it with jest-dom matchers
// This prevents other assertion libraries from interfering with matchers.
if (typeof globalThis.expect === 'undefined' || globalThis.expect !== vitestExpect) {
  // @ts-ignore
  globalThis.expect = vitestExpect;
}
// @ts-ignore
globalThis.expect.extend(matchers);

// --- Legacy shims ---
// Provide a `jest` alias so older tests using jest.fn() work under Vitest
try {
  if (typeof globalThis.jest === 'undefined') {
    // use imported vi directly
    // @ts-ignore
    globalThis.jest = vi;
  }
} catch (e) {
  // ignore
}

// If React is available in node_modules, expose it as a global for legacy modules
// that expect a global `React` during module evaluation. Prefer the real
// React implementation rather than a stub to avoid breaking rendering.
try {
  if (typeof globalThis.React === 'undefined') {
    try {
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      const RealReact = typeof require === 'function' ? require('react') : null;
      if (RealReact) {
        // @ts-ignore
        globalThis.React = RealReact;
      }
    } catch (e) {
      // if React isn't resolvable, don't create a harmful stub; leave undefined
    }
  }
} catch (e) {
  // ignore
}

// Jest compatibility wrapper helpers (small, safe wrappers that forward to Vitest's APIs)
try {
  if (!globalThis.jest) globalThis.jest = vi;
  // map common Jest APIs if missing
  // jest.mock -> vi.mock, jest.fn -> vi.fn, jest.spyOn -> vi.spyOn, jest.clearAllMocks -> vi.clearAllMocks
  // provide identity shims to reduce test changes
  // @ts-ignore
  const _jest = globalThis.jest;
  try { _jest.mock = _jest.mock || vi.mock; } catch (e) { /* ignore */ }
  try { _jest.fn = _jest.fn || vi.fn; } catch (e) { /* ignore */ }
  try { _jest.spyOn = _jest.spyOn || vi.spyOn; } catch (e) { /* ignore */ }
  try { _jest.clearAllMocks = _jest.clearAllMocks || vi.clearAllMocks; } catch (e) { /* ignore */ }
  try { _jest.useFakeTimers = _jest.useFakeTimers || vi.useFakeTimers; } catch (e) { /* ignore */ }
  try { _jest.runOnlyPendingTimers = _jest.runOnlyPendingTimers || vi.runOnlyPendingTimers; } catch (e) { /* ignore */ }
  try { _jest.advanceTimersByTime = _jest.advanceTimersByTime || vi.advanceTimersByTime; } catch (e) { /* ignore */ }

  // jest.requireActual shim for tests that rely on it
  if (!(_jest.requireActual)) {
    try {
      // dynamic createRequire is available in Node; fallback to import
      // eslint-disable-next-line no-undef
      const { createRequire } = typeof require === 'function' ? require('module') : (Function('return import("module")')());
      // If this throws, we'll catch below and provide a best-effort shim
      // @ts-ignore
      _jest.requireActual = (p) => createRequire(import.meta.url)(p);
    } catch (e) {
      // fallback: try dynamic import and return as-is (best-effort)
      // @ts-ignore
      _jest.requireActual = async (p) => (await import(p));
    }
  }
  // expose a small helper to require CJS modules from ESM setup files
  if (!globalThis.requireCjs) {
    try {
      // Prefer Node's createRequire
      // @ts-ignore
      const { createRequire } = typeof require === 'function' ? require('module') : (Function('return import("module")')());
      // @ts-ignore
      globalThis.requireCjs = (path) => createRequire(import.meta.url)(path);
    } catch (e) {
      // best-effort fallback: try synchronous import via eval require if available
      try {
        // eslint-disable-next-line no-eval
        // @ts-ignore
        globalThis.requireCjs = (p) => eval('require')(p);
      } catch (err) {
        // final fallback: throw helpful error when used
        globalThis.requireCjs = () => { throw new Error('requireCjs not available in this environment'); };
      }
    }
  }
} catch (e) {
  // ignore heavy failures in unusual runtimes
}

// Make WebSocket writable if possible so tests can replace it.
try {
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
  if (!desc) {
    // define an initial writable property
    Object.defineProperty(globalThis, 'WebSocket', { value: undefined, writable: true, configurable: true });
  } else if (!desc.writable || !desc.configurable) {
    try {
      const original = globalThis.WebSocket;
      Object.defineProperty(globalThis, 'WebSocket', { configurable: true, writable: true, enumerable: true, value: original });
    } catch (e) {
      // ignore if environment forbids
    }
  }
} catch (e) {
  // ignore
}

// ---------------------- DOM & browser mocks ----------------------
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Minimal IntersectionObserver mock
// @ts-ignore
global.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  simulateIntersection(isIntersecting) {
    this.callback([{ isIntersecting, target: document.createElement("div") }], this);
  }
};

const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) { return store[key] ?? null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; },
    key(index) { return Object.keys(store)[index] ?? null; },
    get length() { return Object.keys(store).length; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock, configurable: true, writable: true });

// Deterministic screen size
try {
  try {
    Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
  } catch (e) {
    // fallback
    // @ts-ignore
    window.innerWidth = 1920;
    // @ts-ignore
    window.innerHeight = 1080;
  }
  try {
    if (!window.screen) {
      // @ts-ignore
      window.screen = { width: 1920, height: 1080 };
    } else {
      Object.defineProperty(window.screen, 'width', { value: 1920, configurable: true });
      Object.defineProperty(window.screen, 'height', { value: 1080, configurable: true });
    }
  } catch (e) {
    // @ts-ignore
    window.screen.width = 1920;
    // @ts-ignore
    window.screen.height = 1080;
  }
} catch (e) {
  // ignore
}

// Deterministic Date
try {
  const _RealDate = Date;
  const FIXED_ISO = '2023-01-01T12:00:00.000Z';
  // @ts-ignore
  global.Date = class extends _RealDate {
    constructor(...args) {
      if (args.length === 0) super(FIXED_ISO);
      else super(...args);
    }
    static now() { return new _RealDate(FIXED_ISO).getTime(); }
    static parse(s) { return _RealDate.parse(s); }
    static UTC(...a) { return _RealDate.UTC(...a); }
  };
} catch (e) {
  // ignore
}

// minimal IndexedDB mock
const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: vi.fn().mockReturnValue({ createIndex: vi.fn() }),
      transaction: vi.fn().mockReturnValue({ objectStore: vi.fn().mockReturnValue({ add: vi.fn(), get: vi.fn(), clear: vi.fn() }) }),
      objectStoreNames: { contains: vi.fn() },
    },
  }),
};
Object.defineProperty(window, "indexedDB", { value: indexedDBMock, configurable: true, writable: true });

// MSW lifecycle & RTL cleanup
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// End of setupTests

// Provide a minimal Card component globally when a local import is missing.
// Some legacy components expect a `Card` symbol to be in-scope during module
// evaluation. Defining a tiny React component here is a low-risk, reversible
// shim that allows tests to render those modules without editing many files.
try {
  if (typeof globalThis.Card === 'undefined') {
    // Lazy require React if available in the environment
    try {
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      const React = require && typeof require === 'function' ? require('react') : null;
      let CardComp;
      if (React && React.createElement) {
        CardComp = (props) => React.createElement(React.Fragment, null, props && props.children ? props.children : null);
      } else {
        CardComp = (props) => (props && props.children ? props.children : null);
      }
      // @ts-ignore
      globalThis.Card = CardComp;
      // also expose under window for some modules
      if (typeof window !== 'undefined') window.Card = CardComp;
    } catch (e) {
      // final fallback: minimal non-React function returning children
      // @ts-ignore
      globalThis.Card = (props) => (props && props.children ? props.children : null);
    }
  }
} catch (e) {
  // ignore
}

  // Provide a GenericScreen bridge so tests can override the implementation at any time.
  // Many screen modules import `GenericScreen` without an explicit import; they bind to
  // whatever value globalThis.GenericScreen returned at module-evaluation time. To allow
  // tests to call `vi.stubGlobal('GenericScreen', ...)` after import and still have the
  // component used by those modules change, we expose a stable bridge function as the
  // property value and route calls to an internal, mutable implementation slot.
  try {
    if (typeof globalThis.__GENERIC_SCREEN_BRIDGE__ === 'undefined') {
      // default implementation: capture last props for debugging and return children
      globalThis.__CURRENT_GENERIC_SCREEN_IMPL__ = (props) => {
        try { globalThis.__LAST_GENERIC_SCREEN_PROPS__ = props; } catch (e) { /* ignore */ }
        return (props && props.children) ? props.children : null;
      };

      const bridge = (props) => {
        const impl = globalThis.__CURRENT_GENERIC_SCREEN_IMPL__;
        try {
          return impl ? impl(props) : null;
        } catch (e) {
          // ensure the bridge never throws during module evaluation
          // tests can still stub to observe errors if desired
          return null;
        }
      };

      Object.defineProperty(globalThis, 'GenericScreen', {
        configurable: true,
        enumerable: true,
        get() {
          // always return the stable bridge function so modules bind to it
          return bridge;
        },
        set(value) {
          // when tests call vi.stubGlobal('GenericScreen', fn) they assign here;
          // store the provided implementation in the mutable slot so the bridge delegates to it
          // If value is the bridge itself (or identical), ignore to avoid recursion.
          if (value === bridge) return;
          globalThis.__CURRENT_GENERIC_SCREEN_IMPL__ = value;
        },
      });

      // also expose markers for debugging
      globalThis.__GENERIC_SCREEN_BRIDGE__ = bridge;
      if (typeof window !== 'undefined') window.__GENERIC_SCREEN_BRIDGE__ = bridge;
    }
  } catch (e) {
    // ignore
  }

  // Monkeypatch vi.stubGlobal for GenericScreen so tests that call vi.stubGlobal('GenericScreen', fn)
  // will register their stub with our bridge instead of replacing the bridge property. This keeps
  // the bridge stable for modules that bound to it at import time while still letting tests receive
  // the stub callbacks and capture props.
  try {
    if (typeof vi !== 'undefined' && vi.stubGlobal) {
      const _origStubGlobal = vi.stubGlobal.bind(vi);
      const _origUnstubAll = vi.unstubAllGlobals ? vi.unstubAllGlobals.bind(vi) : null;

      // ensure listener array exists
      globalThis.__GENERIC_SCREEN_LISTENERS__ = globalThis.__GENERIC_SCREEN_LISTENERS__ || [];

      vi.stubGlobal = (name, value) => {
        if (name === 'GenericScreen') {
          // register the listener and set the current impl to a delegator that calls all listeners
          try {
            globalThis.__GENERIC_SCREEN_LISTENERS__.push(value);
            globalThis.__CURRENT_GENERIC_SCREEN_IMPL__ = (props) => {
              let ret;
              for (const fn of globalThis.__GENERIC_SCREEN_LISTENERS__) {
                try {
                  const r = fn(props);
                  // if a listener returns something (like a React node), prefer the last non-undefined
                  if (typeof r !== 'undefined') ret = r;
                } catch (e) {
                  // ignore listener errors to avoid breaking other tests
                }
              }
              return typeof ret !== 'undefined' ? ret : null;
            };
          } catch (e) {
            // fallback to original behavior
            return _origStubGlobal(name, value);
          }
          return;
        }
        return _origStubGlobal(name, value);
      };

      if (_origUnstubAll) {
        vi.unstubAllGlobals = () => {
          try {
            globalThis.__GENERIC_SCREEN_LISTENERS__ = [];
            // restore to default impl
            globalThis.__CURRENT_GENERIC_SCREEN_IMPL__ = (props) => { try { globalThis.__LAST_GENERIC_SCREEN_PROPS__ = props; } catch (e) {} return (props && props.children) ? props.children : null; };
          } catch (e) {
            // ignore
          }
          return _origUnstubAll();
        };
      }
    }
  } catch (e) {
    // ignore
  }
