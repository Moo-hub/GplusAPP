import api from './api';

const pickupService = {
  getPickupRequests: async (status = null) => {
    let url = '/pickups/';
    if (status) {
      url += `?status=${status}`;
    }
    return await api.get(url);
  },
  
  getPickupRequest: async (id) => {
    return await api.get(`/pickups/${id}`);
  },
  
  createPickupRequest: async (pickupData) => {
    return await api.post('/pickups/', pickupData);
  },
  
  updatePickupRequest: async (id, pickupData) => {
    return await api.put(`/pickups/${id}`, pickupData);
  },
  
  cancelPickupRequest: async (id) => {
    return await api.delete(`/pickups/${id}`);
  },
  
  // New endpoint for fetching available time slots
  getAvailableTimeSlots: async (startDate, days = 7) => {
    return await api.get(`/pickups/timeslots?start_date=${startDate}&days=${days}`);
  }
};

export default pickupService;