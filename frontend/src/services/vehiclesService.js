import api from './api';

export const getVehicles = async () => {
  return await api.get('/vehicles');
};