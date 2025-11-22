import axios from 'axios';

// Robust function to get API URL without crashing if import.meta is undefined
const getBaseUrl = () => {
  try {
    // @ts-ignore - Ignore TypeScript errors for import.meta checks
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    }
  } catch (e) {
    // Silently fail and fall back to default
  }
  return 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();
console.log(`Nexile API Configured: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexile_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 (Unauthorized) responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Optional: Clear token and redirect to login if session expires
      // To prevent infinite loops, we only redirect if not already on auth
      if (error.response.status === 401 && !window.location.pathname.includes('/auth')) {
          console.warn('Session expired. Redirecting to login.');
          localStorage.removeItem('nexile_token');
          window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;