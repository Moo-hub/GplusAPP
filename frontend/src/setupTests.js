/* eslint-env vitest */
import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi, expect as vitestExpect } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./mocks/server";

// Ensure the global `expect` is the Vitest implementation and extend it
// with @testing-library/jest-dom matchers. This is defensive: if another
// assertion library like Chai was injected earlier, this forces the
// Vitest expect to be the active one before matchers are registered.
// @ts-ignore - we intentionally add a runtime global for the test environment
if (typeof globalThis.expect === 'undefined') {
  // @ts-ignore
  globalThis.expect = vitestExpect;
} else if (
  // @ts-ignore - comparing runtime global test `expect` implementations
  globalThis.expect !== vitestExpect
) {
  // Overwrite to guarantee the correct expect is used by tests and matchers
  // are registered on the same object.
  // @ts-ignore
  globalThis.expect = vitestExpect;
}

// Extend the (now-global) Vitest expect with Testing Library's matchers
// @ts-ignore
globalThis.expect.extend(matchers);

// ---------------------- DOM & browser mocks ----------------------
// matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// IntersectionObserver
// @ts-ignore - provide a minimal IntersectionObserver mock for jsdom tests
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

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] ?? null;
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
      return Object.keys(store)[index] ?? null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock, configurable: true, writable: true });

// Provide a deterministic screen size for tests so components that
// serialize `screenSize` produce stable values expected by existing tests.
// Many tests assume 1920x1080; set that explicitly here.
try {
  // Prefer defining properties to ensure jsdom exposes the values
  // in a way that modules reading `window.innerWidth` / `window.screen.width`
  // will see them reliably (some properties may be non-writable).
  try {
    Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
  } catch (e) {
    // Fallback assignment
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
  // ignore in environments that disallow mutation
}

// Fix the system time used by tests to a reproducible value so timestamps
// are stable across runs. This helps assertions that check stringified
// timestamps. We keep the real Date available in case some tests rely on it.
try {
  const _RealDate = Date;
  const FIXED_ISO = '2023-01-01T12:00:00.000Z';
  // Create a subclass of the real Date that calls super() so instances
  // are instances of the overridden global Date (preserves instanceof
  // checks used by tests like expect.any(Date)).
  // @ts-ignore
  global.Date = class extends _RealDate {
    constructor(...args) {
      if (args.length === 0) {
        // call super with fixed time for no-arg construction
        super(FIXED_ISO);
      } else {
        super(...args);
      }
    }
    static now() {
      return new _RealDate(FIXED_ISO).getTime();
    }
    static parse(s) {
      return _RealDate.parse(s);
    }
    static UTC(...a) {
      return _RealDate.UTC(...a);
    }
  };
} catch (e) {
  // ignore if environment prevents replacing Date
}

// minimal IndexedDB mock (sufficient for tests that call indexedDB.open)
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

// ---------------------- MSW lifecycle & RTL cleanup ----------------------
// Use 'warn' for unhandled requests in tests to avoid failing on non-critical network calls
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// End of setupTests
