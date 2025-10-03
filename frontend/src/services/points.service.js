import api from './api';

const pointsService = {
  getPointsSummary: async () => {
    return await api.get('/points');
  },
  
  getPointsHistory: async () => {
    return await api.get('/points/history');
  },
  
  getImpactData: async () => {
    return await api.get('/points/impact');
  }
};

export default pointsService;