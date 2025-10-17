import api from './api';

const CompanyService = {
  getAllCompanies: async () => {
    const response = await api.get('/companies');
    return response.data;
  },
  
  getCompanyById: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  }
};

export default CompanyService;