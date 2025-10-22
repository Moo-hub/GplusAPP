import api from './api';

export const getCompanies = async () => {
  return await api.get('/companies');
};