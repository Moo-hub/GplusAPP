import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 5000,
});

export const getPickups = async () => {
  const response = await api.get("/pickups");
  return response.data;
};

export const createPickup = async (pickupData) => {
  const response = await api.post("/pickups", pickupData);
  return response.data;
};

export const getPickupSchedule = async () => {
  const response = await api.get("/pickups/schedule");
  return response.data;
};

export const getVehicles = async () => {
  const response = await api.get("/vehicles");
  return response.data;
};

export const getPoints = async () => {
  const response = await api.get("/points");
  return response.data;
};

export const getCompanies = async () => {
  const response = await api.get("/companies");
  return response.data;
};

export const getPaymentMethods = async () => {
  const response = await api.get("/payments/methods");
  return response.data;
};

export default api;
