import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, User, Building2, KeyRound, Loader2, Activity, LogIn, UserPlus, AlertCircle } from 'lucide-react';

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
      // Clear sensitive context fields when switching roles to prevent accidental data submission
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
            // Safeguard: Ensure Managers don't accidentally send a branchName if state wasn't cleared
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
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: 'LOGIN' | 'SIGNUP') => {
      setMode(newMode);
      setError('');
      // Reset context fields on mode switch
      setFormData(prev => ({ ...prev, branchName: '', accessCode: '' })); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-nexile-200 dark:bg-nexile-900/20 rounded-full blur-3xl opacity-40 animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 z-10 animate-fade-in min-h-[650px]">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:flex w-5/12 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-nexile-900 to-slate-900 opacity-90 z-0"></div>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-nexile-500 rounded-lg flex items-center justify-center shadow-lg shadow-nexile-500/30">
                        <Activity className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Nexile<span className="text-nexile-400">.</span></h1>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed">
                    The enterprise operating system for modern pharmacies. Manage inventory, sales, and analytics in one secure cloud platform.
                </p>
            </div>

            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <ShieldCheck className="text-nexile-400" size={24} />
                    <div>
                        <h3 className="font-semibold">Secure Access</h3>
                        <p className="text-xs text-slate-400">Role-based data isolation</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <Activity className="text-blue-400" size={24} />
                    <div>
                        <h3 className="font-semibold">Real-time Analytics</h3>
                        <p className="text-xs text-slate-400">Live sales tracking & reporting</p>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 text-xs text-slate-500">
                © 2024 Nexile Systems Inc.
            </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-7/12 p-8 md:p-12 flex flex-col justify-center relative">
            
            {/* Mode Toggle */}
            <div className="absolute top-8 right-8 flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => toggleMode('LOGIN')}
                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${mode === 'LOGIN' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    SIGN IN
                </button>
                <button 
                    onClick={() => toggleMode('SIGNUP')}
                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${mode === 'SIGNUP' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    SIGN UP
                </button>
            </div>

            <div className="mb-8 mt-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {mode === 'SIGNUP' ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-slate-500 text-sm">
                    {mode === 'SIGNUP' ? "Start your 7-day free trial with Nexile." : "Enter your credentials to access the dashboard."}
                </p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                    { id: UserRole.PHARMACIST, icon: User, label: 'Pharmacist' },
                    { id: UserRole.MANAGER, icon: Building2, label: 'Manager' },
                    { id: UserRole.OWNER, icon: ShieldCheck, label: 'Owner' }
                ].map((r) => (
                    <button 
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                            role === r.id 
                            ? 'bg-nexile-50 dark:bg-nexile-900/20 border-nexile-500 text-nexile-700 dark:text-nexile-400 ring-1 ring-nexile-500' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        <r.icon size={24} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wide">{r.label}</span>
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'SIGNUP' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Full Name</label>
                        <input 
                            required
                            type="text" 
                            autoComplete="name"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 focus:border-transparent outline-none transition-all"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Email Address</label>
                    <input 
                        required
                        type="email" 
                        autoComplete="email"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 focus:border-transparent outline-none transition-all"
                        placeholder="name@pharmacy.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Password</label>
                    <input 
                        required
                        type="password" 
                        autoComplete={mode === 'SIGNUP' ? "new-password" : "current-password"}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                {/* Branch Input: Visible for Pharmacists (Always) and Owners (Signup Only) */}
                {(role === UserRole.PHARMACIST || (role === UserRole.OWNER && mode === 'SIGNUP')) && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                            {role === UserRole.OWNER ? 'Organization / Branch Name' : 'Pharmacy Branch Name'}
                        </label>
                        <div className="relative">
                             <Building2 size={18} className="absolute left-3 top-3.5 text-slate-400" />
                             <input 
                                required={role === UserRole.PHARMACIST} 
                                type="text"
                                autoComplete="organization"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 focus:border-transparent outline-none transition-all"
                                placeholder={role === UserRole.OWNER ? "e.g. Nexile Pharmacy HQ (Optional)" : "Type branch name (e.g. Downtown)"}
                                value={formData.branchName}
                                onChange={e => setFormData({...formData, branchName: e.target.value})}
                             />
                        </div>
                        
                        {/* Pharmacist Specific Helper */}
                        {role === UserRole.PHARMACIST && mode === 'SIGNUP' && (
                            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 ml-1 flex items-center gap-1">
                                <Activity size={10} />
                                Joining or creating a new branch automatically.
                            </p>
                        )}
                        
                        {/* Owner Specific Helper */}
                        {role === UserRole.OWNER && mode === 'SIGNUP' && (
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                Enter a name to create your first branch immediately, or leave blank to set up later.
                            </p>
                        )}
                    </div>
                )}

                {/* Manager Access Code: Strictly for Managers */}
                {role === UserRole.MANAGER && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Manager Access Code</label>
                        <div className="relative">
                            <KeyRound size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                required
                                type="password" 
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-nexile-500 focus:border-transparent outline-none transition-all"
                                placeholder="Code from Owner"
                                value={formData.accessCode}
                                onChange={e => setFormData({...formData, accessCode: e.target.value})}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">Required for administrative access. (Demo: 123456)</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-slide-up">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 mt-4 bg-nexile-600 hover:bg-nexile-700 text-white font-bold rounded-xl shadow-lg shadow-nexile-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                            {mode === 'SIGNUP' ? <UserPlus size={20} /> : <LogIn size={20} />}
                            {mode === 'SIGNUP' ? 'Create Account' : 'Sign In'}
                        </>
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;