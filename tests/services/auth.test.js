import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthService from '../../src/services/auth';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

// Import the mocked API
import api from '../../src/services/api';

describe('AuthService', () => {
  // Setup localStorage mock
  let localStorageMock = {};

  beforeEach(() => {
    localStorageMock = {};
    
    // Mock localStorage methods
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(key => localStorageMock[key] || null),
        setItem: vi.fn((key, value) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn(key => {
          delete localStorageMock[key];
        })
      },
      writable: true
    });
    
    // Reset API mocks
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call API with correct parameters', async () => {
      // Setup
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          user: { id: 1, name: 'Test User', email: 'test@example.com' },
          csrf_token: 'mock-csrf-token'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      // Execute
      const result = await AuthService.login('test@example.com', 'password123');

      // Verify
      expect(api.post).toHaveBeenCalledWith(
        '/auth/login',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          }),
          withCredentials: true
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should store token, user data, and CSRF token in localStorage upon successful login', async () => {
      // Setup
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          user: mockUser,
          csrf_token: 'mock-csrf-token'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      // Execute
      await AuthService.login('test@example.com', 'password123');

      // Verify
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(localStorage.setItem).toHaveBeenCalledWith('csrfToken', 'mock-csrf-token');
    });

    it('should throw error when login API fails', async () => {
      // Setup
      const mockError = new Error('Login failed');
      api.post.mockRejectedValue(mockError);

      // Execute & Verify
      await expect(AuthService.login('test@example.com', 'wrong-password')).rejects.toThrow('Login failed');
    });
  });

  describe('register', () => {
    it('should call API with correct user data', async () => {
      // Setup
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'secure123'
      };
      const mockResponse = {
        data: {
          token: 'new-user-token',
          user: { id: 2, name: userData.name, email: userData.email }
        }
      };
      api.post.mockResolvedValue(mockResponse);

      // Execute
      const result = await AuthService.register(userData);

      // Verify
      expect(api.post).toHaveBeenCalledWith(
        '/auth/register',
        userData,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should automatically log in user after registration if token is provided', async () => {
      // Setup
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'secure123'
      };
      const mockUser = { id: 2, name: userData.name, email: userData.email };
      const mockResponse = {
        data: {
          token: 'new-user-token',
          user: mockUser
        }
      };
      api.post.mockResolvedValue(mockResponse);

      // Execute
      await AuthService.register(userData);

      // Verify
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-user-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    it('should call logout API when token exists', async () => {
      // Setup
      localStorageMock = {
        token: 'existing-token',
        csrfToken: 'existing-csrf-token'
      };

      // Execute
      await AuthService.logout();

      // Verify
      expect(api.post).toHaveBeenCalledWith(
        '/auth/logout',
        {},
        expect.objectContaining({
          withCredentials: true,
          headers: {
            'X-CSRF-Token': 'existing-csrf-token'
          }
        })
      );
    });

    it('should clear localStorage even if API call fails', async () => {
      // Setup
      localStorageMock = {
        token: 'existing-token',
        user: JSON.stringify({ id: 1, name: 'Test User' }),
        csrfToken: 'existing-csrf-token'
      };
      api.post.mockRejectedValue(new Error('Logout API failed'));

      // Execute
      await AuthService.logout();

      // Verify
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('csrfToken');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch and return current user data', async () => {
      // Setup
      localStorageMock = { token: 'valid-token' };
      const mockUserData = { id: 1, name: 'Current User', email: 'current@example.com' };
      api.get.mockResolvedValue({ data: mockUserData });

      // Execute
      const result = await AuthService.getCurrentUser();

      // Verify
      expect(api.get).toHaveBeenCalledWith(
        '/auth/me',
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockUserData);
    });

    it('should throw error when no token is found', async () => {
      // Execute & Verify
      await expect(AuthService.getCurrentUser()).rejects.toThrow('No authentication token found');
    });

    it('should clear user data on 401 unauthorized error', async () => {
      // Setup
      localStorageMock = { 
        token: 'invalid-token',
        user: JSON.stringify({ id: 1, name: 'User' })
      };
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      api.get.mockRejectedValue(unauthorizedError);

      // Execute
      try {
        await AuthService.getCurrentUser();
      } catch (error) {
        // Expected to throw
      }

      // Verify localStorage items were removed
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      // Setup
      localStorageMock = { token: 'existing-token' };

      // Execute & Verify
      expect(AuthService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      // Execute & Verify
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when token does not exist', () => {
      // Execute & Verify
      expect(AuthService.isTokenExpired()).toBe(true);
    });

    it('should return true when token is invalid format', () => {
      // Setup
      localStorageMock = { token: 'invalid-format-token' };

      // Execute & Verify
      expect(AuthService.isTokenExpired()).toBe(true);
    });

    it('should return true when token is expired', () => {
      // Setup - create an expired token (expiry in the past)
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      localStorageMock = { token: expiredToken };

      // Mock atob function
      global.atob = vi.fn(() => JSON.stringify(expiredPayload));

      // Execute & Verify
      expect(AuthService.isTokenExpired()).toBe(true);
    });

    it('should return false when token is valid and not expired', () => {
      // Setup - create a valid token (expiry in the future)
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      localStorageMock = { token: validToken };

      // Mock atob function
      global.atob = vi.fn(() => JSON.stringify(validPayload));

      // Execute & Verify
      expect(AuthService.isTokenExpired()).toBe(false);
    });
  });
});