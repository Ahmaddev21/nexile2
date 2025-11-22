import axios from 'axios';

const getBaseUrl = () => {
  try {
    // Check if import.meta is available (Vite environment)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // 1. Check for explicit Environment Variable
      // @ts-ignore
      if (import.meta.env.VITE_API_URL) {
        // @ts-ignore
        return import.meta.env.VITE_API_URL;
      }
      
      // 2. Check if we are in PRODUCTION mode
      // @ts-ignore
      if (import.meta.env.PROD) {
        // In production (Railway/Vercel), default to relative path 
        // This ensures it talks to the backend on the same domain
        return '/api';
      }
    }
  } catch (e) {
    // Silent fail
  }
  
  // 3. Default Fallback for Local Development
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