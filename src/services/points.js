import api from './api';

const PointsService = {
  getUserPoints: async () => {
    const response = await api.get('/points');
    return response.data;
  },
  
  getTransactionHistory: async () => {
    const response = await api.get('/points/history');
    return response.data;
  },
  
  addPoints: async (pointsData) => {
    const response = await api.post('/points', pointsData);
    return response.data;
  }
};

export default PointsService;