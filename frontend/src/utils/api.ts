import axios from 'axios';

export const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const hasRealApi = Boolean(process.env.REACT_APP_API_URL);

const api = axios.create({ baseURL: apiUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'demo-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
