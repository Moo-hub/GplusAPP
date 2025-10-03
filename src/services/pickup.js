import api from './api';

const PickupService = {
  getAllPickups: async () => {
    const response = await api.get('/pickup');
    return response.data;
  },
  
  getPickupById: async (id) => {
    const response = await api.get(`/pickup/${id}`);
    return response.data;
  },
  
  createPickup: async (pickupData) => {
    const response = await api.post('/pickup', pickupData);
    return response.data;
  },
  
  updatePickup: async (id, pickupData) => {
    const response = await api.put(`/pickup/${id}`, pickupData);
    return response.data;
  },
  
  cancelPickup: async (id) => {
    await api.delete(`/pickup/${id}`);
  }
};

export default PickupService;