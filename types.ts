
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  PHARMACIST = 'PHARMACIST',
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Added for auth
  assignedBranchId?: string; // For Pharmacists
  managedBranchIds?: string[]; // For Managers (Subset of branches)
  createdAt: number; // Timestamp for trial tracking
}

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string; // Added for scanning support
  batchNumber: string;
  expiryDate: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockLevel: number;
  branchId: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  totalAmount: number;
  items: { productId: string; name: string; quantity: number; price: number }[];
  branchId: string;
  userId: string;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalTransactions: number;
  lowStockCount: number;
  expiringSoonCount: number;
}
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
      
      // 2. Check if we are in PRODUCTION mode (Railway/Vercel build)
      // @ts-ignore
      if (import.meta.env.PROD) {
        // In production, default to relative path '/api' 
        // This forces the browser to talk to the backend on the SAME domain.
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