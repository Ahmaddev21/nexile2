import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Transaction, Branch, User } from '../types';
import api from '../services/api';

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  branches: Branch[];
  users: User[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  recordTransaction: (transaction: Transaction) => Promise<void>;
  getBranchProducts: (branchId: string) => Product[];
  refreshData: () => void;
  addBranch: (name: string, location: string) => Promise<Branch>;
  registerUser: (user: User) => void; // Deprecated in favor of API, keeping for interface compat
  hashPassword: (password: string) => string; // Deprecated
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchData = useCallback(async () => {
    try {
        // Only fetch if we have a token
        if (!localStorage.getItem('nexile_token')) return;

        const [prodRes, transRes, branchRes] = await Promise.all([
            api.get('/inventory'),
            api.get('/transactions'),
            api.get('/branches')
        ]);

        // Map MongoDB _id to id for frontend compatibility
        const mapId = (item: any) => ({ ...item, id: item._id || item.id });

        setProducts(prodRes.data.map(mapId));
        setTransactions(transRes.data.map(mapId));
        setBranches(branchRes.data.map(mapId));
    } catch (error) {
        console.error("Failed to fetch data", error);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
      fetchData();
  }, [fetchData]);

  const addProduct = async (product: Product) => {
    try {
        const res = await api.post('/inventory', product);
        const newProduct = { ...res.data, id: res.data._id };
        setProducts(prev => [...prev, newProduct]);
    } catch (error) {
        console.error("Failed to add product", error);
        throw error;
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
        const res = await api.put(`/inventory/${updatedProduct.id}`, updatedProduct);
        const savedProduct = { ...res.data, id: res.data._id };
        setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
    } catch (error) {
        console.error("Failed to update product", error);
        throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
        await api.delete(`/inventory/${productId}`);
        setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
        console.error("Failed to delete product", error);
        throw error;
    }
  };

  const recordTransaction = async (transaction: Transaction) => {
    try {
        const res = await api.post('/transactions', transaction);
        const newTx = { ...res.data, id: res.data._id };
        
        setTransactions(prev => [newTx, ...prev]);
        
        // Optimistically update stock in frontend to feel instant
        setProducts(prev => {
            const newProducts = [...prev];
            transaction.items.forEach(item => {
                const idx = newProducts.findIndex(p => p.id === item.productId);
                if (idx > -1) {
                    newProducts[idx] = {
                        ...newProducts[idx],
                        stock: Math.max(0, newProducts[idx].stock - item.quantity)
                    };
                }
            });
            return newProducts;
        });
        
        // Re-fetch to ensure consistency with backend
        fetchData();
    } catch (error) {
        console.error("Failed to record transaction", error);
        throw error;
    }
  };

  const getBranchProducts = (branchId: string) => {
    return products.filter(p => p.branchId === branchId);
  };

  const addBranch = async (name: string, location: string) => {
    try {
        const res = await api.post('/branches', { name, location });
        const newBranch = { ...res.data, id: res.data._id };
        setBranches(prev => [...prev, newBranch]);
        return newBranch;
    } catch (error) {
        console.error("Failed to add branch", error);
        throw error;
    }
  };

  // Deprecated/Mock functions for interface compatibility
  const registerUser = () => {}; 
  const hashPassword = (p: string) => p;

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
      refreshData: fetchData,
      addBranch,
      registerUser,
      hashPassword
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