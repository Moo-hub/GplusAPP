import api from './api';

/**
 * Admin API service for interacting with admin-specific endpoints
 */
const adminApi = {
  // User Management
  getUsers: async (params = {}) => {
    return api.get('/admin/users', { params });
  },

  getUserById: async (userId) => {
    return api.get(`/admin/users/${userId}`);
  },

  createUser: async (userData) => {
    return api.post('/admin/users', userData);
  },

  updateUser: async (userId, userData) => {
    return api.put(`/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },

  resetUserPassword: async (userId, passwordData) => {
    return api.post(`/admin/users/${userId}/reset-password`, passwordData);
  },

  // Company Management
  getCompanies: async (params = {}) => {
    return api.get('/admin/companies', { params });
  },

  getCompanyById: async (companyId) => {
    return api.get(`/admin/companies/${companyId}`);
  },

  createCompany: async (companyData) => {
    return api.post('/admin/companies', companyData);
  },

  updateCompany: async (companyId, companyData) => {
    return api.put(`/admin/companies/${companyId}`, companyData);
  },

  deleteCompany: async (companyId) => {
    return api.delete(`/admin/companies/${companyId}`);
  },

  // Pickup Management
  getPickups: async (params = {}) => {
    return api.get('/admin/pickups', { params });
  },

  getPickupById: async (pickupId) => {
    return api.get(`/admin/pickups/${pickupId}`);
  },

  updatePickupStatus: async (pickupId, status) => {
    return api.patch(`/admin/pickups/${pickupId}`, { status });
  },

  // System Statistics
  getSystemStats: async (timeRange = 'month') => {
    return api.get('/admin/stats', { params: { timeRange } });
  },

  getPickupStats: async (params = {}) => {
    return api.get('/admin/stats/pickups', { params });
  },

  getMaterialStats: async (params = {}) => {
    return api.get('/admin/stats/materials', { params });
  },

  getUserStats: async (params = {}) => {
    return api.get('/admin/stats/users', { params });
  },
};

export default adminApi;