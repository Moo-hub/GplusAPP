import React, { createContext, useState, useEffect, useContext } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import websocketService from '../services/websocket.service';

// Type definitions for better type checking
/**
 * @typedef {Object} User
 * @property {number|string} id - The user's ID
 * @property {string} name - The user's name
 * @property {string} email - The user's email
 * @property {string} [role] - The user's role (optional)
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} currentUser - The currently logged in user
 * @property {boolean} loading - Whether authentication state is being loaded
 * @property {(email: string, password: string) => Promise<User>} login - Function to log in
 * @property {(userData: Object) => Promise<User>} register - Function to register
 * @property {() => void} logout - Function to log out
 * @property {() => Promise<any>} refreshProfile - Function to refresh the user profile
 */

/** @type {React.Context<AuthContextType>} */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize user from localStorage on app load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
      websocketService.connect(); // Connect WebSocket if user exists
    }
    setLoading(false);
  }, []);

  // Handle auth errors from WebSocket or API
  useEffect(() => {
    const handleAuthError = () => {
      logout();
      showError(t('auth.sessionExpired'));
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, [t]);

  // Login function
  const login = async (email, password) => {
    try {
      // Send OAuth2PasswordRequestForm as x-www-form-urlencoded
      const body = new URLSearchParams({
        username: email,
        password: password,
      });

      // Use relative path; baseURL normalization appends '/api/v1'
      const data = await api.post('/auth/login', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Handle the response data safely - check if properties exist
  // @ts-ignore - axios instance returns response.data; fields are present in backend response
  const token = data?.access_token ?? data?.token;
  // @ts-ignore
  const user = data?.user ?? null;
      
      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      
      // Connect WebSocket after successful login
      websocketService.connect();
      
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
  const data = await api.post('/auth/register', userData);
      
      // Handle response data safely
  // @ts-ignore
  const token = data?.access_token ?? data?.token;
  // @ts-ignore
  const user = data?.user ?? null;
      
      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      
      // Connect WebSocket after successful registration
      websocketService.connect();
      
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };
  
  // Logout function
  const logout = () => {
    websocketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };
  
  // Refresh user profile
  const refreshProfile = async () => {
    try {
      // Use the updated API endpoint path
  const userData = await api.get('/auth/me');
      
      // Make sure userData is valid
      if (userData && typeof userData === 'object') {
  localStorage.setItem('user', JSON.stringify(userData));
  setCurrentUser(userData);
  return userData;
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // The API interceptor will handle 401 errors
      return null;
    }
  };
  
  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);