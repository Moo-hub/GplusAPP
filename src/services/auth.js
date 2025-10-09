import api from './api';

const AuthService = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  login: async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true // Important to receive and store cookies
      });
      
      // Save access token and user data to local storage
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Save CSRF token if available
        if (response.data.csrf_token) {
          localStorage.setItem('csrfToken', response.data.csrf_token);
        }
      }
      
      return response.data;
    } catch (error) {
      // Error handling is now managed by API interceptors
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
      const response = await api.post('/auth/register', userData);
      
      // Automatically log in the user after registration if token is provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      // Error handling is now managed by API interceptors
      throw error;
    }
  },
  
  /**
   * Log out the current user
   */
  logout: async () => {
    try {
      // Call logout endpoint to blacklist the token
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout', {}, {
          withCredentials: true, // Important to send cookies
          headers: {
            'X-CSRF-Token': localStorage.getItem('csrfToken')
          }
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage and cookies regardless of API success
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('csrfToken');
    }
  },
  
  /**
   * Get current user information
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: async () => {
    try {
      if (!localStorage.getItem('token')) {
        throw new Error('No authentication token found');
      }
      
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // Clear user data if the token is invalid
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired or invalid
   */
  isTokenExpired: () => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    
    try {
      // For JWT tokens, you could decode and check expiration
      // This is a simplified version - implement proper JWT verification
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return true;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiry = payload.exp * 1000; // Convert seconds to milliseconds
      return Date.now() >= expiry;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true;
    }
  }
};

export default AuthService;