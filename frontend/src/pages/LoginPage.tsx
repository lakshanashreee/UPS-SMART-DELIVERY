import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin@ups.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'OPERATOR'>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(username, selectedRole);
      setIsLoading(false);
      onLoginSuccess();
    }, 600);
  };

  const handleDemoLogin = (role: 'ADMIN' | 'OPERATOR') => {
    setIsLoading(true);
    const demoUser = role === 'ADMIN' ? 'admin@ups.com' : 'operator@ups.com';
    setTimeout(() => {
      login(demoUser, role);
      setIsLoading(false);
      onLoginSuccess();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      {/* Background Decorator */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-[#351C15] flex flex-col justify-center items-center text-center px-4">
        <div className="w-16 h-20 bg-[#FFB500] rounded-b-xl flex items-center justify-center font-black text-2xl text-[#351C15] shadow-lg mb-3 border-2 border-[#351C15]">
          UPS
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Logistics Control Tower
        </h1>
        <p className="text-amber-200/80 text-xs sm:text-sm mt-1 max-w-md">
          Amazon Cognito Authenticated Supply Chain Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 mt-20">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-[#D97706]" />
            Sign In to Control Tower
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your AWS Cognito credentials to access live tracking
          </p>
        </div>

        {/* Demo Fast Login Ribbon */}
        <div className="mb-6 bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
              Quick Judge Demo Login:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('ADMIN')}
              className="py-1.5 px-3 bg-[#351C15] hover:bg-[#4D291F] text-amber-300 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB500]" />
              <span>Admin Group</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('OPERATOR')}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Operator</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cognito Username / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#FFB500] focus:border-[#FFB500] outline-none"
                placeholder="admin@ups.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#FFB500] focus:border-[#FFB500] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role Permission Group
            </label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#FFB500] outline-none"
            >
              <option value="ADMIN">ADMIN Group (Full Telemetry Simulation & Controls)</option>
              <option value="OPERATOR">OPERATOR Group (Read-Only Monitoring)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] font-extrabold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
          >
            <span>{isLoading ? 'Authenticating with AWS Cognito...' : 'Sign In to Control Tower'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          AWS Cognito User Pool ID: <code className="font-mono text-slate-600">us-east-1_fwxt8QkLP</code>
        </div>
      </div>
    </div>
  );
};
