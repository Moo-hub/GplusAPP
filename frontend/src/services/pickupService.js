import apiClient from './apiClient';

export const requestPickup = async (data) => {
  try {
    const response = await apiClient.post('/pickup', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};