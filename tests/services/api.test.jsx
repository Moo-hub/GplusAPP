/// <reference types="vitest" />
/// <reference types="jsdom" />
// @vitest-environment jsdom
// Ensure DOM globals are defined before any React rendering
if (typeof window !== 'undefined') {
  if (!window.location) window.location = { pathname: '/', href: '/' };
  if (!window.navigator) window.navigator = { userAgent: 'node.js' };
}
import '../../vitest.setup.js';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';

// Mock dependencies first
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() }))
}));

// Provide a stable axios.create mock that returns an instance with interceptors
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
vi.mock('../../src/services/csrf');
vi.mock('../../src/components/toast/Toast', () => ({
  useToast: vi.fn().mockReturnValue({
    showError: vi.fn(),
    showSuccess: vi.fn()
  })
}));

import axios from 'axios';
let api;
let initializeApiToastFunctions;
let ApiToastInitializer;
let initApiInterceptors;
let setApiInstance;
let createApiInstance;
import TokenService from '../../src/services/token';
import CSRFService from '../../src/services/csrf';
import { render } from '@testing-library/react';

describe('API Service', () => {
  let mockAxiosCreate;
  let mockAxiosInstance;
  let mockRequest;
  let mockRequestInterceptor;
  let mockResponseInterceptor;
  
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock axios create and its returned instance
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: vi.fn((onFulfilled) => {
            mockRequestInterceptor = onFulfilled;
            return 1; // Return an ID for the interceptor
          })
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            mockResponseInterceptor = { onFulfilled, onRejected };
            return 2; // Return an ID for the interceptor
          })
        },
        defaults: {}
      },
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
  // Ensure axios.create returns instance before importing api module
  mockAxiosCreate = axios.create.mockReturnValue(mockAxiosInstance);

  // Prepare TokenService and CSRFService mocks before importing module
  TokenService.getAccessToken.mockReturnValue('mock-token');
  TokenService.isTokenExpired.mockReturnValue(false);
  CSRFService.getToken.mockReturnValue('mock-csrf-token');
  CSRFService.refreshToken = vi.fn().mockRejectedValue(new Error('CSRF refresh failed'));

  // Dynamically import the api module after mocks are ready
    return import('../../src/services/api').then((mod) => {
      api = mod.default;
      initializeApiToastFunctions = mod.initializeApiToastFunctions;
      ApiToastInitializer = mod.ApiToastInitializer;
      initApiInterceptors = mod.initApiInterceptors;
      setApiInstance = mod.setApiInstance;
      createApiInstance = mod.createApiInstance;
      // Inject our mocked axios instance, then create default instance to call axios.create
      setApiInstance(mockAxiosInstance);
      createApiInstance();
      // Reassign mockRequest now that interceptors are (re)attached
      mockRequest = {
        headers: {},
        method: 'get',
        url: '/test-endpoint',
        params: {}
      };
    });
    
    // Set up request object for interceptor tests
    mockRequest = {
      headers: {},
      method: 'get',
      url: '/test-endpoint',
      params: {}
    };
    
    // Create a mock for document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=cookie-csrf-token',
    });
  });
  
  afterEach(() => {
    // Clean up
    delete window.location;
    window.location = { pathname: '/', href: '/' };
  });
  
  test('creates an axios instance with correct default config', () => {
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: expect.stringContaining('/api/v1'),
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      }),
      xsrfCookieName: 'csrf_token',
      xsrfHeaderName: 'X-CSRF-Token',
    }));
  });
  
  test('request interceptor adds authorization header with token', async () => {
    // Execute the interceptor with our mock request
    const result = await mockRequestInterceptor(mockRequest);
    
    // Verify it added the Authorization header with our mock token
    expect(result.headers.Authorization).toBe('Bearer mock-token');
  });
  
  test('request interceptor adds timestamp to GET requests', async () => {
    mockRequest.method = 'get';
    
    const result = await mockRequestInterceptor(mockRequest);
    
    // Verify it added the timestamp parameter
    expect(result.params._t).toBeDefined();
  });
  
  test('request interceptor does not add timestamp to non-GET requests', async () => {
    mockRequest.method = 'post';
    
    const result = await mockRequestInterceptor(mockRequest);
    
    // Verify it did not add the timestamp parameter
    expect(result.params._t).toBeUndefined();
  });
  
  test('request interceptor adds CSRF token for mutation requests', async () => {
    mockRequest.method = 'post';
    
    const result = await mockRequestInterceptor(mockRequest);
    
    // Should use the token from CSRFService
    expect(result.headers['X-CSRF-Token']).toBe('mock-csrf-token');
  });
  
  test('request interceptor does not add CSRF token for safe methods', async () => {
    mockRequest.method = 'get';
    
    const result = await mockRequestInterceptor(mockRequest);
    
    // Should not add CSRF token for GET requests
    expect(result.headers['X-CSRF-Token']).toBeUndefined();
  });
  
  test('response interceptor stores CSRF token from response', () => {
    const response = {
      data: {
        csrf_token: 'new-csrf-token'
      }
    };
    
    // Execute the response interceptor
    const result = mockResponseInterceptor.onFulfilled(response);
    
    // Should call CSRFService.setToken with the new token
    expect(CSRFService.setToken).toHaveBeenCalledWith('new-csrf-token');
  });
  
  test('response interceptor handles 401 error by clearing tokens', async () => {
    const error = {
      response: { status: 401 },
      config: { _retry: false }
    };
    
    // Mock window.location for redirection testing
    delete window.location;
    window.location = { pathname: '/profile', href: '/profile' };
    
    try {
      await mockResponseInterceptor.onRejected(error);
    } catch (err) {
      // Expected to throw
    }
    
    // Should remove tokens
    expect(TokenService.removeTokens).toHaveBeenCalled();
  });
  
  test('response interceptor handles CSRF error (419)', async () => {
    // Setup mock toast functions
    const mockShowError = vi.fn();
    initializeApiToastFunctions(mockShowError, vi.fn());
    
    const error = {
      response: { status: 419 },
      config: { _retry: false }
    };
    
    // Mock window.location for redirection testing
    global.setTimeout = vi.fn();
    global.window.location.reload = vi.fn();
    
    try {
      await mockResponseInterceptor.onRejected(error);
    } catch (err) {
      // Expected to throw
    }
    // Should show error toast
    expect(mockShowError).toHaveBeenCalled();
    // Should set timeout to reload page
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
  });
});

// --- Toast Initializer Test ---
// describe('ApiToastInitializer', () => {
//   beforeAll(() => {
//     if (!window.location) {
//       window.location = { pathname: '/', href: '/' };
//     }
//   });
//   test('renders ApiToastInitializer without crashing', () => {
//     render(<ApiToastInitializer />);
//   });
// });
