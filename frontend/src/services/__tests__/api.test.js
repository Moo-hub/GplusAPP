vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock apiClient.js directly to ensure all API calls use the mock client
const mockApiClient = {
  get: vi.fn((url, ...args) => {
    throw new Error(`[Mock Error] Unhandled GET request to: ${url}`);
  }),
  post: vi.fn((url, ...args) => {
    throw new Error(`[Mock Error] Unhandled POST request to: ${url}`);
  }),
  put: vi.fn((url, ...args) => {
    throw new Error(`[Mock Error] Unhandled PUT request to: ${url}`);
  }),
  delete: vi.fn((url, ...args) => {
    throw new Error(`[Mock Error] Unhandled DELETE request to: ${url}`);
  }),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};
vi.mock('../apiClient.js', () => ({
  __esModule: true,
  default: mockApiClient,
}));

import axios from 'axios';

// *** DIAGNOSTIC CHECK ***
if (!axios.get || typeof axios.get !== 'function' || !('mock' in axios.get)) {
  throw new Error('Axios mock is not active! The test runner failed to apply vi.mock before import.');
}
// ************************


import { saveGlobals, restoreGlobals } from '../../tests/test-utils/globals';

// Mocks and helpers for test scope
let apiModule;
let getPickups, createPickup, getCompanies;
let toast;
let toastWrapper;
let mockLocalStorage;
let requestInterceptor;
let responseInterceptor;
let responseErrorHandler;
let savedGlobals;
let mockAxiosInstance;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    savedGlobals = saveGlobals();

    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    try { globalThis.__LAST_TOAST_MESSAGE__ = undefined; } catch (e) {}

    const mod = require('../api');
    apiModule = mod.default || mod;
    getPickups = mod.getPickups;
    createPickup = mod.createPickup;
    getCompanies = mod.getCompanies;


    // Use the mockApiClient for all API calls
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
    mockAxiosInstance = mockApiClient;


    requestInterceptor = mod.requestHandler;
    responseInterceptor = mod.responseHandler;
    responseErrorHandler = mod.responseErrorHandler;

    global.CustomEvent = vi.fn((eventName, options) => ({
      type: eventName,
      ...options,
    }));
    global.dispatchEvent = vi.fn();
  });

  describe('API Methods', () => {
    beforeEach(() => {
      // Setup for successful responses - set the inner mock resolvers
      mockAxiosInstance.get.mockResolvedValue({ data: { message: 'Success' } });
      mockAxiosInstance.post.mockResolvedValue({ data: { message: 'Created' } });
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

// Removed duplicate describe('API Methods', ...) block and all references to mockAxiosInstance.__mockGet and __mockPost. Only the correct describe block remains.