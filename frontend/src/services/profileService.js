import api from './api';

export const updateProfile = async (profileData) => {
  return await api.patch('/profile', profileData);
};

export const uploadProfileImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('avatar', imageFile);
  return await api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};