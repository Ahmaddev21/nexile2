import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
    FileText, Download, Calendar, Printer, Share2, 
    TrendingUp, AlertTriangle, Package, DollarSign, 
    FileSpreadsheet, ArrowRight, CheckCircle, Search, Filter,
    Building2 as BuildingIcon, Clock as ClockIcon 
} from 'lucide-react';

type ReportType = 'DAILY_SALES' | 'STOCK_LEVELS' | 'LOW_STOCK' | 'EXPIRY_RISK' | 'PROFIT_LOSS' | 'BRANCH_PERF';

interface ReportConfig {
    id: ReportType;
    title: string;
    description: string;
    icon: any;
    roles: UserRole[];
    color: string;
}

const REPORT_TYPES: ReportConfig[] = [
    {
        id: 'DAILY_SALES',
        title: 'Daily Sales Report',
        description: 'Detailed breakdown of transactions, payment methods, and cashier activity.',
        icon: DollarSign,
        roles: [UserRole.PHARMACIST, UserRole.MANAGER, UserRole.OWNER],
        color: 'bg-emerald-100 text-emerald-600'
    },
    {
        id: 'STOCK_LEVELS',
        title: 'Stock Availability List',
        description: 'Current inventory status across all categories.',
        icon: Package,
        roles: [UserRole.PHARMACIST, UserRole.MANAGER, UserRole.OWNER],
        color: 'bg-blue-100 text-blue-600'
    },
    {
        id: 'LOW_STOCK',
        title: 'Low Stock Alerts',
        description: 'Critical items below minimum threshold requiring reorder.',
        icon: AlertTriangle,
        roles: [UserRole.PHARMACIST, UserRole.MANAGER, UserRole.OWNER],
        color: 'bg-orange-100 text-orange-600'
    },
    {
        id: 'EXPIRY_RISK',
        title: 'Expiry Risk Report',
        description: 'Products expiring within 30, 60, or 90 days.',
        icon: ClockIcon, 
        roles: [UserRole.PHARMACIST, UserRole.MANAGER, UserRole.OWNER],
        color: 'bg-red-100 text-red-600'
    },
    {
        id: 'PROFIT_LOSS',
        title: 'Profit & Margin Analysis',
        description: 'COGS, Revenue, and Net Profit margins.',
        icon: TrendingUp,
        roles: [UserRole.MANAGER, UserRole.OWNER],
        color: 'bg-violet-100 text-violet-600'
    },
    {
        id: 'BRANCH_PERF',
        title: 'Branch Performance',
        description: 'Comparative analysis of sales and efficiency across locations.',
        icon: BuildingIcon,
        roles: [UserRole.MANAGER, UserRole.OWNER],
        color: 'bg-indigo-100 text-indigo-600'
    }
];

