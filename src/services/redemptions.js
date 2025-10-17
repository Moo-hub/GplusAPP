import api from './api';

const RedemptionsService = {
  getUserRedemptions: async (params = {}) => {
    const response = await api.get('/redemptions', { params });
    return response.data;
  },
  
  getRedemption: async (redemptionId) => {
    const response = await api.get(`/redemptions/${redemptionId}`);
    return response.data;
  },
  
  redeemPoints: async (optionId) => {
    const response = await api.post('/redemptions', { option_id: optionId });
    return response.data;
  },
  
  cancelRedemption: async (redemptionId) => {
    const response = await api.put(`/redemptions/${redemptionId}/cancel`);
    return response.data;
  }
};

export default RedemptionsService;