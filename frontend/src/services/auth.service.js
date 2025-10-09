import api from './api';

const authService = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    // api instance has a response interceptor that returns response.data,
    // so calling api.post(...) yields the actual payload object (not the full
    // axios response). Name it `data` to avoid confusion.
  /** @type {any} */
  const data = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const token = data?.access_token || data?.token;
    const user = data?.user;

    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return data;
  },
  
  register: async (userData) => {
  /** @type {any} */
  const data = await api.post('/auth/register', userData);
    const token = data?.access_token || data?.token;
    const user = data?.user;

    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    return data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  refreshUserProfile: async () => {
  /** @type {any} */
  const data = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }
};

export default authService;