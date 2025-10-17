import api from './api';
import { queryClient } from '../providers/QueryProvider';
import CSRFService from './csrf';

// Utility function to parse JWT tokens
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT', error);
    return null;
  }
};

// Token management service
const TokenService = {
  // Get access token
  getAccessToken: () => {
    return localStorage.getItem('token');
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  // Save tokens
  saveTokens: (accessToken, refreshToken) => {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Remove tokens
  removeTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    CSRFService.clearToken();
  },

  // Check if token is expired
  isTokenExpired: (token = null) => {
    const currentToken = token || TokenService.getAccessToken();
    
    if (!currentToken) {
      return true;
    }
    
    try {
      const decoded = parseJwt(currentToken);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      // Check if the token is expired
      // exp is in seconds, Date.now() is in milliseconds
      return decoded.exp * 1000 < Date.now();
    } catch (e) {
      console.error('Error checking token expiration', e);
      return true;
    }
  },

  // Refresh access token using refresh token
  refreshAccessToken: async () => {
    try {
      // For our new implementation, the refresh token is stored in an HTTP-only cookie
      // So we just need to call the refresh endpoint without sending the token in the body
      const csrfToken = CSRFService.getToken();
      
      const response = await api.post('/auth/refresh', {}, { 
        withCredentials: true, // Important to send and receive cookies
        headers: {
          'X-CSRF-Token': csrfToken || ''
        }
      });
      
      const { access_token } = response.data;
      
      // Save the new access token
      localStorage.setItem('token', access_token);
      
      // Update CSRF token if provided
      if (response.data.csrf_token) {
        CSRFService.setToken(response.data.csrf_token);
      }
      
      // Invalidate queries that might depend on authentication
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      return access_token;
    } catch (error) {
      console.error('Token refresh failed', error);
      TokenService.removeTokens();
      throw error;
    }
  }
};

export default TokenService;