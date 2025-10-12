import api from './api';

const authService = {
  login: async (email, password) => {
    // Always use URLSearchParams and correct endpoint
    const body = new URLSearchParams({
      username: email,
      password: password,
    });
    const response = await api.post('/api/v1/auth/login', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    if (response.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    if (response.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  refreshUserProfile: async () => {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }
};

export default authService;