
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, User, Building2, KeyRound, Loader2, LogIn, UserPlus, AlertCircle, Hexagon, Activity } from 'lucide-react';

const AuthPage = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  
  // Form State
  const [role, setRole] = useState<UserRole>(UserRole.PHARMACIST);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branchName: '',
    accessCode: ''
  });

  const handleRoleChange = (newRole: UserRole) => {
      setRole(newRole);
      setFormData(prev => ({
          ...prev,
          branchName: '',
          accessCode: ''
      }));
      setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'SIGNUP') {
        await signup(
            formData.name,
            formData.email,
            formData.password,
            role,
            role === UserRole.MANAGER ? undefined : formData.branchName,
            formData.accessCode
        );
      } else {
        await login(
            formData.email,
            formData.password,
            role,
            formData.branchName,
            formData.accessCode
        );
      }
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Capture real server error or fallback
      // Check for response.data.message (standard express error)
      const serverMsg = err.response?.data?.message;
      const fallbackMsg = err.message || "Authentication failed";
      setError(serverMsg || fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: 'LOGIN' | 'SIGNUP') => {
      setMode(newMode);
      setError('');
      setFormData(prev => ({ ...prev, branchName: '', accessCode: '' })); 
  };

  // Dynamic accent color based on selected role
  const getAccentColor = () => {
      switch(role) {
          case UserRole.OWNER: return 'text-violet-600 bg-violet-50 border-violet-500';
          case UserRole.MANAGER: return 'text-blue-600 bg-blue-50 border-blue-500';
          case UserRole.PHARMACIST: return 'text-emerald-600 bg-emerald-50 border-emerald-500';
          default: return 'text-nexile-600 bg-nexile-50 border-nexile-500';
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden font-sans">
      {/* Enterprise Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-200 dark:bg-teal-900/20 rounded-full blur-[100px] opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-6xl flex rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 z-10 animate-fade-in min-h-[700px]">
        
        {/* Left Side - Brand Identity */}
        <div className="hidden lg:flex w-5/12 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            
            {/* Abstract Geometric Logo */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-nexile-400 to-nexile-600 rounded-xl flex items-center justify-center shadow-lg shadow-nexile-500/20 relative">
                        <Hexagon className="text-white absolute" size={32} strokeWidth={1.5} />
                        <div className="w-3 h-3 bg-white rounded-full absolute"></div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight font-sans">Nexile<span className="text-nexile-400">.</span></h1>
                </div>
                <h2 className="text-4xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Where Pharmacies Become Intelligent Businesses.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                    Manage operations, monitor performance, and scale confidently with Nexile — the next-generation pharmacy management platform.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-6 mt-12">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                        <Building2 className="text-nexile-300" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Multi-Branch Sync</h3>
                        <p className="text-xs text-slate-400 mt-1">Unified inventory across unlimited locations.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                        <Activity className="text-blue-300" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Pharmacy Intelligence</h3>
                        <p className="text-xs text-slate-400 mt-1">AI-driven demand forecasting & expiry risk.</p>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 text-xs text-slate-600 mt-12 font-mono">
                SYSTEM VERSION 5.0 (ENTERPRISE)
            </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-between bg-white dark:bg-slate-950 relative">
            
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-10">
                <div className="lg:hidden flex items-center gap-2">
                     <div className="w-8 h-8 bg-nexile-600 rounded-lg flex items-center justify-center">
                        <Hexagon className="text-white" size={20} strokeWidth={2} />
                     </div>
                     <span className="font-bold text-lg text-slate-900 dark:text-white">Nexile.</span>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-800 ml-auto">
                    <button 
                        onClick={() => toggleMode('LOGIN')}
                        className={`px-6 py-2 text-xs font-bold rounded-full transition-all duration-300 ${mode === 'LOGIN' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        SIGN IN
                    </button>
                    <button 
                        onClick={() => toggleMode('SIGNUP')}
                        className={`px-6 py-2 text-xs font-bold rounded-full transition-all duration-300 ${mode === 'SIGNUP' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        REGISTER
                    </button>
                </div>
            </div>

            {/* Main Form Area */}
            <div className="max-w-md mx-auto w-full">
                <div className="mb-8 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                        {mode === 'SIGNUP' ? "Initialize Workspace" : "Access Dashboard"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {mode === 'SIGNUP' ? "Begin your 7-day enterprise trial." : "Secure login to your Nexile environment."}
                    </p>
                </div>

                {/* Role Tabs - Styled */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { id: UserRole.PHARMACIST, icon: User, label: 'Pharmacist' },
                        { id: UserRole.MANAGER, icon: Building2, label: 'Manager' },
                        { id: UserRole.OWNER, icon: ShieldCheck, label: 'Owner' }
                    ].map((r) => (
                        <button 
                            key={r.id}
                            type="button"
                            onClick={() => handleRoleChange(r.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                                role === r.id 
                                ? getAccentColor()
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <r.icon size={22} strokeWidth={role === r.id ? 2.5 : 2} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{r.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'SIGNUP' && (
                        <div className="animate-slide-up" style={{animationDelay: '0ms'}}>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Full Name</label>
                            <input 
                                required
                                type="text" 
                                autoComplete="name"
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="e.g. Sarah Connor"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    )}

                    <div className="animate-slide-up" style={{animationDelay: '50ms'}}>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Email Address</label>
                        <input 
                            required
                            type="email" 
                            autoComplete="email"
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent outline-none transition-all font-medium"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="animate-slide-up" style={{animationDelay: '100ms'}}>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Password</label>
                        <input 
                            required
                            type="password" 
                            autoComplete={mode === 'SIGNUP' ? "new-password" : "current-password"}
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent outline-none transition-all font-medium"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    {/* Branch Input Logic */}
                    {(role === UserRole.PHARMACIST || (role === UserRole.OWNER && mode === 'SIGNUP')) && (
                        <div className="animate-slide-up" style={{animationDelay: '150ms'}}>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider ml-1">
                                {role === UserRole.OWNER ? 'Organization Name' : 'Assigned Branch'}
                            </label>
                            <div className="relative">
                                 <input 
                                    required={role === UserRole.PHARMACIST} 
                                    type="text"
                                    autoComplete="organization"
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent outline-none transition-all font-medium pl-11"
                                    placeholder={role === UserRole.OWNER ? "Nexile HQ" : "e.g. Downtown"}
                                    value={formData.branchName}
                                    onChange={e => setFormData({...formData, branchName: e.target.value})}
                                 />
                                 <Building2 size={18} className="absolute left-4 top-4 text-slate-400" />
                            </div>
                            {role === UserRole.PHARMACIST && mode === 'SIGNUP' && (
                                <p className="text-[10px] text-emerald-600 mt-1.5 ml-1 font-medium">
                                    * System will connect you to existing branch or create request.
                                </p>
                            )}
                        </div>
                    )}

                    {role === UserRole.MANAGER && (
                        <div className="animate-slide-up" style={{animationDelay: '150ms'}}>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Secure Access Code</label>
                            <div className="relative">
                                <input 
                                    required
                                    type="password" 
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent outline-none transition-all font-medium pl-11"
                                    placeholder="Provided by Admin"
                                    value={formData.accessCode}
                                    onChange={e => setFormData({...formData, accessCode: e.target.value})}
                                />
                                <KeyRound size={18} className="absolute left-4 top-4 text-slate-400" />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-3 animate-slide-up">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full py-4 mt-4 text-white font-bold rounded-xl shadow-lg shadow-slate-400/20 dark:shadow-black/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed
                        ${role === UserRole.OWNER ? 'bg-slate-900 hover:bg-slate-800' : role === UserRole.MANAGER ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                {mode === 'SIGNUP' ? <UserPlus size={20} /> : <LogIn size={20} />}
                                {mode === 'SIGNUP' ? 'Initialize Account' : 'Secure Login'}
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            {/* Updated Footer */}
            <div className="text-center text-xs text-slate-400 mt-8">
                <p>© 2025 Nexile Systems Inc. All rights reserved.</p>
                <p className="mt-1">Secure connection encrypted via TLS 1.3</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
