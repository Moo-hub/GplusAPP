import '@testing-library/jest-dom';
import { vi } from 'vitest';
import path from 'path';
import { createRequire } from 'module';

// Legacy-react import fallback for tests that import this CJS setup file
// Some tests import `setupTests.js` directly; ensure a usable `React`
// reference is available so we can define simple functional stubs.
let ReactImported;
try {
  // Prefer CommonJS require when available in this environment
  ReactImported = require('react');
} catch (e) {
  // Fall back to any global React injected by other setup code
  ReactImported = globalThis.React;
}
const React = (ReactImported && (ReactImported.default || ReactImported)) || {
  // Minimal safe fallback: return plain objects which react-testing-library
  // will ignore; this avoids throwing when React isn't resolvable.
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
};

import { server as realServer } from './mocks/server.js';
import { handlers } from './mocks/handlers.js';

// Attach the real MSW server to globalThis for test compatibility
globalThis.server = realServer;

// Synchronously register handlers before tests run
if (realServer && typeof realServer.use === 'function' && Array.isArray(handlers) && handlers.length > 0) {
  realServer.use(...handlers);
}

// Minimal i18n mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => {
      const translations = {
        'dashboard.stable': 'Stable',
        'auth.password': 'Password',
        'auth.name': 'Name',
        'auth.email': 'Email',
        'auth.confirmPassword': 'Confirm Password',
        'auth.register': 'Register',
        'auth.alreadyHaveAccount': 'Already have an account?',
        'auth.login': 'Login',
        'validation.nameRequired': 'Name is required',
        'validation.emailRequired': 'Email is required',
        'validation.passwordRequired': 'Password is required',
        'errors.generalError': 'An error occurred',
        'common.loading': 'Loading...',
        'common.success': 'Success',
      };
      if (typeof k === 'string' && translations[k]) return translations[k];
      return typeof k === 'string' ? k.split('.').pop().replace(/[-_]/g, ' ') : k;
    },
    i18n: { language: 'en', changeLanguage: async () => Promise.resolve() },
  }),
  I18nextProvider: ({ children }) => children,
  getFixedT: () => ((k) => {
    const translations = {
      'dashboard.stable': 'Stable',
      'auth.password': 'Password',
      'auth.name': 'Name',
      'auth.email': 'Email',
      'auth.confirmPassword': 'Confirm Password',
      'auth.register': 'Register',
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.login': 'Login',
      'validation.nameRequired': 'Name is required',
      'validation.emailRequired': 'Email is required',
      'validation.passwordRequired': 'Password is required',
      'errors.generalError': 'An error occurred',
      'common.loading': 'Loading...',
      'common.success': 'Success',
    };
    if (typeof k === 'string' && translations[k]) return translations[k];
    return typeof k === 'string' ? k.split('.').pop().replace(/[-_]/g, ' ') : k;
  }),
  initReactI18next: { type: '3rdParty' },
}));

// Minimal React global
try {
  const requireCjs = createRequire(path.resolve(process.cwd(), 'package.json'));
  const ReactImported = requireCjs('react');
  globalThis.React = ReactImported.default || ReactImported;
} catch (e) {}

// Minimal polyfills
try {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  });
} catch (e) {}

try {
  // @ts-ignore - provide a minimal ResizeObserver polyfill for tests
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
} catch (e) {}
try {
  // @ts-ignore - minimal IntersectionObserver polyfill for tests
  global.IntersectionObserver = class { constructor(cb) { this.cb = cb } observe() {} unobserve() {} disconnect() {} };
} catch (e) {}

// Minimal localStorage/sessionStorage
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

// Patch Response.ok to match browser spec for all fetch polyfills
if (typeof globalThis.Response !== 'undefined' && globalThis.Response.prototype) {
    Object.defineProperty(globalThis.Response.prototype, 'ok', {
        get: function() {
            return this.status >= 200 && this.status < 300;
        },
        configurable: true,
    });
}

// --- Legacy global stubs (kept in sync with setupTests.mjs) ---
// Provide simple component stubs for older tests that reference globals
globalThis.GenericScreen = function GenericScreen(props) {
  return React.createElement('div', { 'data-testid': 'stub-GenericScreen' },
    React.createElement('div', { 'data-testid': 'loading' }, 'Loading...'),
    React.createElement('div', { 'data-testid': 'error' }, 'Error occurred'),
    React.createElement('div', { 'data-testid': 'empty' }, 'No data'),
    props && props.children
  );
};

globalThis.PointsScreen = function PointsScreen(props) {
  return React.createElement('div', { 'data-testid': 'stub-PointsScreen' }, props && props.children);
};

globalThis.Card = function Card(props) {
  return React.createElement('div', { 'data-testid': 'stub-Card' }, props && props.children);
};

globalThis.Footer = function Footer(props) {
  return React.createElement('footer', { 'data-testid': 'site-footer' }, props && props.children);
};

globalThis.Navigation = function Navigation(props) {
  return React.createElement('nav', { 'data-testid': 'main-navigation' }, props && props.children);
};

globalThis.NotFound = function NotFound(props) {
  return React.createElement('div', { 'data-testid': 'not-found-container' }, props && props.children);
};