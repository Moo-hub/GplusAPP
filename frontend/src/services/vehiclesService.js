import api from './api';

export const getVehicles = async () => {
  try { return await api.get('/vehicles'); } catch (error) { throw error; }
};