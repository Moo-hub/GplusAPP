import apiClient from './apiClient';

export const getPaymentMethods = async () => {
  try {
    const response = await apiClient.get('/payment-methods');
    return response.data;
  } catch (error) {
    throw error;
  }
};