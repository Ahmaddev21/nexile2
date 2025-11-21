
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Transaction, Branch, User, UserRole } from '../types';
import { MOCK_BRANCHES, INITIAL_INVENTORY, SAMPLE_TRANSACTIONS } from '../constants';

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  branches: Branch[];
  users: User[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  recordTransaction: (transaction: Transaction) => void;
  getBranchProducts: (branchId: string) => Product[];
  refreshData: () => void;
  addBranch: (name: string, location: string) => Branch;
  registerUser: (user: User) => void;
  hashPassword: (password: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to initialize state from localStorage or fallback to default
const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
        return JSON.parse(stored);
    }
    return fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage`, e);
    return fallback;
  }
};

// Simple simulation of a hash function (Base64)
// In production, use bcrypt/argon2 on the server side.
const simpleHash = (text: string) => {
    return btoa(text);
};

const DEFAULT_USERS = [
    { 
      id: 'u1', 
      name: 'Admin Owner', 
      email: 'owner@nexile.com', 
      role: UserRole.OWNER, 
      password: simpleHash('password'), 
      createdAt: Date.now() 
    },
    { 
      id: 'u2', 
      name: 'John Pharmacist', 
      email: 'john@nexile.com', 
      role: UserRole.PHARMACIST, 
      assignedBranchId: 'b1', 
      password: simpleHash('password'),
      createdAt: Date.now() 
    },
    { 
      id: 'u3', 
      name: 'Sarah Manager', 
      email: 'sarah@nexile.com', 
      role: UserRole.MANAGER, 
      password: simpleHash('password'),
      managedBranchIds: ['b1', 'b2'],
      createdAt: Date.now()
    },
];

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  // State for dynamic data with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => getInitialState('nexile_products', INITIAL_INVENTORY));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getInitialState('nexile_transactions', SAMPLE_TRANSACTIONS));
  const [branches, setBranches] = useState<Branch[]>(() => getInitialState('nexile_branches', MOCK_BRANCHES));
  
  // Simulated User Database with Persistence and Safety Check
  const [users, setUsers] = useState<User[]>(() => {
      const loadedUsers = getInitialState<User[]>('nexile_users', DEFAULT_USERS);
      // Safety: Ensure default Admin always exists if list is somehow corrupted/empty but structure is valid
      const adminExists = loadedUsers.some(u => u.email === 'owner@nexile.com');
      if (!adminExists) {
          return [...loadedUsers, ...DEFAULT_USERS.filter(d => d.email === 'owner@nexile.com')];
      }
      return loadedUsers;
  });

  // Persist changes to LocalStorage
  useEffect(() => { localStorage.setItem('nexile_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('nexile_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('nexile_branches', JSON.stringify(branches)); }, [branches]);
  useEffect(() => { localStorage.setItem('nexile_users', JSON.stringify(users)); }, [users]);

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const recordTransaction = (transaction: Transaction) => {
    // 1. Add Transaction
    setTransactions(prev => [transaction, ...prev]);

    // 2. Update Stock with safety check
    setProducts(prev => {
      const newProducts = [...prev];
      transaction.items.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
          const currentStock = newProducts[productIndex].stock;
          // Prevent negative stock in database (logic safety)
          newProducts[productIndex] = {
            ...newProducts[productIndex],
            stock: Math.max(0, currentStock - item.quantity)
          };
        }
      });
      return newProducts;
    });
  };

  const getBranchProducts = (branchId: string) => {
    return products.filter(p => p.branchId === branchId);
  };

  const addBranch = (name: string, location: string) => {
    // Check if branch exists to avoid duplicates if not intended
    const existing = branches.find(b => b.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const newBranch: Branch = {
        id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        location
    };
    setBranches(prev => [...prev, newBranch]);
    return newBranch;
  };

  const registerUser = (user: User) => {
    setUsers(prev => {
        // Prevent duplicate emails
        if (prev.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
            return prev;
        }
        // Important: Hash password before saving to state/storage
        const secureUser = {
            ...user,
            password: simpleHash(user.password || '')
        };
        return [...prev, secureUser];
    });
  };

  const refreshData = () => {
    // In a real app, this would re-fetch from DB
  };

  return (
    <DataContext.Provider value={{ 
      products, 
      transactions, 
      branches,
      users,
      addProduct, 
      updateProduct, 
      deleteProduct,
      recordTransaction,
      getBranchProducts,
      refreshData,
      addBranch,
      registerUser,
      hashPassword: simpleHash
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
