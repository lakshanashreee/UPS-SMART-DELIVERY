import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight, Truck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin@logistics.com');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const success = await login(username, password);

    setIsLoading(false);
    if (success) {
      onLoginSuccess();
    } else {
      setErrorMsg('Access Denied: Invalid Cognito Admin Credentials. Only registered Admin accounts in Cognito User Pool us-east-1_fwxt8QkLP are allowed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Top Banner Header */}
      <div className="w-full bg-[#351C15] pt-12 pb-24 px-4 flex flex-col items-center text-center shadow-md">
        <div className="w-14 h-14 bg-[#FFB500] rounded-2xl flex items-center justify-center text-[#351C15] shadow-lg mb-3 border border-[#D97706]">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Smart Logistics Control Tower
        </h1>
        <p className="text-amber-200/90 text-xs sm:text-sm mt-1.5 font-medium max-w-md">
          Amazon Cognito Authenticated Supply Chain Portal
        </p>
      </div>

      {/* Main Login Card Container (Cleanly overlaps header bottom with no text collision) */}
      <div className="w-full max-w-md px-4 -mt-14 mb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-[#D97706]" />
              Admin Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your AWS Cognito Admin credentials to access the Control Tower
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cognito Admin Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#FFB500] focus:border-[#FFB500] outline-none"
                  placeholder="admin@logistics.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#FFB500] focus:border-[#FFB500] outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 border border-[#D97706]"
            >
              <span>{isLoading ? 'Validating Cognito Admin Account...' : 'Sign In as Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
            AWS Cognito User Pool ID: <code className="font-mono text-slate-600 font-bold">us-east-1_fwxt8QkLP</code>
          </div>
        </div>
      </div>
    </div>
  );
};
