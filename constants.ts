
import { Branch, Product, Transaction, UserRole } from './types';

export const MOCK_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Nexile Main St.', location: 'New York, NY' },
  { id: 'b2', name: 'Nexile Westside', location: 'Los Angeles, CA' },
  { id: 'b3', name: 'Nexile Downtown', location: 'Chicago, IL' },
];

export const MANAGER_ACCESS_CODE = "123456"; // In real app, this is hashed

// Simple simulation of a hashed password for the mock data
// In reality, we'd use the same helper function from DataContext, but for constants we hardcode the "hashed" version.
// Let's assume "password" hashes to "cGFzc3dvcmQ=" (base64 of 'password') for this simulation.
const MOCK_HASH = "cGFzc3dvcmQ="; 

export const INITIAL_INVENTORY: Product[] = [
  {
    id: 'p1',
    name: 'Amoxicillin 500mg',
    category: 'Antibiotics',
    barcode: '8901234567890',
    batchNumber: 'AMX-2024-01',
    expiryDate: '2025-12-31',
    costPrice: 5.00,
    sellingPrice: 12.50,
    stock: 150,
    minStockLevel: 20,
    branchId: 'b1',
  },
  {
    id: 'p2',
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    barcode: '8909876543210',
    batchNumber: 'PCM-2023-99',
    expiryDate: '2026-05-20',
    costPrice: 1.20,
    sellingPrice: 4.50,
    stock: 500,
    minStockLevel: 50,
    branchId: 'b1',
  },
  {
    id: 'p3',
    name: 'Vitamin C 1000mg',
    category: 'Supplements',
    barcode: '8901122334455',
    batchNumber: 'VTC-2024-05',
    expiryDate: '2024-11-15', // Expiring soon
    costPrice: 8.00,
    sellingPrice: 18.00,
    stock: 45,
    minStockLevel: 10,
    branchId: 'b1',
  },
  {
    id: 'p4',
    name: 'Ibuprofen 400mg',
    category: 'Pain Relief',
    barcode: '8905544332211',
    batchNumber: 'IBU-2024-22',
    expiryDate: '2025-08-10',
    costPrice: 3.50,
    sellingPrice: 9.00,
    stock: 12, // Low stock
    minStockLevel: 25,
    branchId: 'b1',
  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    totalAmount: 25.00,
    items: [{ productId: 'p1', name: 'Amoxicillin 500mg', quantity: 2, price: 12.50 }],
    branchId: 'b1',
    userId: 'u1',
    paymentMethod: 'CARD',
  },
  {
    id: 't2',
    date: new Date().toISOString(), // Today
    totalAmount: 9.00,
    items: [{ productId: 'p2', name: 'Paracetamol 500mg', quantity: 2, price: 4.50 }],
    branchId: 'b1',
    userId: 'u1',
    paymentMethod: 'CASH',
  }
];

export const TRIAL_DAYS = 7;
export const APP_NAME = "Nexile";
