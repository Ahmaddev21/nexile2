
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CartItem, Transaction } from '../types';
import { Search, ScanLine, Trash2, CreditCard, Banknote, Receipt, Check, AlertCircle, Printer, Camera, X } from 'lucide-react';

const POS = () => {
  const { products, recordTransaction, branches } = useData();
  const { activeBranchId, user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [successModal, setSuccessModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Refocus on input when success modal closes or component mounts
  useEffect(() => {
      if (!successModal && !showScanner) {
          const timer = setTimeout(() => {
            barcodeInputRef.current?.focus();
          }, 100);
          return () => clearTimeout(timer);
      }
  }, [successModal, showScanner]);

  // Cleanup camera when component unmounts or modal closes
  useEffect(() => {
      return () => {
          if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
          }
      };
  }, []);

  const stopCamera = useCallback(() => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setShowScanner(false);
  }, []);

  const startCamera = async () => {
      setShowScanner(true);
      // Small delay to allow modal DOM to render
      setTimeout(async () => {
          try {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                  // Check if component is still mounted and ref exists
                  if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                  } else {
                      // If modal closed quickly, stop stream immediately
                      stream.getTracks().forEach(track => track.stop());
                  }
              } else {
                  alert("Camera API not supported in this browser.");
                  setShowScanner(false);
              }
          } catch (err) {
              console.error("Camera error", err);
              alert("Could not access camera. Please ensure permissions are granted.");
              setShowScanner(false);
          }
      }, 100);
  };

  if (!activeBranchId) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Branch Selection Required</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                  Point of Sale requires a specific branch context. Please select a branch.
              </p>
          </div>
      );
  }

  const branchProducts = products.filter(p => p.branchId === activeBranchId);
  const displayedProducts = branchProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const addToCart = (product: any) => {
    // Critical: Check Live Stock
    // Even though 'product' object might be stale from render, we trust it for basic ID.
    // But we must check against what we already have in the cart + actual shelf stock.
    
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Hard Check: Cannot add more than available stock
        if(existing.quantity >= product.stock) {
            return prev; // Ignore add request
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === productId) {
            const newQty = Math.max(1, item.quantity + delta);
            const product = branchProducts.find(p => p.id === productId);
            // Stock validation
            if (product && newQty > product.stock) return item;
            return { ...item, quantity: newQty };
        }
        return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

  const handleCheckout = (method: 'CASH' | 'CARD') => {
    if (cart.length === 0) return;

    const transaction: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString(),
        totalAmount: cartTotal,
        items: cart.map(i => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.sellingPrice })),
        branchId: activeBranchId!,
        userId: user?.id || 'unknown',
        paymentMethod: method
    };

    recordTransaction(transaction);
    setLastTransaction(transaction);
    setSuccessModal(true);
    setCart([]);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const product = branchProducts.find(p => 
        (p.barcode && p.barcode === searchTerm.trim()) || 
        p.batchNumber === searchTerm.trim() || 
        p.name.toLowerCase() === searchTerm.toLowerCase()
    );

    if (product) {
        addToCart(product);
        setSearchTerm(''); 
    }
  };
  
  const handlePrintReceipt = () => {
      window.print();
  };

  const simulateScan = (product: any) => {
      addToCart(product);
      stopCamera();
  };

  return (
    <div className="h-[calc(100vh-100px)] p-4 flex gap-4 overflow-hidden animate-fade-in pb-20 print:h-auto print:overflow-visible print:block">
      {/* Left Side: Product Grid */}
      <div className="flex-1 flex flex-col gap-4 h-full min-w-0 print:hidden">
        <div className="flex gap-4">
            <form onSubmit={handleBarcodeSubmit} className="flex-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-sm">
                <button 
                    type="button"
                    onClick={startCamera}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-nexile-100 dark:hover:bg-nexile-900/20 text-nexile-600 transition-colors"
                    title="Open Camera Scanner"
                >
                    <ScanLine size={20} />
                </button>
                <input 
                    ref={barcodeInputRef}
                    autoFocus
                    type="text" 
                    placeholder="Scan barcode or search product..." 
                    className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white p-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="hidden">Scan</button>
            </form>
            <div className="hidden sm:flex bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-500 text-sm items-center">
                {branches.find(b => b.id === activeBranchId)?.name}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8 pr-2">
            {displayedProducts.map(product => (
                <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 ${product.stock === 0 ? 'opacity-50 bg-slate-100 dark:bg-slate-900 border-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-nexile-500 hover:shadow-md'}`}
                >
                    <div className="w-full">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{product.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                             <p className="text-xs text-slate-500">{product.batchNumber}</p>
                             {product.barcode && <p className="text-[10px] text-slate-400 flex items-center gap-0.5"><ScanLine size={8}/> {product.barcode}</p>}
                        </div>
                    </div>
                    <div className="flex justify-between items-end w-full">
                        <span className="font-bold text-nexile-600 dark:text-nexile-400">${product.sellingPrice.toFixed(2)}</span>
                        <span className={`text-xs px-2 py-1 rounded ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {product.stock} in stock
                        </span>
                    </div>
                </button>
            ))}
            {displayedProducts.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center h-40 text-slate-400">
                     <Search size={32} className="mb-2 opacity-50"/>
                     <p>No products found.</p>
                 </div>
            )}
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl h-full mb-4 shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt size={20} className="text-nexile-500"/> Current Sale
            </h2>
            <p className="text-xs text-slate-500 mt-1">Transaction ID: #{Date.now().toString().slice(-6)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <ScanLine size={48} className="opacity-20" />
                    <p>Scan item to start</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg group">
                        <div className="flex-1 overflow-hidden">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">{item.name}</h4>
                            <p className="text-xs text-slate-500">${item.sellingPrice.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 px-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900">-</button>
                                <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
            <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500">Total</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleCheckout('CASH')}
                    disabled={cart.length === 0}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    <Banknote size={18} /> Cash
                </button>
                <button 
                    onClick={() => handleCheckout('CARD')}
                    disabled={cart.length === 0}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-nexile-600 text-white font-medium hover:bg-nexile-700 transition-colors shadow-lg shadow-nexile-500/30 disabled:opacity-50"
                >
                    <CreditCard size={18} /> Card
                </button>
            </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
                  <div className="p-4 flex justify-between items-center border-b border-slate-800">
                      <h3 className="text-white font-bold flex items-center gap-2"><Camera size={20} className="text-nexile-500"/> Scan Barcode</h3>
                      <button onClick={stopCamera} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80"></video>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-48 border-2 border-nexile-500/50 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-nexile-500 shadow-[0_0_10px_#14b8a6] animate-[scan_2s_ease-in-out_infinite]"></div>
                          </div>
                      </div>
                      <p className="absolute bottom-4 text-xs text-slate-300 bg-black/50 px-3 py-1 rounded-full">Position barcode within frame</p>
                  </div>
                  <div className="p-4 bg-slate-800/50">
                      <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Simulate Scan (Demo Mode)</p>
                      <div className="grid grid-cols-2 gap-2">
                          {branchProducts.slice(0, 4).map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => simulateScan(p)}
                                className="text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                              >
                                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{p.barcode || 'No Barcode'}</p>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-white print:static print:block print:backdrop-blur-none">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-slide-up max-w-sm w-full print:shadow-none print:w-full print:max-w-none print:p-0">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4 print:hidden">
                    <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 print:hidden">Transaction Complete</h2>
                <p className="text-slate-500 mb-6 print:hidden">Receipt generated and inventory updated.</p>
                
                {/* Printable Receipt Area */}
                <div className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 mb-4 print:border-none print:bg-white print:p-0 print:text-left">
                    <div className="text-center mb-4">
                        <p className="text-lg font-bold text-slate-900 dark:text-white uppercase">Nexile Pharmacy</p>
                        <p className="text-xs text-slate-400">{branches.find(b => b.id === activeBranchId)?.name}</p>
                        <p className="text-xs text-slate-400">{branches.find(b => b.id === activeBranchId)?.location}</p>
                    </div>
                    
                    <div className="border-b border-dashed border-slate-300 my-2"></div>
                    
                    <div className="space-y-2 mb-4">
                        {lastTransaction?.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="border-b border-dashed border-slate-300 my-2"></div>
                    
                    <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white">
                        <span>TOTAL</span>
                        <span>${lastTransaction?.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 mt-4 text-center">
                        PAID VIA {lastTransaction?.paymentMethod} • {new Date().toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 text-center">Trans ID: {lastTransaction?.id}</p>
                </div>

                <div className="flex gap-3 w-full print:hidden">
                    <button 
                        onClick={() => setSuccessModal(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handlePrintReceipt}
                        className="flex-1 py-2 bg-nexile-600 hover:bg-nexile-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default POS;
