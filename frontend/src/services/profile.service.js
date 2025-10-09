import api from './api';

const profileService = {
  getProfile: async () => {
    return await api.get('/profile');
  },
  
  updateProfile: async (profileData) => {
    return await api.put('/profile', profileData);
  }
};

export default profileService;