import api from './api';

const RedemptionOptionsService = {
  getOptions: async (params = {}) => {
    const response = await api.get('/redemption-options', { params });
    return response.data;
  },
  
  getOption: async (optionId) => {
    const response = await api.get(`/redemption-options/${optionId}`);
    return response.data;
  },
  
  getOptionsByPartner: async (partnerId) => {
    const response = await api.get('/redemption-options', { 
      params: { 
        partner_id: partnerId,
        is_active: true
      } 
    });
    return response.data;
  },
  
  getOptionsByCategory: async (category) => {
    const response = await api.get('/redemption-options', { 
      params: { 
        category,
        is_active: true
      } 
    });
    return response.data;
  }
};

export default RedemptionOptionsService;