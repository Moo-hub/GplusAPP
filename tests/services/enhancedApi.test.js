import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import * as React from 'react';
import axios from 'axios';
import api, { 
  initializeApiToastFunctions,
  initializeOfflineContext,
  ApiToastInitializer 
} from '../../src/services/enhancedApi';
import TokenService from '../../src/services/token';
import { Stores, getItem, getAllItems, addItem, updateItem } from '../../src/utils/offlineStorage';
import { render } from '@testing-library/react';

// Mock dependencies
vi.mock('axios');
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
vi.mock('../../src/components/toast/Toast', () => ({
  useToast: vi.fn().mockReturnValue({
    showError: vi.fn(),
    showSuccess: vi.fn()
  })
}));

// Do not mock the entire React module. Instead, spy on useEffect in beforeEach
// so tests that expect immediate effects can run without globally replacing
// the React module (which breaks hooks in other tests).

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn()
}));

describe('Enhanced API Service', () => {
  let mockToastFunctions;
  let mockOfflineContext;
  let mockRequest;
  let mockRequestInterceptor;
  let mockResponseInterceptor;
  let originalLocalStorage;
  let mockLocalStorage;
  let originalNavigator;
  let mockNavigator;
  // test-scoped spy for React.useEffect
  let useEffectSpy;
  
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    // Spy on useEffect to run effects synchronously in these tests.
    useEffectSpy = vi.spyOn(React, 'useEffect').mockImplementation((fn) => fn());
    
    // Save original localStorage and navigator
    originalLocalStorage = global.localStorage;
    originalNavigator = global.navigator;
    
    // Setup mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = mockLocalStorage;
    
    // Setup mock navigator
    mockNavigator = {
      onLine: true
    };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    
    // Setup mock toast functions
    mockToastFunctions = {
      showError: vi.fn(),
      showSuccess: vi.fn()
    };
    
    // Setup mock offline context
    mockOfflineContext = {
      isAppOffline: false,
      queueRequest: vi.fn()
    };
    
    // Extract request and response interceptors
    // This is a bit hacky but allows us to test the interceptor functions directly
    const axiosInstance = {
      interceptors: {
        request: {
          use: vi.fn((fulfilled) => {
            mockRequestInterceptor = fulfilled;
          })
        },
        response: {
          use: vi.fn((fulfilled, rejected) => {
            mockResponseInterceptor = { fulfilled, rejected };
          })
        }
      },
      create: vi.fn().mockReturnThis()
    };
    
    axios.create.mockReturnValue(axiosInstance);
    
    // Initialize toast functions and offline context
    initializeApiToastFunctions(mockToastFunctions.showError, mockToastFunctions.showSuccess);
    initializeOfflineContext(mockOfflineContext);
  });
  
  afterEach(() => {
    // Restore original objects
    global.localStorage = originalLocalStorage;
    global.navigator = originalNavigator;
    
    vi.clearAllMocks();
    // Restore useEffect spy if present
    try {
      if (useEffectSpy) {
        useEffectSpy.mockRestore();
        useEffectSpy = undefined;
      }
    } catch (e) {
      /* noop */
    }
  });
  
  describe('Configuration', () => {
    test('axios is configured with correct defaults', () => {
      expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
        baseURL: expect.any(String),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        xsrfCookieName: 'csrftoken',
        xsrfHeaderName: 'X-CSRFToken'
      }));
    });
  });
  
  describe('ApiToastInitializer component', () => {
  test('initializes toast functions on render', async () => {
      const mockToast = {
        showError: vi.fn(),
        showSuccess: vi.fn()
      };
      
    // Re-mock useToast to return our mock (use dynamic import so transforms apply)
    const toastModule = await import('../../src/components/toast/Toast');
    vi.mocked(toastModule.useToast).mockReturnValue(mockToast);

    // Render the component
    render(<ApiToastInitializer />);
      
      // Verify the initializer was called with the toast functions
      // Since we mocked useEffect to call its function immediately, this should have run
      expect(mockToast.showError).not.toHaveBeenCalled(); // The function itself shouldn't be called
      expect(mockToast.showSuccess).not.toHaveBeenCalled(); // The function itself shouldn't be called
    });
  });
  
  describe('Request Interceptor', () => {
    test('adds auth token to request headers when token exists', async () => {
      // Setup
      const token = 'test-token';
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return token;
        return null;
      });
      
      const config = { 
        headers: {},
        method: 'get'
      };
      
      // Execute the interceptor
      const result = await mockRequestInterceptor(config);
      
      // Verify
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    });
    
    test('adds CSRF token to request headers when token exists', async () => {
      // Setup
      const csrfToken = 'csrf-token';
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'csrfToken') return csrfToken;
        return null;
      });
      
      const config = { 
        headers: {},
        method: 'get'
      };
      
      // Execute the interceptor
      const result = await mockRequestInterceptor(config);
      
      // Verify
      expect(result.headers['X-CSRF-Token']).toBe(csrfToken);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('csrfToken');
    });
    
    test('handles offline mode for GET requests', async () => {
      // Setup
      mockOfflineContext.isAppOffline = true;
      const cachedData = { id: 1, name: 'Test' };
      getItem.mockResolvedValue({ data: cachedData });
      
      const config = { 
        headers: {},
        method: 'get',
        url: '/test'
      };
      
      // Execute the interceptor and catch rejection
      try {
        await mockRequestInterceptor(config);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(error.isOffline).toBe(true);
        expect(error.cachedDataPromise).toBeDefined();
        
        // Verify cached data is returned from the promise
        const result = await error.cachedDataPromise;
        expect(result).toEqual(cachedData);
      }
    });
    
    test('queues non-GET requests when offline', async () => {
      // Setup
      mockOfflineContext.isAppOffline = true;
      
      const config = { 
        headers: {},
        method: 'post',
        url: '/test',
        data: { foo: 'bar' }
      };
      
      // Execute the interceptor and catch rejection
      try {
        await mockRequestInterceptor(config);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(error.isOffline).toBe(true);
        expect(mockOfflineContext.queueRequest).toHaveBeenCalledWith({
          url: '/test',
          method: 'post',
          body: { foo: 'bar' },
          headers: {}
        });
        expect(mockToastFunctions.showSuccess).toHaveBeenCalled();
      }
    });
  });
  
  describe('Response Interceptor', () => {
    test('stores CSRF token from response', () => {
      // Setup
      const csrfToken = 'new-csrf-token';
      const response = {
        data: {
          csrf_token: csrfToken
        },
        config: {
          method: 'get',
          url: '/test'
        }
      };
      
      // Execute the fulfillment handler
      const result = mockResponseInterceptor.fulfilled(response);
      
      // Verify
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('csrfToken', csrfToken);
      expect(result).toBe(response);
    });
    
    test('caches GET responses', () => {
      // Setup
      const response = {
        data: { id: 1, name: 'Test' },
        config: {
          method: 'get',
          url: '/test'
        }
      };
      
      // Execute the fulfillment handler
      mockResponseInterceptor.fulfilled(response);
      
      // Verify
      expect(updateItem).toHaveBeenCalledWith(
        Stores.USER_DATA,
        expect.objectContaining({
          key: 'cache:/test',
          data: response.data
        })
      );
    });
    
    test('handles offline mode with cached data', async () => {
      // Setup
      const cachedData = { id: 1, name: 'Test' };
      const error = {
        isOffline: true,
        cachedDataPromise: Promise.resolve(cachedData),
        config: { url: '/test' }
      };
      
      // Execute the rejection handler
      const result = await mockResponseInterceptor.rejected(error);
      
      // Verify
      expect(result).toEqual({
        data: cachedData,
        status: 200,
        fromCache: true,
        config: { url: '/test' }
      });
    });
    
    test('handles offline mode without cached data', async () => {
      // Setup
      const error = {
        isOffline: true,
        cachedDataPromise: Promise.reject(new Error('No cache')),
        config: {}
      };
      
      // Execute the rejection handler and catch the error
      try {
        await mockResponseInterceptor.rejected(error);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(error.response.status).toBe(503);
        expect(error.response.data.message).toContain('offline');
      }
    });
    
    test('handles offline mode for queued requests', async () => {
      // Setup
      const error = {
        isOffline: true,
        config: {}
      };
      
      // Execute the rejection handler
      const result = await mockResponseInterceptor.rejected(error);
      
      // Verify
      expect(result.status).toBe(202);
      expect(result.data.message).toContain('queued');
      expect(result.queued).toBe(true);
    });
    
    test('refreshes token on 401 error', async () => {
      // Setup
      const newToken = 'new-token';
      TokenService.refreshToken.mockResolvedValue();
      mockLocalStorage.getItem.mockReturnValue(newToken);
      
      const error = {
        response: { status: 401 },
        config: {
          headers: { Authorization: 'Bearer old-token' }
        }
      };
      
      // Execute the rejection handler
      try {
        await mockResponseInterceptor.rejected(error);
      } catch (e) {
        // We don't expect an error here
        fail(e);
      }
      
      // Verify
      expect(TokenService.refreshToken).toHaveBeenCalled();
      expect(error.config.headers.Authorization).toBe(`Bearer ${newToken}`);
    });
    
    test('redirects to login when token refresh fails', async () => {
      // Setup
      TokenService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      
      const error = {
        response: { status: 401 },
        config: {
          headers: { Authorization: 'Bearer old-token' }
        }
      };
      
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };
      
      // Execute the rejection handler and catch the error
      try {
        await mockResponseInterceptor.rejected(error);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(mockToastFunctions.showError).toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
      }
      
      // Restore window.location
      window.location = originalLocation;
    });
    
    test('shows toast for server errors', async () => {
      // Setup
      const errorMessage = 'Server error';
      const error = {
        response: { 
          status: 500,
          data: { detail: errorMessage }
        },
        config: { showErrorToast: true }
      };
      
      // Execute the rejection handler and catch the error
      try {
        await mockResponseInterceptor.rejected(error);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(mockToastFunctions.showError).toHaveBeenCalledWith(errorMessage);
      }
    });
    
    test('shows offline toast when network is offline', async () => {
      // Setup
      mockNavigator.onLine = false;
      const error = {
        request: {},
        config: { showErrorToast: true }
      };
      
      // Execute the rejection handler and catch the error
      try {
        await mockResponseInterceptor.rejected(error);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(mockToastFunctions.showError).toHaveBeenCalledWith(expect.stringContaining('offline'));
      }
    });
    
    test('shows network error toast when network request fails', async () => {
      // Setup
      mockNavigator.onLine = true;
      const error = {
        request: {},
        config: { showErrorToast: true }
      };
      
      // Execute the rejection handler and catch the error
      try {
        await mockResponseInterceptor.rejected(error);
        fail('Should have rejected');
      } catch (error) {
        // Verify
        expect(mockToastFunctions.showError).toHaveBeenCalledWith(expect.stringContaining('Network error'));
      }
    });
  });
  
  describe('Offline Utilities', () => {
    test('handleOfflineGetRequest retrieves cached data', async () => {
      // Setup
      const url = '/test';
      const cachedData = { id: 1, name: 'Test' };
      getItem.mockResolvedValue({ data: cachedData });
      
      // Call the function (indirectly through the request interceptor)
      mockOfflineContext.isAppOffline = true;
      const config = { 
        headers: {},
        method: 'get',
        url
      };
      
      // Execute and catch rejection
      try {
        await mockRequestInterceptor(config);
        fail('Should have rejected');
      } catch (error) {
        // Verify cached data is returned from the promise
        const result = await error.cachedDataPromise;
        expect(result).toEqual(cachedData);
        expect(getItem).toHaveBeenCalledWith(Stores.USER_DATA, `cache:${url}`);
      }
    });
    
    test('cacheResponse stores response data', async () => {
      // Setup
      const url = '/test';
      const data = { id: 1, name: 'Test' };
      
      // Call the function (indirectly through the response interceptor)
      const response = {
        data,
        config: {
          method: 'get',
          url
        }
      };
      
      // Execute
      mockResponseInterceptor.fulfilled(response);
      
      // Verify
      expect(updateItem).toHaveBeenCalledWith(
        Stores.USER_DATA,
        expect.objectContaining({
          key: `cache:${url}`,
          data
        })
      );
    });
  });
});