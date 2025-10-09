import apiClient from './apiClient';

export const getCompanies = async () => {
  try {
    const response = await apiClient.get('/companies');
    return response.data;
  } catch (error) {
    throw error;
  }
};