const Reports = () => {
  const { transactions, products, branches } = useData();
  const { activeBranchId, user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  const [showPreview, setShowPreview] = useState(false);
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // --- DATA AGGREGATION ---
  const effectiveBranchId = user?.role === UserRole.PHARMACIST ? user.assignedBranchId : activeBranchId;
  
  // Fix: Explicitly handle potential undefined return from find()
  // This resolves "Object is possibly undefined" build error.
  const foundBranch = effectiveBranchId ? branches.find(b => b.id === effectiveBranchId) : null;
  const currentBranchName = foundBranch?.name ?? "Global Enterprise";

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const preset = e.target.value;
      const today = new Date();
      let start = new Date();
      let end = new Date();

      switch(preset) {
          case 'TODAY':
              break; // Default is today
          case 'WEEK':
              // Last 7 days
              start.setDate(today.getDate() - 6);
              break;
          case 'MONTH':
              // Start of current month
              start.setDate(1);
              break;
          case 'LAST_MONTH':
              // First day of prev month to last day of prev month
              start.setMonth(today.getMonth() - 1);
              start.setDate(1);
              end.setDate(0); // Last day of prev month
              break;
          case 'YTD':
              start.setMonth(0);
              start.setDate(1);
              break;
          default:
              return; // Custom
      }
      
      setDateRange({
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
      });
  };

  // Helper: Filter transactions by date and branch
  const getFilteredData = () => {
      let txs = transactions;
      let prods = products;

      // Branch Filter
      if (effectiveBranchId) {
          txs = txs.filter(t => t.branchId === effectiveBranchId);
          prods = prods.filter(p => p.branchId === effectiveBranchId);
      } else if (user?.role === UserRole.MANAGER && user.managedBranchIds) {
          // Managers viewing "All" only see their assigned branches
          txs = txs.filter(t => user.managedBranchIds?.includes(t.branchId));
          prods = prods.filter(p => user.managedBranchIds?.includes(p.branchId));
      }

      // Date Filter (for Transactions)
      txs = txs.filter(t => {
          const tDate = new Date(t.date).toISOString().split('T')[0];
          return tDate >= dateRange.start && tDate <= dateRange.end;
      });

      return { txs, prods };
  };

  const generateReportContent = () => {
      if (!selectedReport) return null;
      const { txs, prods } = getFilteredData();
      const term = reportSearchTerm.toLowerCase();

      switch (selectedReport.id) {
          case 'DAILY_SALES':
              const filteredTxs = txs.filter(t => 
                  t.id.toLowerCase().includes(term) || 
                  t.paymentMethod.toLowerCase().includes(term)
              );
              
              return (
                  <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Total Revenue</p>
                              <p className="text-xl font-bold">${filteredTxs.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Transactions</p>
                              <p className="text-xl font-bold">{filteredTxs.length}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Avg Ticket</p>
                              <p className="text-xl font-bold">${filteredTxs.length ? (filteredTxs.reduce((sum, t) => sum + t.totalAmount, 0) / filteredTxs.length).toFixed(2) : '0.00'}</p>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="p-2">Time</th>
                                    <th className="p-2">ID</th>
                                    <th className="p-2">Items</th>
                                    <th className="p-2">Method</th>
                                    <th className="p-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTxs.slice(0, 50).map(t => (
                                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2">{new Date(t.date).toLocaleTimeString()}</td>
                                        <td className="p-2 font-mono text-xs">{t.id.split('-')[1]}</td>
                                        <td className="p-2 text-xs text-slate-500">{t.items.length} items</td>
                                        <td className="p-2 text-xs font-medium uppercase">{t.paymentMethod}</td>
                                        <td className="p-2 text-right font-bold">${t.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                      {filteredTxs.length === 0 && <p className="text-center text-slate-400 py-4">No transactions found matching filter.</p>}
                      {filteredTxs.length > 50 && <p className="text-xs text-center text-slate-400 mt-2">...and {filteredTxs.length - 50} more rows (download to view all)</p>}
                  </div>
              );

          case 'STOCK_LEVELS':
              const filteredStock = prods.filter(p => 
                  p.name.toLowerCase().includes(term) || 
                  p.category.toLowerCase().includes(term) ||
                  p.batchNumber.toLowerCase().includes(term)
              );

              return (
                  <div>
                      <div className="flex items-center gap-2 mb-4 text-blue-600 bg-blue-50 p-3 rounded-lg">
                          <Package size={18} />
                          <span className="font-bold">{filteredStock.length} Items Listed</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="p-2">Product</th>
                                    <th className="p-2">Category</th>
                                    <th className="p-2">Batch</th>
                                    <th className="p-2 text-center">Stock</th>
                                    <th className="p-2 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStock.slice(0, 50).map(p => (
                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2 font-medium">{p.name}</td>
                                        <td className="p-2 text-xs text-slate-500">{p.category}</td>
                                        <td className="p-2 text-xs font-mono">{p.batchNumber}</td>
                                        <td className="p-2 text-center font-bold">{p.stock}</td>
                                        <td className="p-2 text-right text-slate-600">${(p.stock * p.costPrice).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              );
          
          case 'LOW_STOCK':
              const lowStock = prods
                .filter(p => p.stock <= p.minStockLevel)
                .filter(p => p.name.toLowerCase().includes(term));

              return (
                  <div>
                      <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <AlertTriangle size={18} />
                          <span className="font-bold">{lowStock.length} Critical Items Identified</span>
                      </div>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                  <th className="p-2">Product</th>
                                  <th className="p-2">Current</th>
                                  <th className="p-2">Min Lvl</th>
                                  <th className="p-2">Status</th>
                              </tr>
                          </thead>
                          <tbody>
                              {lowStock.map(p => (
                                  <tr key={p.id} className="border-b border-slate-100">
                                      <td className="p-2 font-medium">{p.name}</td>
                                      <td className="p-2 text-red-600 font-bold">{p.stock}</td>
                                      <td className="p-2 text-slate-500">{p.minStockLevel}</td>
                                      <td className="p-2"><span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Reorder</span></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              );

           case 'PROFIT_LOSS':
              const revenue = txs.reduce((sum, t) => sum + t.totalAmount, 0);
              let cogs = 0;
              txs.forEach(t => t.items.forEach(i => {
                  const p = prods.find(prod => prod.id === i.productId);
                  cogs += (p?.costPrice || i.price * 0.7) * i.quantity;
              }));
              const profit = revenue - cogs;
              
              return (
                  <div className="space-y-6">
                      <div className="p-6 bg-slate-900 text-white rounded-xl">
                          <div className="flex justify-between mb-2">
                              <span className="text-slate-400 text-sm uppercase">Net Profit</span>
                              <span className="text-emerald-400 font-bold">{((profit/revenue)*100 || 0).toFixed(1)}% Margin</span>
                          </div>
                          <h2 className="text-4xl font-bold">${profit.toFixed(2)}</h2>
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between p-3 bg-slate-50 rounded">
                              <span>Total Sales Revenue</span>
                              <span className="font-bold">${revenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-slate-50 rounded">
                              <span>Cost of Goods Sold</span>
                              <span className="font-bold text-red-500">-${cogs.toFixed(2)}</span>
                          </div>
                      </div>
                  </div>
              );

          case 'EXPIRY_RISK':
              const today = new Date();
              const ninetyDays = new Date();
              ninetyDays.setDate(today.getDate() + 90);
              
              const expiringItems = prods.filter(p => {
                  const expDate = new Date(p.expiryDate);
                  return expDate <= ninetyDays;
              }).sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

              return (
                  <div>
                       <div className="flex items-center gap-2 mb-4 text-red-600 bg-red-50 p-3 rounded-lg">
                          <ClockIcon size={18} />
                          <span className="font-bold">{expiringItems.length} Items Expiring Soon (90 Days)</span>
                      </div>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                  <th className="p-2">Expiry Date</th>
                                  <th className="p-2">Product</th>
                                  <th className="p-2">Batch</th>
                                  <th className="p-2 text-center">Stock</th>
                              </tr>
                          </thead>
                          <tbody>
                              {expiringItems.map(p => (
                                  <tr key={p.id} className="border-b border-slate-100">
                                      <td className="p-2 font-mono text-red-600 font-bold">{p.expiryDate}</td>
                                      <td className="p-2 font-medium">{p.name}</td>
                                      <td className="p-2 text-xs">{p.batchNumber}</td>
                                      <td className="p-2 text-center">{p.stock}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              );

          case 'BRANCH_PERF':
              const branchStats: Record<string, number> = {};
              txs.forEach(t => {
                  branchStats[t.branchId] = (branchStats[t.branchId] || 0) + t.totalAmount;
              });

              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                          <h3 className="font-bold text-indigo-900 mb-2">Network Overview</h3>
                          <p className="text-sm text-indigo-700">Comparative revenue analysis across active locations.</p>
                      </div>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                  <th className="p-2">Branch Name</th>
                                  <th className="p-2">Location</th>
                                  <th className="p-2 text-right">Total Revenue</th>
                              </tr>
                          </thead>
                          <tbody>
                              {branches.filter(b => branchStats[b.id] !== undefined).map(b => (
                                  <tr key={b.id} className="border-b border-slate-100">
                                      <td className="p-2 font-bold">{b.name}</td>
                                      <td className="p-2 text-slate-500 text-xs">{b.location}</td>
                                      <td className="p-2 text-right font-mono font-bold">${branchStats[b.id]?.toFixed(2)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              );

          default:
              return <div className="p-8 text-center text-slate-500">Preview not available for this report type.</div>;
      }
  };

  const handleDownloadCSV = () => {
      if (!selectedReport) return;
      const { txs, prods } = getFilteredData();
      
      let headers: string[] = [];
      let rows: string[][] = [];
      
      // Timestamp for filename
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
      let filename = `${selectedReport.id}_${currentBranchName.replace(/\s+/g, '_')}_${timestamp}.csv`;

      if (selectedReport.id === 'DAILY_SALES') {
          headers = ['Transaction ID', 'Date', 'Time', 'Items Count', 'Total Amount', 'Payment Method'];
          rows = txs.map(t => [
              t.id, 
              new Date(t.date).toISOString().split('T')[0],
              new Date(t.date).toLocaleTimeString(),
              t.items.length.toString(),
              t.totalAmount.toFixed(2), 
              t.paymentMethod
          ]);
      } else if (selectedReport.id === 'LOW_STOCK') {
          headers = ['Product Name', 'Category', 'Current Stock', 'Min Level', 'Cost Price', 'Selling Price'];
          rows = prods.filter(p => p.stock <= p.minStockLevel).map(p => [
              p.name, 
              p.category, 
              p.stock.toString(), 
              p.minStockLevel.toString(), 
              p.costPrice.toFixed(2),
              p.sellingPrice.toFixed(2)
          ]);
      } else if (selectedReport.id === 'STOCK_LEVELS') {
          headers = ['Product Name', 'Category', 'Batch', 'Expiry', 'Stock', 'Cost Value'];
          rows = prods.map(p => [
              p.name,
              p.category,
              p.batchNumber,
              p.expiryDate,
              p.stock.toString(),
              (p.stock * p.costPrice).toFixed(2)
          ]);
      } else if (selectedReport.id === 'EXPIRY_RISK') {
          const today = new Date();
          const ninetyDays = new Date();
          ninetyDays.setDate(today.getDate() + 90);
          
          headers = ['Product Name', 'Batch', 'Expiry Date', 'Days Remaining', 'Current Stock'];
          rows = prods.filter(p => {
              const exp = new Date(p.expiryDate);
              return exp <= ninetyDays;
          }).map(p => {
               const diffTime = new Date(p.expiryDate).getTime() - today.getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               return [
                  p.name,
                  p.batchNumber,
                  p.expiryDate,
                  diffDays.toString(),
                  p.stock.toString()
               ];
          });
      } else if (selectedReport.id === 'BRANCH_PERF') {
          headers = ['Branch ID', 'Branch Name', 'Location', 'Total Revenue', 'Tx Count'];
          const stats: Record<string, {rev: number, count: number}> = {};
          txs.forEach(t => {
               if(!stats[t.branchId]) stats[t.branchId] = {rev: 0, count: 0};
               stats[t.branchId].rev += t.totalAmount;
               stats[t.branchId].count += 1;
          });
          rows = branches.map(b => [
              b.id,
              b.name,
              b.location,
              (stats[b.id]?.rev || 0).toFixed(2),
              (stats[b.id]?.count || 0).toString()
          ]);
      } else if (selectedReport.id === 'PROFIT_LOSS') {
          const revenue = txs.reduce((sum, t) => sum + t.totalAmount, 0);
          let cogs = 0;
          txs.forEach(t => t.items.forEach(i => {
               const p = prods.find(prod => prod.id === i.productId);
               cogs += (p?.costPrice || i.price * 0.7) * i.quantity;
          }));
          const profit = revenue - cogs;
          
          headers = ['Metric', 'Value'];
          rows = [
              ['Total Revenue', revenue.toFixed(2)],
              ['Cost of Goods Sold', cogs.toFixed(2)],
              ['Net Profit', profit.toFixed(2)],
              ['Margin %', ((profit/revenue)*100).toFixed(2) + '%']
          ];
      } else {
          headers = ['Date', 'Value'];
          rows = [['No specific CSV logic defined for this report type']];
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${c}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
  };

  const handleShareWhatsApp = () => {
      if (!selectedReport) return;
      const { txs } = getFilteredData();
      const totalRevenue = txs.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2);
      const txCount = txs.length;
      
      const text = `*Nexile Report: ${selectedReport.title}*
Branch: ${currentBranchName}
Date: ${dateRange.start} to ${dateRange.end}
------------------
Total Revenue: $${totalRevenue}
Transactions: ${txCount}
------------------
Generated via Nexile OS`;

      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24 animate-fade-in">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FileText className="text-nexile-600" size={32} /> 
              Smart Report Center
          </h1>
          <p className="text-slate-500 mt-2">
              Generate enterprise-grade financial and operational intelligence reports.
          </p>
      </div>

      {/* 1. Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {REPORT_TYPES.filter(r => r.roles.includes(user?.role as UserRole)).map(report => (
              <button
                  key={report.id}
                  onClick={() => { 
                      setSelectedReport(report); 
                      setShowPreview(false); 
                      setReportSearchTerm(''); 
                    }}
                  className={`text-left p-6 rounded-2xl border transition-all duration-200 group relative overflow-hidden
                    ${selectedReport?.id === report.id 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-nexile-400 hover:shadow-md'
                    }`}
              >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${report.color} group-hover:scale-110 transition-transform`}>
                      <report.icon size={24} />
                  </div>
                  <h3 className={`font-bold text-lg mb-1 ${selectedReport?.id === report.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {report.title}
                  </h3>
                  <p className={`text-sm ${selectedReport?.id === report.id ? 'text-slate-400' : 'text-slate-500'}`}>
                      {report.description}
                  </p>
                  {selectedReport?.id === report.id && (
                      <div className="absolute top-4 right-4 text-emerald-400">
                          <CheckCircle size={24} />
                      </div>
                  )}
              </button>
          ))}
      </div>

      {/* 2. Configuration & Action Panel */}
      {selectedReport && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-slide-up">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Configuring: <span className="text-nexile-600">{selectedReport.title}</span>
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">Select date range to analyze data for {currentBranchName}.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                      <select 
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-nexile-500"
                          onChange={handlePresetChange}
                          defaultValue="TODAY"
                      >
                          <option value="TODAY">Today</option>
                          <option value="WEEK">This Week</option>
                          <option value="MONTH">This Month</option>
                          <option value="LAST_MONTH">Last Month</option>
                          <option value="YTD">Year to Date</option>
                      </select>

                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 px-3">
                              <Calendar size={18} className="text-slate-400" />
                              <input 
                                  type="date" 
                                  value={dateRange.start}
                                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                  className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-200"
                              />
                          </div>
                          <ArrowRight size={16} className="text-slate-300" />
                          <div className="flex items-center gap-2 px-3">
                              <input 
                                  type="date" 
                                  value={dateRange.end}
                                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                  className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-200"
                              />
                          </div>
                      </div>
                  </div>
              </div>

              <div className="p-8 flex flex-col lg:flex-row gap-8">
                  {/* Preview Area */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden flex flex-col">
                      {/* Watermark Effect */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                          <h1 className="text-6xl font-bold rotate-45 uppercase text-slate-900">Nexile Verified</h1>
                      </div>

                      {!showPreview ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[250px]">
                              <FileText size={48} className="mb-4 opacity-20" />
                              <p>Click 'Generate Preview' to view report data</p>
                          </div>
                      ) : (
                          <div className="animate-fade-in relative z-10 flex flex-col h-full">
                              <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                                  <div>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Preview</p>
                                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedReport.title}</h3>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs text-slate-500">Generated for</p>
                                      <p className="font-bold text-sm">{currentBranchName}</p>
                                  </div>
                              </div>

                              {/* In-Report Filter */}
                              {(selectedReport.id === 'DAILY_SALES' || selectedReport.id === 'STOCK_LEVELS' || selectedReport.id === 'LOW_STOCK') && (
                                  <div className="mb-4 flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <Search size={16} className="text-slate-400 ml-2"/>
                                      <input 
                                          type="text"
                                          placeholder="Filter data..."
                                          className="bg-transparent outline-none text-sm w-full"
                                          value={reportSearchTerm}
                                          onChange={(e) => setReportSearchTerm(e.target.value)}
                                      />
                                  </div>
                              )}

                              <div className="flex-1 overflow-auto">
                                {generateReportContent()}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Actions Sidebar */}
                  <div className="w-full lg:w-72 flex flex-col gap-4">
                      <button 
                          onClick={() => setShowPreview(true)}
                          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                      >
                          Generate Preview
                      </button>
                      
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                      
                      <button 
                          onClick={handleDownloadCSV}
                          disabled={!showPreview}
                          className="flex items-center justify-center gap-3 w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <FileSpreadsheet size={18} /> Download Excel
                      </button>
                      <button 
                          onClick={() => window.print()}
                          disabled={!showPreview}
                          className="flex items-center justify-center gap-3 w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Printer size={18} /> Print PDF
                      </button>
                      <button 
                          onClick={handleShareWhatsApp}
                          disabled={!showPreview}
                          className="flex items-center justify-center gap-3 w-full py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-xl font-bold hover:bg-[#25D366]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Share2 size={18} /> Share WhatsApp
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Reports;