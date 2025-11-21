
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { User, UserRole } from '../types';
import { MANAGER_ACCESS_CODE, TRIAL_DAYS } from '../constants';
import { useData } from './DataContext';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
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
  const { users, branches, registerUser, addBranch, hashPassword } = useData();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  // Check Trial Status
  const isTrialExpired = useMemo(() => {
      if (!user) return false;
      // In a SaaS, usually the Organization (Owner) holds the trial. 
      // Since this is a MVP, we track based on the current user's creation date 
      // or ideally the Owner's creation date associated with this tenant.
      const now = Date.now();
      const msInDay = 24 * 60 * 60 * 1000;
      const daysSinceCreation = (now - user.createdAt) / msInDay;
      return daysSinceCreation > TRIAL_DAYS;
  }, [user]);

  const login = async (email: string, password: string, role: UserRole, branchName?: string, accessCode?: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        // 1. Find User
        const userByEmail = users.find(u => u.email.toLowerCase() === cleanEmail);

        if (!userByEmail) {
            reject(new Error("Account not found. Please sign up."));
            return;
        }

        // 2. Check Role Match
        if (userByEmail.role !== role) {
            reject(new Error(`Role Mismatch: This email is registered as ${userByEmail.role}. Please switch the role tab.`));
            return;
        }

        // 3. Password Validation (Hash comparison)
        if (userByEmail.password !== hashPassword(cleanPassword)) {
            reject(new Error("Incorrect password."));
            return;
        }

        // 4. Security Checks for Manager
        if (role === UserRole.MANAGER) {
            if (accessCode !== MANAGER_ACCESS_CODE) {
                reject(new Error("Invalid Manager Access Code"));
                return;
            }
        }

        // 5. Branch Validation for Pharmacist
        let finalBranchId = userByEmail.assignedBranchId;
        if (role === UserRole.PHARMACIST) {
             if (!userByEmail.assignedBranchId) {
                 reject(new Error("Account error: No branch assigned. Contact support."));
                 return;
             }

             // Critical: Verify the branch still exists in the system
             const branchExists = branches.some(b => b.id === userByEmail.assignedBranchId);
             if (!branchExists) {
                 reject(new Error("System Error: Assigned branch no longer exists. Contact Owner."));
                 return;
             }
             
             finalBranchId = userByEmail.assignedBranchId;
        }

        // Login Success - Sanitize User Object (Remove Password)
        const { password: _, ...safeUser } = userByEmail;
        setUser(safeUser);
        
        // Set Active Branch View
        if (role === UserRole.OWNER || role === UserRole.MANAGER) {
            setActiveBranchId(null); 
        } else {
            setActiveBranchId(finalBranchId || null);
        }
        
        resolve(true);
    });
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, branchName?: string, accessCode?: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
            const cleanEmail = email.trim().toLowerCase();
            const cleanPassword = password.trim();
            
            // 1. Duplicate Check
            if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
                reject(new Error("Email already registered. Please sign in."));
                return;
            }

            // 2. Branch Logic
            let assignedBranchId: string | undefined = undefined;
            const cleanedBranchName = branchName?.trim() || '';
            let managedBranchIds: string[] | undefined = undefined;

            if (role === UserRole.PHARMACIST) {
                 if (!cleanedBranchName) {
                    reject(new Error("Branch name is required for pharmacists."));
                    return;
                 }
                 
                 // Check if branch exists
                 let targetBranch = branches.find(b => b.name.toLowerCase() === cleanedBranchName.toLowerCase());
                 
                 if (!targetBranch) {
                     targetBranch = addBranch(cleanedBranchName, 'New Location');
                 }
                 assignedBranchId = targetBranch.id;

            } else if (role === UserRole.MANAGER) {
                if (accessCode !== MANAGER_ACCESS_CODE) {
                    reject(new Error("Invalid Manager Access Code. Contact Owner."));
                    return;
                }
                assignedBranchId = undefined;
                managedBranchIds = []; 
            } else if (role === UserRole.OWNER) {
                if (cleanedBranchName) {
                    addBranch(cleanedBranchName, 'Main HQ');
                }
                assignedBranchId = undefined;
            }

            // Note: Password passed here will be hashed by registerUser in DataContext
            const newUser: User = {
                id: `user-${Date.now()}`,
                name,
                email: cleanEmail,
                role,
                password: cleanPassword, 
                assignedBranchId,
                managedBranchIds,
                createdAt: Date.now()
            };

            registerUser(newUser);
            
            // Sanitize for session state
            const { password: _, ...safeUser } = newUser;
            setUser(safeUser);
            
            if (role === UserRole.PHARMACIST && assignedBranchId) {
                 setActiveBranchId(assignedBranchId);
            } else {
                 setActiveBranchId(null);
            }

            resolve(true);
    });
  };

  const logout = () => {
    setUser(null);
    setActiveBranchId(null);
  };

  const setActiveBranch = (branchId: string) => {
    setActiveBranchId(branchId === "" ? null : branchId); 
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
