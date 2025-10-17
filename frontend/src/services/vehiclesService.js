import apiClient from './apiClient';

export const getVehicles = async () => {
  try {
    const response = await apiClient.get('/vehicles');
    return response.data;
  } catch (error) {
    throw error;
  }
};