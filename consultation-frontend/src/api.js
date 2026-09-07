import axios from 'axios';

// Directly default to your live Render backend for cloud deployments
const BASE_URL = 'https://medical-backend-wvj9.onrender.com/api';

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token dynamically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No JWT token found in localStorage!');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;