/* eslint-env vitest */
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi, expect as vitestExpect } from 'vitest';
// Minimal ambient declarations to satisfy TypeScript in the test bootstrap.
// We declare a global `expect` (bound to Vitest's expect) so code referencing
// `globalThis.expect` types correctly during setup. Also provide a narrow
// IntersectionObserver callback property typing used by the mock below.
declare global {
  // Augment the globalThis type to include `expect` when Vitest runs.
  // Avoid redeclaring the top-level `expect` symbol in module scope.
  interface GlobalThis {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect?: typeof vitestExpect;
  }
  interface IntersectionObserver {
    // callback property is used by our mock to simulate intersections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback?: (entries: any[], observer: any) => void;
  }
}
import { cleanup } from '@testing-library/react';

// Ensure Vitest's expect is the global expect
// (some environments may set a different global expect)
if (typeof (globalThis as any).expect === 'undefined' || (globalThis as any).expect !== vitestExpect) {
  // Assign Vitest's expect to the global object for compatibility.
  (globalThis as any).expect = vitestExpect;
}

// Provide lightweight browser shims commonly required by the frontend tests
Object.defineProperty(window, 'matchMedia', {
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
// Minimal IntersectionObserver mock with a typed callback property.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.IntersectionObserver = class {
  // ensure the instance has a callback field matching our ambient type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback?: (entries: any[], observer: any) => void;
  constructor(callback: any) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
  simulateIntersection(isIntersecting: boolean) {
    if (typeof this.callback === 'function') {
      this.callback([{ isIntersecting, target: document.createElement('div') }], this as any);
    }
  }
} as any;

// Simple localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return store[key] ?? null; },
    setItem(key: string, value: string) { store[key] = String(value); },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; },
    key(index: number) { return Object.keys(store)[index] ?? null; },
    get length() { return Object.keys(store).length; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

// Deterministic viewport
try {
  Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
  if (!window.screen) window.screen = { width: 1920, height: 1080 } as any;
} catch (e) {
  // ignore
}

// Inject a CSRF meta tag if tests expect it
beforeAll(() => {
  if (!document.querySelector('meta[name="csrf-token"]')) {
    const m = document.createElement('meta');
    m.setAttribute('name', 'csrf-token');
    m.setAttribute('content', 'test-csrf-token');
    document.head.appendChild(m);
  }
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  // no-op for now
});

export {};
