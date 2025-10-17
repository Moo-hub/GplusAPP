import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import CSRFService, { useCSRF } from '../../src/services/csrf';
import { renderHook, act } from '@testing-library/react';

// Mock fetch
global.fetch = vi.fn();

describe('CSRFService', () => {
  // Clear any stored tokens before each test
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear memory storage
    delete window.__CSRF_TOKEN__;
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  test('getToken should return null when no token is available', () => {
    const token = CSRFService.getToken();
    expect(token).toBeNull();
  });
  
  test('getToken should retrieve token from memory', () => {
    // Set token in memory
    window.__CSRF_TOKEN__ = 'memory-token';
    
    const token = CSRFService.getToken();
    expect(token).toBe('memory-token');
  });
  
  test('getToken should retrieve token from localStorage if not in memory', () => {
    // Set token in localStorage
    localStorage.setItem('csrfToken', 'local-storage-token');
    
    const token = CSRFService.getToken();
    expect(token).toBe('local-storage-token');
    // Should also store in memory for future use
    expect(window.__CSRF_TOKEN__).toBe('local-storage-token');
  });
  
  test('getToken should retrieve token from cookie if not in memory or localStorage', () => {
    // Set token in cookie
    document.cookie = 'csrf_token=cookie-token';
    
    const token = CSRFService.getToken();
    expect(token).toBe('cookie-token');
    // Should also store in memory and localStorage for future use
    expect(window.__CSRF_TOKEN__).toBe('cookie-token');
    expect(localStorage.getItem('csrfToken')).toBe('cookie-token');
  });
  
  test('setToken should store token in memory and localStorage', () => {
    CSRFService.setToken('new-token');
    
    expect(window.__CSRF_TOKEN__).toBe('new-token');
    expect(localStorage.getItem('csrfToken')).toBe('new-token');
  });
  
  test('setToken should do nothing if token is falsy', () => {
    // Set initial values
    window.__CSRF_TOKEN__ = 'existing-token';
    localStorage.setItem('csrfToken', 'existing-token');
    
    // Call setToken with undefined
    CSRFService.setToken(undefined);
    
    // Values should remain unchanged
    expect(window.__CSRF_TOKEN__).toBe('existing-token');
    expect(localStorage.getItem('csrfToken')).toBe('existing-token');
  });
  
  test('clearToken should remove token from memory and localStorage', () => {
    // Set initial values
    window.__CSRF_TOKEN__ = 'token-to-clear';
    localStorage.setItem('csrfToken', 'token-to-clear');
    
    CSRFService.clearToken();
    
    // Values should be cleared
    expect(window.__CSRF_TOKEN__).toBeUndefined();
    expect(localStorage.getItem('csrfToken')).toBeNull();
  });
  
  test('refreshToken should fetch a new token and store it', async () => {
    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrf_token: 'new-refreshed-token' }),
    });
    
    const token = await CSRFService.refreshToken();
    
    expect(token).toBe('new-refreshed-token');
    expect(window.__CSRF_TOKEN__).toBe('new-refreshed-token');
    expect(localStorage.getItem('csrfToken')).toBe('new-refreshed-token');
  });
  
  test('refreshToken should throw error if fetch fails', async () => {
    // Mock failed fetch
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(CSRFService.refreshToken()).rejects.toThrow('Network error');
  });
  
  test('refreshToken should throw error if response has no token', async () => {
    // Mock successful fetch but with no token
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success but no token' }),
    });
    
    await expect(CSRFService.refreshToken()).rejects.toThrow('No CSRF token in response');
  });
});

describe('useCSRF hook', () => {
  beforeEach(() => {
    // Clear localStorage and memory
    localStorage.clear();
    delete window.__CSRF_TOKEN__;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  test('should return token and functions', () => {
    // Set up initial token
    localStorage.setItem('csrfToken', 'initial-token');
    
    const { result } = renderHook(() => useCSRF());
    
    expect(result.current.token).toBe('initial-token');
    expect(typeof result.current.setToken).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.clear).toBe('function');
  });
  
  test('setToken should update token state and storage', () => {
    const { result } = renderHook(() => useCSRF());
    
    act(() => {
      result.current.setToken('updated-token');
    });
    
    expect(result.current.token).toBe('updated-token');
    expect(localStorage.getItem('csrfToken')).toBe('updated-token');
    expect(window.__CSRF_TOKEN__).toBe('updated-token');
  });
  
  test('clear should remove token from state and storage', () => {
    // Set initial token
    localStorage.setItem('csrfToken', 'token-to-clear');
    window.__CSRF_TOKEN__ = 'token-to-clear';
    
    const { result } = renderHook(() => useCSRF());
    
    // Initial state should have the token
    expect(result.current.token).toBe('token-to-clear');
    
    act(() => {
      result.current.clear();
    });
    
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('csrfToken')).toBeNull();
    expect(window.__CSRF_TOKEN__).toBeUndefined();
  });
  
  test('refresh should update token state with fetched token', async () => {
    // Mock the refreshToken method
    const mockRefreshToken = vi.spyOn(CSRFService, 'refreshToken')
      .mockResolvedValue('refreshed-token');
    
    const { result } = renderHook(() => useCSRF());
    
    let refreshedToken;
    await act(async () => {
      refreshedToken = await result.current.refresh();
    });
    
    expect(refreshedToken).toBe('refreshed-token');
    expect(result.current.token).toBe('refreshed-token');
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });
  
  test('refresh should throw and not update state if fetch fails', async () => {
    // Set initial token
    localStorage.setItem('csrfToken', 'initial-token');
    
    // Mock the refreshToken method to throw
    vi.spyOn(CSRFService, 'refreshToken')
      .mockRejectedValue(new Error('Refresh failed'));
    
    const { result } = renderHook(() => useCSRF());
    
    await expect(async () => {
      await act(async () => {
        await result.current.refresh();
      });
    }).rejects.toThrow('Refresh failed');
    
    // Token state should remain unchanged
    expect(result.current.token).toBe('initial-token');
  });
});