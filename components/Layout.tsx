
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Moon, Sun, Building2, Menu, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const Layout = () => {
  const [isDark, setIsDark] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { activeBranchId, user, isTrialExpired } = useAuth();
  const { branches } = useData();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
  };

  const currentBranchName = activeBranchId 
        ? branches.find(b => b.id === activeBranchId)?.name 
        : "All Branches";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Trial Expiration Overlay */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-2xl shadow-2xl text-center border border-slate-800">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock size={40} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Trial Period Expired</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">
                      Your 7-day free trial of Nexile Pharmacy OS has ended. Please upgrade your subscription to continue accessing your dashboard and inventory.
                  </p>
                  <button className="w-full py-3 bg-nexile-600 hover:bg-nexile-700 text-white font-bold rounded-xl transition-colors">
                      Upgrade to Pro Plan
                  </button>
                  <p className="mt-4 text-xs text-slate-500">
                      Contact support: billing@nexile.com
                  </p>
             </div>
        </div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative print:ml-0 lg:ml-64`}>
        {/* Header / Top Bar */}
        <header className="h-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 print:hidden">
             <div className="flex items-center gap-3">
                 {/* Mobile Toggle */}
                 <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                 >
                     <Menu size={20} />
                 </button>

                 <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                     <Building2 size={16} className="hidden sm:block" />
                     <span className="hidden sm:inline">Current Context:</span>
                     <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-none">
                         {currentBranchName}
                     </span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <div className="hidden sm:block text-right">
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{user?.role}</p>
                 </div>
                 <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                 >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                 </button>
             </div>
        </header>
        
        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 relative print:h-auto print:overflow-visible">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
