import api from './api';

export const getPaymentMethods = async () => {
  try { return await api.get('/payment-methods'); } catch (error) { throw error; }
};