import api from './api';

const companiesService = {
  getCompanies: async () => {
    return await api.get('/companies');
  },
  
  getCompany: async (id) => {
    return await api.get(`/companies/${id}`);
  }
};

export default companiesService;