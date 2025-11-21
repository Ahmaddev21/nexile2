
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

// API Key needs to be simulated as available in environment
declare global {
  interface Window {
    env: {
      API_KEY: string;
    }
  }
}
