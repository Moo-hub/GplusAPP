import api from './api';

export const login = async (credentials) => {
  return await api.post('/auth/login', credentials);
};

export const register = async (userData) => {
  return await api.post('/auth/register', userData);
};

export const logout = async () => {
  return await api.post('/auth/logout');
};

export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

export const forgotPassword = async (email) => {
  return await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token, password, passwordConfirmation) => {
  return await api.post('/auth/reset-password', {
    token,
    password,
    password_confirmation: passwordConfirmation
  });
};