
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { TRIAL_DAYS } from '../constants';
import { generateBusinessInsights } from '../services/geminiService';
import { AlertCircle, DollarSign, Package, ShoppingBag, Sparkles, Clock, TrendingUp, ArrowUpRight, Filter, Lock, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, Legend, Cell } from 'recharts';
import { UserRole } from '../types';

const Dashboard = () => {
  const { user, activeBranchId, setActiveBranch } = useAuth();
  const { products, transactions, branches } = useData();
  const [insight, setInsight] = useState<string>('Analyzing business performance...');
  const [timeRange, setTimeRange] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

  // STRICT DATA ISOLATION LOGIC
  // Helper to determine the effective branch ID for filtering
  const effectiveBranchId = useMemo(() => {
    if (user?.role === UserRole.PHARMACIST) {
        // Always prioritize the assigned branch for Pharmacists
        return user.assignedBranchId;
    }
    // For Owners/Managers, use the selected active branch (or null for All)
    return activeBranchId;
  }, [user, activeBranchId]);

  // Filter branches based on user role for the dropdown
  const availableBranches = useMemo(() => {
      if (user?.role === UserRole.MANAGER && user.managedBranchIds && user.managedBranchIds.length > 0) {
          return branches.filter(b => user.managedBranchIds!.includes(b.id));
      }
      return branches;
  }, [branches, user]);

  const filteredTransactions = useMemo(() => {
      // Safety: If Pharmacist has no branch (error state), show nothing
      if (user?.role === UserRole.PHARMACIST && !effectiveBranchId) return [];

      return effectiveBranchId 
        ? transactions.filter(t => t.branchId === effectiveBranchId)
        : transactions;
  }, [transactions, effectiveBranchId, user]);

  const filteredProducts = useMemo(() => {
      if (user?.role === UserRole.PHARMACIST && !effectiveBranchId) return [];

      return effectiveBranchId
        ? products.filter(p => p.branchId === effectiveBranchId)
        : products;
  }, [products, effectiveBranchId, user]);

  // Stats Calculation
  const lowStockCount = filteredProducts.filter(p => p.stock <= p.minStockLevel).length;
  
  const todaysSales = filteredTransactions
    .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.totalAmount, 0);

  // Multi-Metric Chart Data Logic with Robust Date Handling
  const chartData = useMemo(() => {
      const data = [];
      const now = new Date();
      
      if (timeRange === 'DAILY') {
          // Last 7 days
          for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(now.getDate() - i);
              const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dateStr = d.toDateString();
              
              const daysTx = filteredTransactions.filter(t => new Date(t.date).toDateString() === dateStr);
              const revenue = daysTx.reduce((sum, t) => sum + t.totalAmount, 0);
              const txCount = daysTx.length;

              data.push({ 
                  name: dayStr, 
                  revenue: revenue,
                  profit: revenue * 0.35, // Est 35% margin
                  transactions: txCount
              });
          }
      } else if (timeRange === 'WEEKLY') {
          // Last 4 weeks (Calendar weeks logic)
          for (let i = 3; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - (i * 7));
              
              // Calculate Start of Week (Sunday)
              const startOfWeek = new Date(d);
              startOfWeek.setDate(d.getDate() - d.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              
              // Calculate End of Week (Saturday)
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              endOfWeek.setHours(23, 59, 59, 999);
              
              const label = i === 0 ? 'This Week' : `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;

              const weeksTx = filteredTransactions.filter(t => {
                  const tDate = new Date(t.date);
                  return tDate >= startOfWeek && tDate <= endOfWeek;
              });

              const revenue = weeksTx.reduce((sum, t) => sum + t.totalAmount, 0);
              const txCount = weeksTx.length;

              data.push({ 
                  name: label, 
                  revenue: revenue,
                  profit: revenue * 0.32,
                  transactions: txCount
              }); 
          }
      } else {
           // Monthly (Last 6 months)
           for(let i = 5; i >= 0; i--) {
               const d = new Date();
               d.setMonth(now.getMonth() - i);
               const monthName = d.toLocaleString('default', { month: 'short' });
               const monthYear = d.getFullYear();
               const monthIdx = d.getMonth();

               const monthsTx = filteredTransactions.filter(t => {
                   const tDate = new Date(t.date);
                   return tDate.getMonth() === monthIdx && tDate.getFullYear() === monthYear;
               });

               const revenue = monthsTx.reduce((sum, t) => sum + t.totalAmount, 0);
               const txCount = monthsTx.length;

               data.push({ 
                   name: monthName, 
                   revenue: revenue,
                   profit: revenue * 0.38,
                   transactions: txCount
               });
           }
      }
      return data;
  }, [timeRange, filteredTransactions]);

  // Top Products Calculation
  const topProducts = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredTransactions.forEach(t => {
          t.items.forEach(i => {
              counts[i.name] = (counts[i.name] || 0) + i.quantity;
          });
      });
      return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, qty]) => {
              // Find latest price reference from the filtered product list (or fallback to global if sold out)
              const prod = products.find(p => p.name === name);
              return { name, qty, price: prod?.sellingPrice || 0 };
          });
  }, [filteredTransactions, products]);

  useEffect(() => {
    const fetchInsight = async () => {
        if (filteredProducts.length > 0) {
            const text = await generateBusinessInsights(filteredProducts, filteredTransactions);
            setInsight(text);
        } else {
            setInsight("Add inventory to generate AI insights.");
        }
    };
    // Debounce or simple check to prevent too many calls
    if(filteredProducts.length > 0 && filteredTransactions.length > 0) {
        fetchInsight();
    }
  }, [filteredProducts.length, filteredTransactions.length]); // Only trigger on length change to reduce API calls

  const currentBranchName = effectiveBranchId 
      ? branches.find(b => b.id === effectiveBranchId)?.name 
      : "All Branches";

  const timeLabel = timeRange === 'DAILY' ? 'Daily' : timeRange === 'WEEKLY' ? 'Weekly' : 'Monthly';

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      {/* Trial Banner */}
      {user?.role === UserRole.OWNER && (
          <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4 border border-slate-700">
            <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                    <Clock className="text-nexile-300" size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">Enterprise Trial Active</h3>
                    <p className="text-xs text-slate-300">{TRIAL_DAYS} days remaining.</p>
                </div>
            </div>
            <button className="w-full sm:w-auto px-4 py-2 bg-nexile-600 hover:bg-nexile-500 text-white text-xs font-bold rounded-lg transition-colors">
                Upgrade Plan
            </button>
          </div>
      )}

      {/* Header & Branch Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
                 <p className="text-slate-500 text-sm">Overview for <span className="font-bold text-nexile-600">{currentBranchName}</span></p>
                 {user?.role === UserRole.PHARMACIST && (
                     <Lock size={12} className="text-slate-400" />
                 )}
            </div>
          </div>

          {/* Only show switcher if user is NOT a pharmacist (Owner/Manager) */}
          {user?.role !== UserRole.PHARMACIST && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <Filter size={16} className="text-slate-400 ml-2"/>
                <select 
                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer pr-4 min-w-[150px]"
                    value={activeBranchId || ''}
                    onChange={(e) => setActiveBranch(e.target.value)}
                >
                    <option value="">All Branches (Global)</option>
                    {availableBranches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>
          )}
      </div>

      {/* Stats Grid - MOVED TO TOP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-nexile-500 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                    <DollarSign size={22} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                    <TrendingUp size={12} /> {timeRange === 'DAILY' ? 'Today' : timeRange === 'WEEKLY' ? 'This Week' : 'This Month'}
                </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                ${(timeRange === 'DAILY' ? todaysSales : chartData[chartData.length-1]?.revenue || 0).toFixed(2)}
            </h3>
            <p className="text-sm text-slate-500">Total Revenue</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <ShoppingBag size={22} />
                </div>
                <span className="text-xs text-slate-400">Total Volume</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{filteredTransactions.length}</h3>
            <p className="text-sm text-slate-500">Transactions Processed</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${lowStockCount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                    <AlertCircle size={22} />
                </div>
                <span className="text-xs text-slate-400">Critical</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{lowStockCount}</h3>
            <p className="text-sm text-slate-500">Low Stock Items</p>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20 group-hover:translate-x-10 transition-transform duration-700"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">AI Business Analyst</span>
            </div>
            <p className="text-lg font-medium leading-relaxed opacity-95">
                "{insight}"
            </p>
        </div>
      </div>

      {/* Charts Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Sales Trend Chart Section - 3 Separate Charts */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity size={20} className="text-nexile-500"/> Sales Analytics
                      </h3>
                      <p className="text-sm text-slate-500">Revenue, profit, and volume trends</p>
                  </div>
                  
                  {/* Time Range Selector */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                      {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                timeRange === range 
                                ? 'bg-white dark:bg-slate-700 text-nexile-600 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                              {range}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Chart 1: Revenue (Area) */}
              <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</h4>
                      <span className="text-xs font-mono text-nexile-600 bg-nexile-50 dark:bg-nexile-900/20 px-2 py-0.5 rounded">
                          ${chartData.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(2)} Total
                      </span>
                  </div>
                  <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px', fontSize: '12px' }}
                                  itemStyle={{ color: '#fff' }}
                              />
                              <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Split Row for Profit and Transactions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 2: Profit (Bar) */}
                  <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Net Profit</h4>
                      <div className="h-[150px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                                  <XAxis dataKey="name" hide />
                                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} />
                                  <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Chart 3: Transactions (Line) */}
                  <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transaction Count</h4>
                      <div className="h-[150px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                                  <XAxis dataKey="name" hide />
                                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} />
                                  <Line type="monotone" dataKey="transactions" stroke="#8b5cf6" strokeWidth={2} dot={{r: 2}} />
                              </LineChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          {/* Top Products Chart Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Package size={20} className="text-nexile-500"/> Top Movers
              </h3>
              <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                tick={{fontSize: 11, fill: '#94a3b8'}} 
                                interval={0} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(val) => val.length > 15 ? `${val.slice(0,15)}...` : val}
                          />
                          <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="qty" name="Quantity Sold" radius={[0, 4, 4, 0]} barSize={20}>
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Top Products List Details */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Package size={20} className="text-blue-500"/> Best Performance Items (Detailed)
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {topProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <p>No sales data recorded for this period.</p>
                  </div>
              ) : (
                  topProducts.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  {idx + 1}
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{item.name}</p>
                                  <p className="text-xs text-slate-500">{item.qty} units sold</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">${(item.price * item.qty).toFixed(0)}</p>
                              <p className="text-[10px] text-green-500 flex items-center justify-end gap-0.5">
                                  <ArrowUpRight size={10} /> Top
                              </p>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
