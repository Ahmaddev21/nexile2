
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, LogOut, Activity, X, Hexagon, Settings, FileText, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

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
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group my-1 ${
        isActive(to)
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
      }`}
    >
      <Icon size={20} strokeWidth={isActive(to) ? 2.5 : 2} className={isActive(to) ? 'text-inherit' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 z-50 h-screen w-72 flex flex-col
        bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
        transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] print:hidden shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-nexile-500 to-nexile-700 rounded-xl flex items-center justify-center shadow-lg shadow-nexile-500/20 relative">
                 <Hexagon className="text-white absolute" size={24} strokeWidth={1.5} />
                 <div className="w-2 h-2 bg-white rounded-full absolute"></div>
             </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Nexile<span className="text-nexile-500">.</span>
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Main Menu</p>
        </div>

        <nav className="flex-1 px-4">
          {/* Common Dashboard */}
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

          {/* Pharmacist Only */}
          {user?.role === UserRole.PHARMACIST && (
            <>
                <NavItem to="/pos" icon={ShoppingCart} label="Point of Sale" />
                <NavItem to="/inventory" icon={Package} label="My Inventory" />
            </>
          )}

          {/* Manager Only */}
          {user?.role === UserRole.MANAGER && (
            <>
                <NavItem to="/reports" icon={FileText} label="Reports" />
                <NavItem to="/inventory" icon={Package} label="Stock Oversight" />
                <NavItem to="/pos" icon={ShoppingCart} label="POS Audit" />
            </>
          )}

          {/* Owner Only */}
          {user?.role === UserRole.OWNER && (
            <>
                <NavItem to="/reports" icon={BarChart3} label="Analytics" />
                <NavItem to="/inventory" icon={Package} label="Global Inventory" />
                <NavItem to="/pos" icon={ShoppingCart} label="Terminal" />
                <div className="px-4 my-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin</p>
                </div>
                <NavItem to="/" icon={Users} label="Staff Management" />
                <NavItem to="/" icon={Settings} label="System Config" />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md
                ${user?.role === UserRole.OWNER ? 'bg-violet-600' : user?.role === UserRole.MANAGER ? 'bg-blue-600' : 'bg-emerald-600'}
             `}>
                 {user?.name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                 <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{user?.role}</p>
             </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl transition-colors"
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
