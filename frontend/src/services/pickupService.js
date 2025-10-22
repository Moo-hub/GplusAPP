import { createPickup, getPickups } from './api';

export const requestPickup = async (data) => {
  return await createPickup(data);
};

export const fetchPickups = async () => {
  return await getPickups();
};