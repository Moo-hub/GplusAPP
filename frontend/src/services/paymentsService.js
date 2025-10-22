import api from './api';

export const getPaymentMethods = async () => {
  return await api.get('/payment-methods');
};