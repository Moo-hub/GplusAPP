/* eslint-env vitest */
import { vi, expect } from 'vitest';

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
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock for IndexedDB
const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn()
      }),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn(),
          get: vi.fn(),
          index: vi.fn(),
          clear: vi.fn()
        }),
        oncomplete: null,
        onerror: null,
        commit: vi.fn()
      }),
      objectStoreNames: {
        contains: vi.fn()
      }
    }
  })
};

// Apply IndexedDB mock
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock });

// Define a basic cleanup function
globalThis.afterEach = function() {};

// Add basic jest-dom like matchers to mimic the functionality without the dependency
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
    };
  },
  toHaveTextContent(received, expected) {
    const content = received.textContent;
    const expectedStr = typeof expected === 'string' ? expected : String(expected);
    const pass = content.includes(expectedStr);
    return {
      pass,
      message: () => `expected "${content}" ${pass ? 'not ' : ''}to include "${expectedStr}"`,
    };
  },
  // Add more matchers as needed
});