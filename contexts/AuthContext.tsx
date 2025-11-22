import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';
import { useData } from './DataContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  activeBranchId: string | null;
  isTrialExpired: boolean;
  login: (email: string, password: string, role: UserRole, branchName?: string, accessCode?: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole, branchName?: string, accessCode?: string) => Promise<boolean>;
  logout: () => void;
  setActiveBranch: (branchId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const { refreshData } = useData();
  const [user, setUser] = useState<User | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('nexile_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          
          // Set initial active branch based on role
          if (res.data.role === UserRole.PHARMACIST && res.data.assignedBranchId) {
            setActiveBranchId(res.data.assignedBranchId);
          }
          
          // Trigger data fetch
          refreshData(); 
        } catch (err) {
          console.error("Session expired or invalid");
          localStorage.removeItem('nexile_token');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const isTrialExpired = false; // Backend should handle trial logic in production

  const login = async (email: string, password: string, role: UserRole, branchName?: string, accessCode?: string): Promise<boolean> => {
    try {
        const res = await api.post('/auth/login', { email, password, role, branchName, accessCode });
        const { token, user } = res.data;
        
        localStorage.setItem('nexile_token', token);
        setUser(user);
        
        if (user.role === UserRole.PHARMACIST && user.assignedBranchId) {
            setActiveBranchId(user.assignedBranchId);
        } else {
            setActiveBranchId(null);
        }
        
        refreshData();
        return true;
    } catch (err: any) {
        throw new Error(err.response?.data?.message || "Login failed");
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, branchName?: string, accessCode?: string): Promise<boolean> => {
    try {
        const res = await api.post('/auth/register', { 
            name, 
            email, 
            password, 
            role, 
            branchName, 
            accessCode 
        });
        
        const { token, user } = res.data;
        localStorage.setItem('nexile_token', token);
        setUser(user);

        if (user.role === UserRole.PHARMACIST && user.assignedBranchId) {
            setActiveBranchId(user.assignedBranchId);
        } else {
            setActiveBranchId(null);
        }

        refreshData();
        return true;
    } catch (err: any) {
        throw new Error(err.response?.data?.message || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem('nexile_token');
    setUser(null);
    setActiveBranchId(null);
  };

  const setActiveBranch = (branchId: string) => {
    setActiveBranchId(branchId === "" ? null : branchId); 
  }

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">Loading Nexile OS...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      activeBranchId, 
      login, 
      signup, 
      logout, 
      setActiveBranch,
      isTrialExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};