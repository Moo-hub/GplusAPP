import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
let apiModule;
let getPickups, createPickup, getCompanies;
let axios;
let toast;
let toastWrapper;
import { saveGlobals, restoreGlobals } from '../../tests/test-utils/globals';

// Mock dependencies
// Capture interceptors created by the module under test
const captured = { request: null, response: null, responseError: null };

// Mock axios at the top to ensure the module under test picks up the mock
vi.mock('axios', () => {
  // Create a mock axios instance that mirror the shape used by the app:
  // - an instance object returned by axios.create()
  // - a function-like default export that also exposes `.create`
  const mockInstance = {
    interceptors: {
      request: { use: (fn) => { captured.request = fn; mockInstance._requestHandler = fn; return 0; } },
      response: { use: (fn, errFn) => { captured.response = fn; captured.responseError = errFn; mockInstance._responseHandler = fn; mockInstance._responseErrorHandler = errFn; return 0; } }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    _requestHandler: null,
    _responseHandler: null,
    _responseErrorHandler: null,
  };

  const createFn = vi.fn(() => mockInstance);

  // Make a callable function-like axios mock so imports like `import axios from 'axios'`
  // and `const axios = require('axios')` both observe a consistent shape.
  const axiosMock = function () { /* no-op function to mimic axios callable */ };
  // attach instance helpers to the function object
  axiosMock.create = createFn;
  axiosMock.get = mockInstance.get;
  axiosMock.post = mockInstance.post;
  axiosMock.put = mockInstance.put;
  axiosMock.delete = mockInstance.delete;
  axiosMock.interceptors = mockInstance.interceptors;

  return {
    __esModule: true,
    default: axiosMock,
    // also export named create for any imports that destructure
    create: createFn,
  };
});

vi.mock('react-toastify', () => ({
  __esModule: true,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the central logger so debug/info/etc are spies we can assert on
vi.mock('../../utils/logger', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../i18n/i18n', () => ({
  default: {
    t: (key) => key,
  },
}));

// Mock the toast wrapper so calls from api.js go to spies we can assert on
vi.mock('../../utils/toast', () => {
  const err = vi.fn();
  const succ = vi.fn();
  const module = {
    __esModule: true,
    default: { error: err, success: succ },
    error: err,
    success: succ,
  };
  return module;
});

describe('API Service', () => {
  let mockAxiosInstance;
  let mockLocalStorage;
  let requestInterceptor;
  let responseInterceptor;
  let responseErrorHandler;

  beforeEach(() => {
    // Reset module registry so mocked modules are used when requiring the api module
    vi.resetModules();
    // Clear mocks
    vi.clearAllMocks();
    // Save globals so tests can safely mutate them
    savedGlobals = saveGlobals();

    // Require the mocked axios module after reset so we can assert on create

      axios = require('axios');
      // grab the mocked react-toastify after mocks are applied and ensure spies
      const toastModule = require('react-toastify');
      toast = toastModule.toast;
      // Also grab the mocked toast wrapper module so we can assert on its spies
      const tw = require('../../utils/toast');
      toastWrapper = tw && (tw.default || tw);
      // alias to any to appease the TS/jsdoc typechecker in editors which
      // augment JS files with type information for node modules.
      /** @type {any} */
      const axiosAny = axios;

    // Setup localStorage mock
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // reset last toast message for test isolation
    try { globalThis.__LAST_TOAST_MESSAGE__ = undefined; } catch (e) {}


    // Now import the module under test after mocks are in place
    const mod = require('../api');
    apiModule = mod.default || mod;
    getPickups = mod.getPickups;
    createPickup = mod.createPickup;
    getCompanies = mod.getCompanies;

  // Prefer the instance returned by the mocked axios.create if available
  const axiosAnyRef = typeof axiosAny !== 'undefined' ? axiosAny : axios;
  const created = axiosAnyRef.create && axiosAnyRef.create.mock && axiosAnyRef.create.mock.results && axiosAnyRef.create.mock.results[0] && axiosAnyRef.create.mock.results[0].value;
  mockAxiosInstance = created || apiModule;

  // Use the exported handlers from the module directly (more reliable than intercepting axios)
  requestInterceptor = mod.requestHandler;
  responseInterceptor = mod.responseHandler;
  responseErrorHandler = mod.responseErrorHandler;

  // Ensure HTTP methods are spies so tests can set mockResolvedValueOnce
  mockAxiosInstance.get = vi.fn();
  mockAxiosInstance.post = vi.fn();

  // Ensure wrapper getters exist so tests can set mock return values reliably
  mockAxiosInstance.__mockGet = mockAxiosInstance.__mockGet || vi.fn();
  mockAxiosInstance.__mockPost = mockAxiosInstance.__mockPost || vi.fn();

  // Wrap get/post so they call our inner mocks (and still record calls)
  mockAxiosInstance.get = mockAxiosInstance.get || vi.fn((...args) => mockAxiosInstance.__mockGet(...args));
  mockAxiosInstance.post = mockAxiosInstance.post || vi.fn((...args) => mockAxiosInstance.__mockPost(...args));

    // Mock CustomEvent
    global.CustomEvent = vi.fn((eventName, options) => ({
      type: eventName,
      ...options,
    }));

    // Mock dispatchEvent
    global.dispatchEvent = vi.fn();
  });

  let savedGlobals;
  afterEach(() => {
    // Restore global state safely
    restoreGlobals(savedGlobals);
  });

  describe('Axios Instance Configuration', () => {
    it('installs handlers which are functions', () => {
      // The module exports the handlers which should be functions
      expect(typeof requestInterceptor).toBe('function');
      expect(typeof responseInterceptor).toBe('function');
    });

    it('sets authorization header when token exists', () => {
      // Setup
      const token = 'test-token';
      mockLocalStorage.getItem.mockReturnValue(token);
      const config = { headers: {} };

      // Execute
      const result = requestInterceptor(config);

      // Verify
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('does not set authorization header when token does not exist', () => {
      // Setup
      mockLocalStorage.getItem.mockReturnValue(null);
      const config = { headers: {} };

      // Execute
      const result = requestInterceptor(config);

      // Verify
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('extracts data from successful responses', () => {
      // Setup
      const responseData = { data: 'test data' };

      // Execute
      const result = responseInterceptor({ data: responseData });

      // Verify
      expect(result).toBe(responseData);
    });

  it('shows toast for non-401 errors', async () => {
      // Setup
      const error = {
        response: {
          status: 500,
          data: { detail: 'Server error' },
        },
      };

      // Execute + Verify
      await expect(responseErrorHandler(error)).rejects.toEqual(error);
      // assert the toast wrapper recorded the last message
      expect(globalThis.__LAST_TOAST_MESSAGE__).toBe('Server error');
    });

  it('dispatches auth-error event for 401 errors', async () => {
      // Setup
      const error = {
        response: {
          status: 401,
          data: { detail: 'Unauthorized' },
        },
      };
      window.dispatchEvent = vi.fn();

  // Execute + Verify
  await expect(responseErrorHandler(error)).rejects.toEqual(error);
  // api.js should not call toast for 401 auth errors; ensure no toast recorded
  expect(globalThis.__LAST_TOAST_MESSAGE__).toBeUndefined();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth-error',
          detail: { detail: error },
        })
      );
    });

  it('uses default error message when detail is not provided', async () => {
      // Setup
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };

      // Execute + Verify
      await expect(responseErrorHandler(error)).rejects.toEqual(error);
      expect(globalThis.__LAST_TOAST_MESSAGE__).toBe('errors.generalError');
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      // Setup for successful responses - set the inner mock resolvers
      mockAxiosInstance.__mockGet.mockResolvedValue({ data: { message: 'Success' } });
      mockAxiosInstance.__mockPost.mockResolvedValue({ data: { message: 'Created' } });
    });

    it('getPickups calls the correct endpoint', async () => {
      // Mock implementation
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

      // Execute
      await getPickups();

      // Verify
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/pickups');
    });

    it('createPickup calls the correct endpoint with data', async () => {
      // Setup
      const pickupData = { address: '123 Main St', date: '2023-05-15' };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 1, ...pickupData } });

      // Execute
      await createPickup(pickupData);

      // Verify
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/pickups', pickupData);
    });

    it('getCompanies calls the correct endpoint', async () => {
      // Mock implementation
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Company A' }] });

      // Execute
      await getCompanies();

      // Verify
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/companies');
    });
  });
});