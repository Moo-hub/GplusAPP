import api from './api';

const vehiclesService = {
  getVehicles: async () => {
    return await api.get('/vehicles');
  },
  
  getVehicle: async (id) => {
    return await api.get(`/vehicles/${id}`);
  },
  
  getNearbyVehicles: async (lat, lng, radius = 5) => {
    return await api.get(`/vehicles/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }
};

export default vehiclesService;