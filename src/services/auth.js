import api from './api';

// Centralized keys to avoid typos
const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  csrf: 'csrfToken'
};

// Helpers for storage management
const saveAuth = ({ access_token, user, csrf_token }) => {
  if (access_token) localStorage.setItem(STORAGE_KEYS.token, access_token);
  if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  if (csrf_token) localStorage.setItem(STORAGE_KEYS.csrf, csrf_token);
};

const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.csrf);
};

// Base64url decode utility safe for browser/node
const base64UrlDecode = (input) => {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    if (typeof atob === 'function') {
      return atob(padded);
    }
    // Fallback for environments without atob
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

const AuthService = {
  /**
   * Login user using x-www-form-urlencoded body
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  login: async (email, password) => {
    try {
      // Use URLSearchParams to match application/x-www-form-urlencoded
      const body = new URLSearchParams({
        username: email,
        password
      });

      const response = await api.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true
      });

      saveAuth(response.data);
      return response.data;
    } catch (error) {
      // Let interceptors format errors; rethrow for caller handling
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User data including name, email, and password
   * @returns {Promise<Object>} New user data
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData, {
        withCredentials: true
      });
      // Auto-login if backend returns token
      saveAuth({
        access_token: response.data.token,
        user: response.data.user,
        csrf_token: response.data.csrf_token
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Log out the current user; always clear local state
   */
  logout: async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        await api.post('/auth/logout', {}, {
          withCredentials: true,
          headers: {
            'X-CSRF-Token': localStorage.getItem(STORAGE_KEYS.csrf) || ''
          }
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      clearAuth();
    }
  },

  /**
   * Get current user information
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: async () => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.token)) {
        throw new Error('No authentication token found');
      }
      const response = await api.get('/auth/me', { withCredentials: true });
      return response.data;
    } catch (error) {
      // Clear user data if the token is invalid
      if (error.response && error.response.status === 401) {
        clearAuth();
      }
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => !!localStorage.getItem(STORAGE_KEYS.token),

  /**
   * Check if token is expired for JWTs
   * @returns {boolean} True if token is expired or invalid
   */
  isTokenExpired: () => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) return true;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payloadStr = base64UrlDecode(parts[1]);
      if (!payloadStr) return true;
      const payload = JSON.parse(payloadStr);
      if (!payload.exp) return true;
      const expiry = payload.exp * 1000; // seconds to ms
      return Date.now() >= expiry;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true;
    }
  }
};

export default AuthService;