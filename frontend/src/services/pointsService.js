import apiClient from './apiClient';

export const getPoints = async () => {
  try {
    const response = await apiClient.get('/points');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPointsHistory = async () => {
  try {
    const response = await apiClient.get('/points/history');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getImpactData = async () => {
  try {
    const response = await apiClient.get('/points/impact');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const redeemPoints = async (rewardId, pointsAmount) => {
  try {
    const response = await apiClient.post('/points/redeem', {
      rewardId,
      pointsAmount
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};