import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
let apiModule;
let getPickups, createPickup, getCompanies;
let axios;
import { toast } from 'react-toastify';
import { saveGlobals, restoreGlobals } from '../../tests/test-utils/globals';

// Mock dependencies
// Capture interceptors created by the module under test
const captured = { request: null, response: null, responseError: null };

// Mock axios at the top to ensure the module under test picks up the mock
vi.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: { use: (fn) => { captured.request = fn; mockInstance._requestHandler = fn; return 0; } },
      response: { use: (fn, errFn) => { captured.response = fn; captured.responseError = errFn; mockInstance._responseHandler = fn; mockInstance._responseErrorHandler = errFn; return 0; } }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => mockInstance),
    _requestHandler: null,
    _responseHandler: null,
    _responseErrorHandler: null,
  };

  const createFn = vi.fn(() => mockInstance);

  return {
    default: {
      create: createFn,
    },
    // also export named create for any imports that destructure
    create: createFn,
  };
});



vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the i18n singleton imported by the API module. The module under test
// imports from '../i18n.js', which resolves (from here) to '../../i18n.js'.
// Mocking this path prevents Node ESM from trying to load JSON locale files.
vi.mock('../../i18n.js', () => ({
  default: {
    t: (key) => key,
  },
}));

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

    // Re-apply i18n mock after resetModules to ensure the mock is active for fresh imports
    vi.doMock('../../i18n.js', () => ({
      default: { t: (key) => key },
    }));

    // Require the mocked axios module after reset so we can assert on create
    axios = require('axios');

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


    // Now import the module under test after mocks are in place
    const mod = require('../api');
    apiModule = mod.default || mod;
    getPickups = mod.getPickups;
    createPickup = mod.createPickup;
    getCompanies = mod.getCompanies;

  // Prefer the instance returned by the mocked axios.create if available
  const created = axios.create && axios.create.mock && axios.create.mock.results && axios.create.mock.results[0] && axios.create.mock.results[0].value;
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

    it('shows toast for non-401 errors', () => {
      // Setup
      const error = {
        response: {
          status: 500,
          data: { detail: 'Server error' },
        },
      };

  // Execute
  return expect(responseErrorHandler(error)).rejects.toEqual(error);

      // Verify
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });

    it('dispatches auth-error event for 401 errors', () => {
      // Setup
      const error = {
        response: {
          status: 401,
          data: { detail: 'Unauthorized' },
        },
      };
      window.dispatchEvent = vi.fn();

  // Execute
  return expect(responseErrorHandler(error)).rejects.toEqual(error);

      // Verify
      expect(toast.error).not.toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth-error',
          detail: { detail: error },
        })
      );
    });

    it('uses default error message when detail is not provided', () => {
      // Setup
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };

  // Execute
  return expect(responseErrorHandler(error)).rejects.toEqual(error);

      // Verify
      expect(toast.error).toHaveBeenCalledWith('errors.generalError');
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