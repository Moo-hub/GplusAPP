import api from './api';

export const getPoints = async () => {
  return await api.get('/points');
};

export const getPointsHistory = async () => {
  return await api.get('/points/history');
};

export const getImpactData = async () => {
  return await api.get('/points/impact');
};

export const redeemPoints = async (rewardId, pointsAmount) => {
  return await api.post('/points/redeem', { rewardId, pointsAmount });
};