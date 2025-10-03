import api from './api';

export const getPoints = async () => {
  try {
    return await api.get('/points');
  } catch (error) { throw error; }
};

export const getPointsHistory = async () => {
  try { return await api.get('/points/history'); } catch (error) { throw error; }
};

export const getImpactData = async () => {
  try { return await api.get('/points/impact'); } catch (error) { throw error; }
};

export const redeemPoints = async (rewardId, pointsAmount) => {
  try { return await api.post('/points/redeem', { rewardId, pointsAmount }); } catch (error) { throw error; }
};