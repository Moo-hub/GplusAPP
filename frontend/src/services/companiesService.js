import api from './api';

export const getCompanies = async () => {
  try { return await api.get('/companies'); } catch (error) { throw error; }
};