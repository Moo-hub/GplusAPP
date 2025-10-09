/* eslint-env vitest */
import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers);

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

// Clean up after each test
afterEach(() => {
  cleanup();
});