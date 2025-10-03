import { createPickup, getPickups } from './api';

export const requestPickup = async (data) => {
  try {
    return await createPickup(data);
  } catch (error) {
    throw error;
  }
};

export const fetchPickups = async () => {
  try {
    return await getPickups();
  } catch (error) {
    throw error;
  }
};