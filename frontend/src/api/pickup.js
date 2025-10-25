import apiClient from '../services/apiClient.js';

export const requestPickup = async (data) => {
  const res = await apiClient.post('/v1/pickups', data || {});
  // apiClient response interceptor normally returns the axios response;
  // helper callers expect the data shape
  return res && res.data ? res.data : res;
};

export default requestPickup;