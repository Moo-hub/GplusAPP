import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/toast/Toast';
import api from '../services/api';
import TokenService from '../services/token';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize user from localStorage and verify token on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user) {
          // Check if token is expired
          if (TokenService.isTokenExpired()) {
            // Try to refresh the token
            try {
              await TokenService.refreshAccessToken();
              setCurrentUser(user);
            } catch (error) {
              // If refresh fails, clear user data
              TokenService.removeTokens();
              setCurrentUser(null);
              console.warn('Session expired, please log in again');
            }
          } else {
            // Token is still valid
            setCurrentUser(user);
            // Set the user role from the user object
            setUserRole(user.role || 'user');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Save both access token and refresh token
      TokenService.saveTokens(
        response.data.access_token,
        response.data.refresh_token
      );
      
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user);
      setUserRole(response.data.user.role || 'user');
      
      return response.data.user;
    } catch (error) {
      console.error('Login error:', error);
      showError(t('auth.loginFailed'));
      throw error;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Save both access token and refresh token
      TokenService.saveTokens(
        response.data.access_token,
        response.data.refresh_token
      );
      
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user);
      setUserRole(response.data.user.role || 'user');
      
      return response.data.user;
    } catch (error) {
      console.error('Registration error:', error);
      showError(t('auth.registrationFailed'));
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call the logout API endpoint if available
      if (TokenService.getAccessToken()) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clean up local storage
      TokenService.removeTokens();
      localStorage.removeItem('user');
      setCurrentUser(null);
      setUserRole(null);
    }
  };
  
  const value = {
    currentUser,
    loading,
    userRole,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);