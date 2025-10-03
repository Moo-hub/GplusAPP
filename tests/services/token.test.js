import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import TokenService, { parseJwt } from '../../src/services/token';
import CSRFService from '../../src/services/csrf';

// Mock dependencies
vi.mock('../../src/services/api');
vi.mock('../../src/providers/QueryProvider', () => ({
  queryClient: {
    invalidateQueries: vi.fn()
  }
}));
vi.mock('../../src/services/csrf');

describe('TokenService', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock api module
    return import('../../src/services/api').then(api => {
      api.default.post = vi.fn();
    });
  });
  
  describe('parseJwt', () => {
    test('should parse a valid JWT token', () => {
      // Create a test token - this represents a JWT with payload { sub: "1234", exp: future timestamp }
      const payload = { sub: '1234', exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const result = parseJwt(token);
      
      expect(result).toEqual(payload);
    });
    
    test('should return null for invalid token', () => {
      const result = parseJwt('invalid-token');
      
      expect(result).toBeNull();
    });
  });
  
  describe('getAccessToken', () => {
    test('should return token from localStorage', () => {
      localStorage.setItem('token', 'test-access-token');
      
      const token = TokenService.getAccessToken();
      
      expect(token).toBe('test-access-token');
    });
    
    test('should return null if token is not in localStorage', () => {
      const token = TokenService.getAccessToken();
      
      expect(token).toBeNull();
    });
  });
  
  describe('getRefreshToken', () => {
    test('should return refresh token from localStorage', () => {
      localStorage.setItem('refreshToken', 'test-refresh-token');
      
      const token = TokenService.getRefreshToken();
      
      expect(token).toBe('test-refresh-token');
    });
    
    test('should return null if refresh token is not in localStorage', () => {
      const token = TokenService.getRefreshToken();
      
      expect(token).toBeNull();
    });
  });
  
  describe('saveTokens', () => {
    test('should save access token to localStorage', () => {
      TokenService.saveTokens('new-access-token');
      
      expect(localStorage.getItem('token')).toBe('new-access-token');
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
    
    test('should save both access and refresh tokens to localStorage', () => {
      TokenService.saveTokens('new-access-token', 'new-refresh-token');
      
      expect(localStorage.getItem('token')).toBe('new-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    });
  });
  
  describe('removeTokens', () => {
    test('should remove tokens from localStorage and clear CSRF token', () => {
      // Set tokens first
      localStorage.setItem('token', 'access-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      
      TokenService.removeTokens();
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(CSRFService.clearToken).toHaveBeenCalled();
    });
  });
  
  describe('isTokenExpired', () => {
    test('should return true for null token', () => {
      const result = TokenService.isTokenExpired(null);
      
      expect(result).toBe(true);
    });
    
    test('should return true for expired token', () => {
      // Create an expired token payload
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour in the past
      const expiredToken = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const result = TokenService.isTokenExpired(expiredToken);
      
      expect(result).toBe(true);
    });
    
    test('should return false for valid token', () => {
      // Create a valid token payload
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour in the future
      const validToken = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const result = TokenService.isTokenExpired(validToken);
      
      expect(result).toBe(false);
    });
    
    test('should return true for token without exp claim', () => {
      // Create token without exp claim
      const payload = { sub: '1234' };
      const invalidToken = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const result = TokenService.isTokenExpired(invalidToken);
      
      expect(result).toBe(true);
    });
    
    test('should return true for invalid token format', () => {
      const result = TokenService.isTokenExpired('invalid-token');
      
      expect(result).toBe(true);
    });
    
    test('should use stored token if none provided', () => {
      // Mock getAccessToken
      vi.spyOn(TokenService, 'getAccessToken').mockReturnValue('stored-token');
      // Mock parseJwt
      vi.spyOn(global, 'parseJwt').mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
      
      const result = TokenService.isTokenExpired();
      
      expect(TokenService.getAccessToken).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('refreshAccessToken', () => {
    test('should request a new token and store it', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          csrf_token: 'new-csrf-token'
        }
      };
      
      const api = await import('../../src/services/api');
      api.default.post.mockResolvedValue(mockResponse);
      
      // Mock CSRFService.getToken
      CSRFService.getToken.mockReturnValue('existing-csrf-token');
      
      const result = await TokenService.refreshAccessToken();
      
      // Verify API call
      expect(api.default.post).toHaveBeenCalledWith(
        '/auth/refresh',
        {},
        expect.objectContaining({
          withCredentials: true,
          headers: expect.objectContaining({
            'X-CSRF-Token': 'existing-csrf-token'
          })
        })
      );
      
      // Verify token storage
      expect(localStorage.getItem('token')).toBe('new-access-token');
      expect(CSRFService.setToken).toHaveBeenCalledWith('new-csrf-token');
      
      // Verify return value
      expect(result).toBe('new-access-token');
    });
    
    test('should throw and clear tokens on error', async () => {
      // Mock API response with error
      const api = await import('../../src/services/api');
      api.default.post.mockRejectedValue(new Error('Refresh failed'));
      
      // Add spy on removeTokens
      const removeTokensSpy = vi.spyOn(TokenService, 'removeTokens');
      
      await expect(TokenService.refreshAccessToken()).rejects.toThrow('Refresh failed');
      expect(removeTokensSpy).toHaveBeenCalled();
    });
  });
});