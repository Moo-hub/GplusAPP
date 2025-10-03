import api from './api';

const PartnersService = {
  getPartners: async (isActive = true) => {
    const response = await api.get('/partners', { params: { is_active: isActive } });
    return response.data;
  },
  
  getPartner: async (partnerId) => {
    const response = await api.get(`/partners/${partnerId}`);
    return response.data;
  }
};

export default PartnersService;