import apiClient from './apiClient';

export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.patch('/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await apiClient.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};