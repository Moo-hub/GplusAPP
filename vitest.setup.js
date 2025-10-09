// vitest.setup.js - A setup file that doesn't rely on external dependencies
import { vi, expect } from 'vitest';
// Register jest-dom matchers for Vitest
// Note: '@testing-library/jest-dom/vitest' is not a valid path; use the package root
import '@testing-library/jest-dom';
// Ensure React is available globally for JSX in test files that don't import it explicitly
import * as React from 'react';
// eslint-disable-next-line no-undef
globalThis.React = React?.default ?? React;

// Expose Vite env to global for modules that avoid direct import.meta access
// This helps JS files that are linted with TS rules complaining about import.meta
// eslint-disable-next-line no-undef
if (typeof import.meta !== 'undefined' && import.meta.env) {
  // eslint-disable-next-line no-undef
  globalThis.__VITE_ENV = import.meta.env;
}

// Ensure navigator and userAgent exist before any libraries import/react-dom init
if (typeof window !== 'undefined') {
  if (!window.navigator) {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'node.js' },
      writable: true,
    });
  } else if (!window.navigator.userAgent) {
    try {
      // Prefer writable assignment, else redefine
      window.navigator.userAgent = 'node.js';
    } catch {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'node.js',
        configurable: true,
      });
    }
  }
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
    // تحسين محاكاة التوافق مع الأجهزة المختلفة
    matches: query.includes('(max-width') || query.includes('prefers-reduced-motion'),
  })),
});

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

// Apply localStorage mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

// Mock sessionStorage too
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

// Apply sessionStorage mock
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, configurable: true, writable: true });

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
// Provide navigator with stable defaults for tests
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    userAgent: 'Mozilla/5.0 Test UserAgent',
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
    },
    sendBeacon: vi.fn().mockReturnValue(true)
  },
  writable: true
});

// Mock window.scrollTo to avoid errors in components calling it
if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}

// Provide consistent viewport size used by analytics tests
Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true, writable: true });

// Provide a minimal crypto mock for tests that rely on it
// Ensure crypto is writable/configurable for tests that reassign it
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true, writable: true });
}

if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (arr) => {
    // Fill with pseudo-random values for test purposes
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = vi.fn(() => {
    // Simple UUID v4-like mock sufficient for tests
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  });
}

// TextEncoder/TextDecoder shims when missing
try {
  // Node 18+ has these in global, else attempt to polyfill
  // eslint-disable-next-line no-new
  new TextEncoder();
} catch {
  // Lazy, minimal polyfills for test usage only
  class SimpleTextEncoder {
    encode(str) {
      return new Uint8Array(Buffer.from(String(str), 'utf-8'));
    }
  }
  class SimpleTextDecoder {
    decode(buf) {
      return Buffer.from(buf).toString('utf-8');
    }
  }
  // Apply shims
  // eslint-disable-next-line no-undef
  globalThis.TextEncoder = SimpleTextEncoder;
  // eslint-disable-next-line no-undef
  globalThis.TextDecoder = SimpleTextDecoder;
}