import { useState, useEffect } from 'react';

/**
 * Service for managing CSRF tokens
 */
const CSRFService = {
  /**
   * Get the current CSRF token
   * @returns {string|null} The CSRF token or null if not available
   */
  getToken: () => {
    // Try to get from memory storage first (most up-to-date)
    const memoryToken = window.__CSRF_TOKEN__;
    if (memoryToken) {
      return memoryToken;
    }

    // Next, try to get from localStorage (persisted between page refreshes)
    const storedToken = localStorage.getItem('csrfToken');
    if (storedToken) {
      // Store in memory for future use
      window.__CSRF_TOKEN__ = storedToken;
      return storedToken;
    }

    // Finally, try to get from cookie (fallback)
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='));

    if (csrfCookie) {
      const token = csrfCookie.split('=')[1];
      // Store in memory and localStorage for future use
      window.__CSRF_TOKEN__ = token;
      localStorage.setItem('csrfToken', token);
      return token;
    }

    return null;
  },

  /**
   * Set a new CSRF token
   * @param {string} token The CSRF token to set
   */
  setToken: (token) => {
    if (!token) return;

    // Store in memory for immediate use
    window.__CSRF_TOKEN__ = token;
    
    // Store in localStorage for persistence between page refreshes
    localStorage.setItem('csrfToken', token);
  },

  /**
   * Clear the CSRF token (useful during logout)
   */
  clearToken: () => {
    // Clear from memory
    delete window.__CSRF_TOKEN__;
    
    // Clear from localStorage
    localStorage.removeItem('csrfToken');
  },

  /**
   * Refresh the CSRF token
   * This should be called when starting a new session or when a token is rejected
   * @returns {Promise<string>} A promise that resolves to the new CSRF token
   */
  refreshToken: async () => {
    try {
      // We'll use the refresh endpoint to get a new token
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${base}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Needed to include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh CSRF token');
      }

      const data = await response.json();
      
      if (data.csrf_token) {
        CSRFService.setToken(data.csrf_token);
        return data.csrf_token;
      } else {
        throw new Error('No CSRF token in response');
      }
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
      throw error;
    }
  }
};

/**
 * React hook for using CSRF token in components
 * @returns {Object} Object containing CSRF token and related functions
 */
export const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState(CSRFService.getToken());

  useEffect(() => {
    // If no token is available, try to refresh it
    if (!csrfToken) {
      CSRFService.refreshToken()
        .then(token => setCsrfToken(token))
        .catch(err => console.error('Could not refresh CSRF token:', err));
    }
  }, [csrfToken]);

  return {
    token: csrfToken,
    setToken: (token) => {
      CSRFService.setToken(token);
      setCsrfToken(token);
    },
    refresh: async () => {
      const token = await CSRFService.refreshToken();
      setCsrfToken(token);
      return token;
    },
    clear: () => {
      CSRFService.clearToken();
      setCsrfToken(null);
    }
  };
};

export default CSRFService;