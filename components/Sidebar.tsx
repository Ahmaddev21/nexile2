import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, LogOut, Activity, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={onClose} // Close sidebar on navigation on smaller screens
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive(to)
          ? 'bg-nexile-500 text-white shadow-lg shadow-nexile-500/30'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
      }`}
    >
      <Icon size={20} className={isActive(to) ? 'text-white' : 'text-slate-400 group-hover:text-nexile-500 dark:text-slate-500 dark:group-hover:text-white'} />
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 z-30 h-screen w-64 flex flex-col
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transition-transform duration-300 ease-in-out print:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-nexile-500 rounded-lg flex items-center justify-center shadow-lg shadow-nexile-500/20">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Nexile<span className="text-nexile-500">.</span>
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/pos" icon={ShoppingCart} label="Point of Sale" />
          <NavItem to="/inventory" icon={Package} label="Inventory" />
          <NavItem to="/reports" icon={BarChart3} label="Reports & Analytics" />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="mb-4 px-4">
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account</p>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-nexile-600">
                      {user?.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate capitalize">{user?.role.toLowerCase()}</p>
                  </div>
               </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;