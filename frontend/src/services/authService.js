import api from './api';

export const login = async (credentials) => {
  try { return await api.post('/auth/login', credentials); } catch (error) { throw error; }
};

export const register = async (userData) => {
  try { return await api.post('/auth/register', userData); } catch (error) { throw error; }
};

export const logout = async () => {
  try { return await api.post('/auth/logout'); } catch (error) { throw error; }
};

export const getCurrentUser = async () => {
  try { return await api.get('/auth/me'); } catch (error) { throw error; }
};

export const forgotPassword = async (email) => {
  try { return await api.post('/auth/forgot-password', { email }); } catch (error) { throw error; }
};

export const resetPassword = async (token, password, passwordConfirmation) => {
  try { return await api.post('/auth/reset-password', {
    token,
    password,
    password_confirmation: passwordConfirmation
  }); } catch (error) { throw error; }
};