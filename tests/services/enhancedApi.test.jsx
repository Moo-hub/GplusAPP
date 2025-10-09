/// <reference types="vitest" />
/// <reference types="jsdom" />
// @vitest-environment jsdom
import React from 'react';
import '../../vitest.setup.js';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';

import axios from 'axios';
// Mock dependencies before importing the module
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() }))
}));

var stableAxiosInstance = {
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
vi.mock('axios', () => {
  const create = vi.fn(() => stableAxiosInstance);
  const axiosDefault = { create };
  return { default: axiosDefault, create };
});
vi.mock('../../src/services/token');
vi.mock('../../src/utils/offlineStorage', () => ({
  Stores: {
    USER_DATA: 'user_data'
  },
  getItem: vi.fn(),
  getAllItems: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn()
}));
import { useToast } from '../../src/components/toast/Toast';
vi.mock('../../src/components/toast/Toast', () => ({
  useToast: vi.fn()
}));

let api, initializeApiToastFunctions, initializeOfflineContext, ApiToastInitializer, initApiInterceptors, setApiInstance, createApiInstance;
import TokenService from '../../src/services/token';
import { Stores, getItem, getAllItems, addItem, updateItem } from '../../src/utils/offlineStorage';
import { render } from '@testing-library/react';

describe('Enhanced API Service', () => {
  let mockToastFunctions;
  let mockOfflineContext;
  let mockRequest;
  let mockRequestInterceptor;
  let mockResponseInterceptor;
  let localStorageGetItemSpy;
  let localStorageSetItemSpy;
  let localStorageRemoveItemSpy;
  let originalNavigator;
  let mockNavigator;

  beforeEach(() => {
    vi.resetAllMocks();
    originalNavigator = global.navigator;
    // Spy on localStorage methods
    localStorageGetItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => null);
    localStorageSetItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => undefined);
    localStorageRemoveItemSpy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => undefined);
    mockNavigator = { onLine: true };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    mockToastFunctions = {
      showError: vi.fn(),
      showSuccess: vi.fn()
    };
    // TokenService and offlineStorage mocks
    TokenService.getAccessToken.mockReturnValue('mock-token');
    TokenService.isTokenExpired.mockReturnValue(false);
    getItem.mockResolvedValue('mock-value');
    getAllItems.mockResolvedValue([]);
    addItem.mockResolvedValue(undefined);
    updateItem.mockResolvedValue(undefined);
    // Axios instance and interceptors
    stableAxiosInstance = {
      interceptors: {
        request: {
          use: vi.fn((onFulfilled) => {
            mockRequestInterceptor = onFulfilled;
            return 1;
          })
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            mockResponseInterceptor = { onFulfilled, onRejected };
            return 2;
          })
        },
        defaults: {}
      },
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    // Import enhancedApi after mocks
    return import('../../src/services/enhancedApi').then((mod) => {
      api = mod.default;
      initializeApiToastFunctions = mod.initializeApiToastFunctions;
      initializeOfflineContext = mod.initializeOfflineContext;
      ApiToastInitializer = mod.ApiToastInitializer;
      initApiInterceptors = mod.initApiInterceptors;
      setApiInstance = mod.setApiInstance;
      createApiInstance = mod.createApiInstance;
      setApiInstance(stableAxiosInstance);
      createApiInstance();
      mockRequest = {
        headers: {},
        method: 'get',
        url: '/test-endpoint',
        params: {}
      };
    });
  });
  afterEach(() => {
  localStorageGetItemSpy.mockRestore();
  localStorageSetItemSpy.mockRestore();
  localStorageRemoveItemSpy.mockRestore();
    global.navigator = originalNavigator;
  });
  describe('Configuration', () => {
    test('axios is configured with correct defaults', () => {
      expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
        baseURL: expect.any(String),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        xsrfCookieName: expect.any(String),
        xsrfHeaderName: expect.any(String)
      }));
    });
  });

  describe('ApiToastInitializer component', () => {
    test('initializes toast functions on render', () => {
      const mockToast = {
        showError: vi.fn(),
        showSuccess: vi.fn()
      };
      useToast.mockReturnValue(mockToast);
      render(<ApiToastInitializer />);
      expect(mockToast.showError).not.toHaveBeenCalled();
      expect(mockToast.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Request Interceptor', () => {
    test('adds auth token to request headers when token exists', async () => {
      const token = 'test-token';
      window.localStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return token;
        return null;
      });
      const config = { headers: {}, method: 'get' };
      const result = await mockRequestInterceptor(config);
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
    });
    test('adds CSRF token to request headers when token exists', async () => {
      const csrfToken = 'csrf-token';
      window.localStorage.getItem.mockImplementation((key) => {
        if (key === 'csrfToken') return csrfToken;
        return null;
      });
      const config = { headers: {}, method: 'get' };
      const result = await mockRequestInterceptor(config);
      expect(result.headers['X-CSRF-Token']).toBe(csrfToken);
      expect(window.localStorage.getItem).toHaveBeenCalledWith('csrfToken');
    });
    // ...more tests can be migrated here...
  });
});
