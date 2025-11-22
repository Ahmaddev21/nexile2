
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, AlertTriangle, Filter, CheckCircle, Building2, Calendar, ChevronDown, ChevronUp, Edit, DollarSign, BarChart3, Trash2, ScanLine } from 'lucide-react';
import { Product, UserRole } from '../types';

const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct, branches } = useData();
  const { activeBranchId, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // STRICT DATA ISOLATION
  const effectiveBranchId = user?.role === UserRole.PHARMACIST 
    ? user.assignedBranchId 
    : activeBranchId;

  // Optimization: Memoize filtered list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        if (user?.role === UserRole.PHARMACIST && !effectiveBranchId) return false;

        // Managers in "All" view should only see their managed branches
        if (user?.role === UserRole.MANAGER && !effectiveBranchId) {
             if (!user.managedBranchIds?.includes(p.branchId)) return false;
        }

        const matchesBranch = effectiveBranchId ? p.branchId === effectiveBranchId : true;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            p.name.toLowerCase().includes(searchLower) || 
            p.category.toLowerCase().includes(searchLower) || 
            p.batchNumber.toLowerCase().includes(searchLower) ||
            (p.barcode && p.barcode.includes(searchLower));
        
        return matchesBranch && matchesSearch;
    });
  }, [products, user, effectiveBranchId, searchTerm]);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'General',
    minStockLevel: 10,
    stock: 0,
    branchId: ''
  });

  const handleOpenAddModal = () => {
      setEditingProduct(null);
      setNewProduct({ 
          category: 'General', 
          minStockLevel: 10, 
          stock: 0,
          branchId: effectiveBranchId || ''
      });
      setShowModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
      setEditingProduct(product);
      setNewProduct({ ...product });
      setShowModal(true);
  };

  const handleDelete = (productId: string) => {
      if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
          deleteProduct(productId);
          if (expandedProductId === productId) setExpandedProductId(null);
      }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBranchId = editingProduct 
        ? editingProduct.branchId 
        : (newProduct.branchId || effectiveBranchId);

    if(targetBranchId) {
        const productData: Product = {
            id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
            name: newProduct.name || '',
            category: newProduct.category || 'General',
            barcode: newProduct.barcode || '',
            batchNumber: newProduct.batchNumber || '',
            expiryDate: newProduct.expiryDate || '',
            costPrice: Number(newProduct.costPrice) || 0,
            sellingPrice: Number(newProduct.sellingPrice) || 0,
            stock: Number(newProduct.stock) || 0,
            minStockLevel: Number(newProduct.minStockLevel) || 10,
            branchId: targetBranchId
        };

        if (editingProduct) {
            updateProduct(productData);
        } else {
            addProduct(productData);
        }
        
        setShowModal(false);
        setNewProduct({ category: 'General', minStockLevel: 10, stock: 0, branchId: '' });
        setEditingProduct(null);
    } else {
        alert("Please select a branch for this product.");
    }
  };

  const getExpiryStatus = (dateStr: string) => {
    if (!dateStr) return { status: 'GOOD', label: '', color: 'text-slate-400' };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(dateStr);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'EXPIRED', label: 'Expired', color: 'text-red-600 font-bold' };
    if (diffDays <= 30) return { status: 'WARNING', label: `Exp in ${diffDays}d`, color: 'text-amber-600 font-bold' };
    return { status: 'GOOD', label: '', color: 'text-slate-400' };
  };

  const toggleRow = (id: string) => {
      setExpandedProductId(expandedProductId === id ? null : id);
  };

  const currentBranchName = effectiveBranchId 
    ? branches.find(b => b.id === effectiveBranchId)?.name 
    : 'All Branches';

  // Filter branches available for selection in modal based on role
  const availableBranches = useMemo(() => {
     if (user?.role === UserRole.MANAGER && user.managedBranchIds) {
         return branches.filter(b => user.managedBranchIds?.includes(b.id));
     }
     return branches;
  }, [branches, user]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {effectiveBranchId 
              ? `Managing stock for ${currentBranchName}` 
              : user?.role === UserRole.MANAGER ? 'Viewing all assigned branches' : 'Viewing global inventory across all branches'}
          </p>
        </div>
        <button 
            onClick={handleOpenAddModal}
            disabled={!effectiveBranchId && user?.role !== UserRole.OWNER && user?.role !== UserRole.MANAGER} 
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Plus size={18} />
            Add Product
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="text-slate-400 ml-2" size={20} />
        <input 
            type="text" 
            placeholder="Search by name, barcode, batch..." 
            className="bg-transparent border-none outline-none flex-1 text-slate-900 dark:text-white placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
            <Filter size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4 w-8"></th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4">Identifiers</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-center">Stock</th>
                        <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map(product => {
                        const expiryInfo = getExpiryStatus(product.expiryDate);
                        const isExpanded = expandedProductId === product.id;
                        const margin = ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100;

                        return (
                            <React.Fragment key={product.id}>
                                <tr 
                                    onClick={() => toggleRow(product.id)}
                                    className={`cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                >
                                    <td className="px-6 py-4 text-slate-400">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{product.name}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Building2 size={12} />
                                            {branches.find(b => b.id === product.branchId)?.name || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="text-xs font-mono mb-0.5">Batch: {product.batchNumber}</div>
                                        {product.barcode && (
                                            <div className="text-xs font-mono text-slate-400 mb-1 flex items-center gap-1">
                                                <ScanLine size={10} /> {product.barcode}
                                            </div>
                                        )}
                                        <div className={`text-xs flex flex-wrap items-center gap-2 ${expiryInfo.color}`}>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} />
                                                <span>{product.expiryDate}</span>
                                                {(expiryInfo.status === 'WARNING' || expiryInfo.status === 'EXPIRED') && (
                                                    <AlertTriangle size={12} strokeWidth={2.5} />
                                                )}
                                            </div>
                                            {expiryInfo.status !== 'GOOD' && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide border font-bold ${
                                                    expiryInfo.status === 'EXPIRED' 
                                                    ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' 
                                                    : 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400'
                                                }`}>
                                                    {expiryInfo.label}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                                        ${product.sellingPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-900 dark:text-white font-medium">
                                        {product.stock}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {product.stock <= product.minStockLevel ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                <AlertTriangle size={12} /> Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle size={12} /> Good
                                            </span>
                                        )}
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-slate-50 dark:bg-slate-800/30 animate-fade-in">
                                        <td colSpan={8} className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="space-y-2">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Financials</p>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Selling Price:</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">${product.sellingPrice.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Cost Price:</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">${product.costPrice.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Profit/Unit:</span>
                                                        <span className="font-mono text-green-600 dark:text-green-400">+${(product.sellingPrice - product.costPrice).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Margin:</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-300">{margin.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Inventory Control</p>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Min Stock Level:</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">{product.minStockLevel}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Restock Status:</span>
                                                        <span className={product.stock <= product.minStockLevel ? 'text-red-500 font-bold' : 'text-green-500'}>
                                                            {product.stock <= product.minStockLevel ? 'Order Now' : 'Sufficient'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                     <p className="text-xs text-slate-500 uppercase tracking-wider">Compliance</p>
                                                     <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Barcode (UPC/EAN):</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">{product.barcode || 'N/A'}</span>
                                                     </div>
                                                     <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Batch ID:</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">{product.batchNumber}</span>
                                                     </div>
                                                     <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Expiry:</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">{product.expiryDate}</span>
                                                     </div>
                                                </div>

                                                <div className="flex items-end justify-end gap-3">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(product.id);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-all"
                                                    >
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEditModal(product);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-nexile-600 hover:bg-nexile-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-nexile-500/30 transition-all"
                                                    >
                                                        <Edit size={16} /> Edit Details
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {filteredProducts.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                {effectiveBranchId 
                                  ? "No products found for this branch." 
                                  : "No products in the system."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingProduct ? 'Edit Product Details' : 'Add New Inventory Item'}
                    </h2>
                    {editingProduct && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">
                            ID: {editingProduct.id}
                        </span>
                    )}
                  </div>
                  
                  {!effectiveBranchId && !editingProduct && (
                      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-2 flex items-center gap-2">
                              <Building2 size={16} className="text-nexile-500"/> Select Destination Branch
                          </h3>
                          <p className="text-xs text-slate-500 mb-2">
                             {user?.role === UserRole.MANAGER 
                                ? "Select which of your managed branches will receive this product." 
                                : "Specify where this product will be stocked."}
                          </p>
                          <select
                              required
                              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none"
                              value={newProduct.branchId}
                              onChange={(e) => setNewProduct({...newProduct, branchId: e.target.value})}
                          >
                              <option value="">-- Select a Branch --</option>
                              {availableBranches.map(b => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                          </select>
                      </div>
                  )}

                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-1 sm:col-span-2">
                          <label className="block text-xs font-medium mb-1 text-slate-500">Product Name</label>
                          <input 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.name || ''}
                            onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Category</label>
                          <select 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.category}
                            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                          >
                            <option>General</option>
                            <option>Antibiotics</option>
                            <option>Pain Relief</option>
                            <option>Supplements</option>
                            <option>First Aid</option>
                            <option>Skincare</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Batch Number</label>
                          <input 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.batchNumber || ''}
                            onChange={e => setNewProduct({...newProduct, batchNumber: e.target.value})} 
                           />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500 flex items-center gap-1">Barcode <ScanLine size={12}/></label>
                          <input 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            placeholder="Scan or type UPC/EAN"
                            value={newProduct.barcode || ''}
                            onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} 
                           />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Expiry Date</label>
                          <input 
                            type="date" 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.expiryDate || ''}
                            onChange={e => setNewProduct({...newProduct, expiryDate: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Stock Quantity</label>
                          <input 
                            type="number" 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.stock ?? ''}
                            onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Min Stock Level</label>
                          <input 
                            type="number" 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.minStockLevel ?? ''}
                            onChange={e => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Cost Price ($)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.costPrice ?? ''}
                            onChange={e => setNewProduct({...newProduct, costPrice: Number(e.target.value)})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Selling Price ($)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            required 
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 outline-none" 
                            value={newProduct.sellingPrice ?? ''}
                            onChange={e => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})} 
                          />
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-nexile-600 text-white rounded-lg hover:bg-nexile-700 font-bold shadow-lg shadow-nexile-500/20">
                              {editingProduct ? 'Update Product' : 'Save Product'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
