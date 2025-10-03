import api from './api';

export const updateProfile = async (profileData) => {
  try { return await api.patch('/profile', profileData); } catch (error) { throw error; }
};

export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    return await api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  } catch (error) { throw error; }
};