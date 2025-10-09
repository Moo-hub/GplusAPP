/* eslint-env vitest */
import "@testing-library/jest-dom";
import { server } from "./mocks/server";
import { vi, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers);

// Fix for matchMedia not available in test environment
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

// Mock ResizeObserver which isn't available in Jest DOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver which isn't available in Jest DOM
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  // Helper to simulate an intersection
  simulateIntersection(isIntersecting) {
    this.callback([{ isIntersecting, target: document.createElement('div') }], this);
  }
};

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

// Apply localStorage mock and make it configurable for tests that override or delete
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

// Set up MSW server for API mocking
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// Reset handlers between tests and clean up React Testing Library setup
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
// Clean up MSW server after all tests
afterAll(() => server.close());
