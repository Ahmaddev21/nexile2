
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { generateBusinessInsights } from '../services/geminiService';
import { 
  AlertCircle, DollarSign, Package, ShoppingCart, Sparkles, Clock, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Filter, Lock, Activity, 
  Users, Boxes, AlertTriangle, ScanLine, Zap, Calendar, BarChart3, 
  Building2, ChevronRight, TrendingDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell 
} from 'recharts';
import { UserRole } from '../types';

// --- SUB-COMPONENTS FOR ROLE SPECIFIC DASHBOARDS ---

// 1. PHARMACIST DASHBOARD (Operational Focus)
const PharmacistDashboard = ({ 
    branchName, 
    todaysSales, 
    txCount, 
    lowStockItems, 
    insight 
}: any) => {
    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Header / Shift Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="text-emerald-500 fill-emerald-500" size={24}/> Operational Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Active Shift at <span className="font-bold text-emerald-700 dark:text-emerald-400">{branchName}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Time</p>
                        <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <Link to="/pos" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2">
                        <ScanLine size={20} /> Open POS Terminal
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">Shift Sales</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">${todaysSales.toFixed(2)}</h3>
                    </div>
                    <DollarSign className="absolute right-4 bottom-4 text-emerald-200 dark:text-emerald-900/40" size={64} />
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Transactions</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{txCount}</h3>
                    </div>
                    <ShoppingCart className="absolute right-4 bottom-4 text-slate-100 dark:text-slate-800" size={64} />
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Alerts</p>
                        <h3 className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockItems.length}</h3>
                        <p className="text-xs text-slate-400">Low stock items needing attention</p>
                    </div>
                    <AlertTriangle className={`absolute right-4 bottom-4 ${lowStockItems.length > 0 ? 'text-red-100' : 'text-slate-100 dark:text-slate-800'}`} size={64} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Action Priority List */}
                 <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-emerald-500"/> Priority Actions
                        </h3>
                    </div>
                    <div className="p-0">
                        {lowStockItems.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Package size={48} className="mx-auto mb-3 text-slate-300"/>
                                <p>Inventory levels are healthy. No immediate actions required.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {lowStockItems.slice(0, 5).map((item: any) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500">Only {item.stock} units remaining</p>
                                            </div>
                                        </div>
                                        <Link to="/inventory" className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 text-slate-600">
                                            Restock
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Quick Links */}
                 <div className="space-y-4">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-start gap-3 mb-4">
                            <Sparkles className="text-yellow-400" size={20} />
                            <p className="text-sm font-medium italic opacity-90">"{insight}"</p>
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pharmacy Intelligence Engine</div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                         <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Quick Lookup</h3>
                         <div className="relative">
                             <input 
                                type="text" 
                                placeholder="Check price or stock..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                             />
                             <ScanLine size={18} className="absolute left-3 top-3 text-slate-400" />
                         </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

// 2. MANAGER DASHBOARD (Supervisory Focus)
const ManagerDashboard = ({ 
    managedBranches, 
    chartData, 
    topProducts, 
    aggregateSales,
    activeBranchId,
    setActiveBranch
}: any) => {
    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Supervisory Console</h1>
                    <p className="text-slate-500 text-sm">Overview of {managedBranches.length} assigned branches</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Building2 size={16} className="text-blue-500 ml-2"/>
                    <select 
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer pr-4 min-w-[200px]"
                        value={activeBranchId || ''}
                        onChange={(e) => setActiveBranch(e.target.value)}
                    >
                        <option value="">All Assigned Branches</option>
                        {managedBranches.map((b: any) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${aggregateSales.toFixed(0)}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-l-4 border-indigo-500 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Staff Active</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">12</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Stock Health</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">94%</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-l-4 border-orange-500 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Orders</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">3</h3>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Branch Performance Comparison</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Demand Velocity Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white">Demand Velocity</h3>
                        <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded uppercase">
                            Last 7 Days
                        </div>
                     </div>
                     
                     <div className="space-y-5 flex-1">
                        {topProducts.slice(0, 4).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'} dark:bg-slate-800`}>
                                        <span className="text-xs font-bold">#{idx + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{item.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <TrendingUp size={12} className="text-emerald-500" /> High Demand
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.qty}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">Sold</p>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs">
                                <TrendingUp size={24} className="mb-2 opacity-20" />
                                <p>No sufficient sales data yet.</p>
                            </div>
                        )}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <TrendingDown size={14} className="text-red-500" />
                                <span>Slow moving: Vitamin C 500mg</span>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// 3. OWNER DASHBOARD (Executive Focus)
const OwnerDashboard = ({ 
    globalSales, 
    globalTx, 
    chartData, 
    branches, 
    insight 
}: any) => {
    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Enterprise Dashboard</h1>
                    <p className="text-slate-500 text-sm">Global performance overview</p>
                </div>
                <Link to="/reports" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
                    Go to Smart Reports
                </Link>
            </div>

            {/* Executive Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Global Revenue (MTD)</p>
                        <h2 className="text-5xl font-bold mb-2">${globalSales.toFixed(0)}</h2>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                            <TrendingUp size={16} /> +12.5% vs last month
                        </div>
                    </div>
                    {/* Abstract BG Graphic */}
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                        <Boxes size={150} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Net Profit Estimate</p>
                     <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">${(globalSales * 0.35).toFixed(0)}</h2>
                     <p className="text-sm text-slate-400">Based on 35% avg margin</p>
                     <div className="absolute top-6 right-6 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-violet-600">
                         <DollarSign size={24} />
                     </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Network Activity</p>
                     <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{globalTx}</h2>
                     <p className="text-sm text-slate-400">Transactions across all branches</p>
                     <div className="absolute top-6 right-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                         <Activity size={24} />
                     </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Growth Trajectory</h3>
                    <div className="flex gap-2">
                        {['7D', '30D', '3M', '1Y'].map(t => (
                            <button key={t} className="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Network Health */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Branch Network Health</h3>
                    <div className="space-y-4">
                        {branches.map((branch: any, i: number) => (
                            <div key={branch.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{branch.name}</p>
                                        <p className="text-xs text-slate-500">{branch.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Healthy</p>
                                    <p className="text-[10px] text-slate-400">98% Uptime</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Strategy */}
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Sparkles size={16} className="text-yellow-300" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Pharmacy Intelligence Engine</span>
                        </div>
                        <p className="text-xl font-medium leading-relaxed opacity-95 mb-6 min-h-[80px]">
                            "{insight}"
                        </p>
                        <div className="flex gap-3">
                            <button className="bg-white text-violet-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors shadow-md">
                                Action Insight
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20 group-hover:translate-x-10 transition-transform duration-1000"></div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN CONTROLLER ---

const Dashboard = () => {
  const { user, activeBranchId, setActiveBranch } = useAuth();
  const { products, transactions, branches } = useData();
  const [insight, setInsight] = useState<string>('Calculating metrics...');
  const [timeRange, setTimeRange] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  // --- DATA PREPARATION ---
  
  const effectiveBranchId = useMemo(() => {
    if (user?.role === UserRole.PHARMACIST) return user.assignedBranchId;
    return activeBranchId;
  }, [user, activeBranchId]);

  const filteredTransactions = useMemo(() => {
    if (user?.role === UserRole.PHARMACIST && !effectiveBranchId) return [];
    
    // Case 1: Specific branch selected (by anyone)
    if (effectiveBranchId) {
        return transactions.filter(t => t.branchId === effectiveBranchId);
    }

    // Case 2: Manager viewing "All" (Must filter by managed IDs)
    if (user?.role === UserRole.MANAGER && user.managedBranchIds) {
        return transactions.filter(t => user.managedBranchIds?.includes(t.branchId));
    }

    // Case 3: Owner viewing "All" (No filter needed)
    return transactions;
  }, [transactions, effectiveBranchId, user]);

  const filteredProducts = useMemo(() => {
      if (user?.role === UserRole.PHARMACIST && !effectiveBranchId) return [];
      
      // Case 1: Specific branch selected
      if (effectiveBranchId) {
        return products.filter(p => p.branchId === effectiveBranchId);
      }

      // Case 2: Manager viewing "All" (Must filter by managed IDs)
      if (user?.role === UserRole.MANAGER && user.managedBranchIds) {
        return products.filter(p => user.managedBranchIds?.includes(p.branchId));
      }

      // Case 3: Owner viewing "All"
      return products;
  }, [products, effectiveBranchId, user]);

  // Stats
  const lowStockItems = filteredProducts.filter(p => p.stock <= p.minStockLevel);
  const todaysSales = filteredTransactions
    .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.totalAmount, 0);
  
  // Managed Branches for Manager
  const managedBranches = useMemo(() => {
      if (user?.role === UserRole.MANAGER && user.managedBranchIds) {
          return branches.filter(b => user.managedBranchIds!.includes(b.id));
      }
      return branches;
  }, [branches, user]);

  // Chart Data Builder (Simplified for readability)
  const chartData = useMemo(() => {
      // Logic similar to previous, builds last 7 days data
      const data = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = d.toDateString();
          
          const daysTx = filteredTransactions.filter(t => new Date(t.date).toDateString() === dateStr);
          const revenue = daysTx.reduce((sum, t) => sum + t.totalAmount, 0);
          
          data.push({ name: dayStr, revenue });
      }
      return data;
  }, [filteredTransactions]);

  // Top Products
  const topProducts = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredTransactions.forEach(t => {
          t.items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + i.quantity; });
      });
      return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, qty]) => {
             const prod = products.find(p => p.name === name);
             return { name, qty, price: prod?.sellingPrice || 0 };
          });
  }, [filteredTransactions, products]);

  // AI Insight Trigger
  useEffect(() => {
      const fetchInsight = async () => {
          if (filteredProducts.length > 0) {
              const text = await generateBusinessInsights(filteredProducts, filteredTransactions);
              setInsight(text);
          }
      };
      if(filteredProducts.length > 0) fetchInsight();
  }, [filteredProducts.length]);

  // --- RENDER LOGIC ---

  if (user?.role === UserRole.PHARMACIST) {
      return <PharmacistDashboard 
         branchName={branches.find(b => b.id === effectiveBranchId)?.name}
         todaysSales={todaysSales}
         txCount={filteredTransactions.length}
         lowStockItems={lowStockItems}
         insight={insight}
      />;
  }

  if (user?.role === UserRole.MANAGER) {
      // Calculate aggregate for Manager
      // FilteredTransactions already correctly handles the "All" view for Managers now
      const aggregateSales = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

      return <ManagerDashboard 
          managedBranches={managedBranches}
          chartData={chartData}
          topProducts={topProducts}
          aggregateSales={aggregateSales}
          activeBranchId={activeBranchId}
          setActiveBranch={setActiveBranch}
      />;
  }

  if (user?.role === UserRole.OWNER) {
      // FIX: Calculate true MTD (Month To Date) Sales
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const globalSales = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.totalAmount, 0);

      return <OwnerDashboard 
          globalSales={globalSales}
          globalTx={transactions.length}
          chartData={chartData}
          branches={branches}
          insight={insight}
      />;
  }

  return <div>Loading...</div>;
};

export default Dashboard;
