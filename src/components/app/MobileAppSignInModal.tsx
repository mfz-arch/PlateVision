'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '../../types/plateVision';

interface MobileAppSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
}

export const MobileAppSignInModal: React.FC<MobileAppSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  onSwitchToRegister
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      onSuccessLogin(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in fade-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 mx-auto flex items-center justify-center p-2 mb-3">
            <img src="/logo.svg" alt="PlateVision" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-xl font-black text-gray-900">Welcome Back</h3>
          <p className="text-xs text-gray-400">Sign in to sync your nutrition journal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Email</label>
            <div className="relative mt-1">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#84cc16]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-full bg-[#14171d] hover:bg-black text-[#b6ff2e] font-black text-sm shadow-md active:scale-98 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-500">
          <span>New to PlateVision? </span>
          <button
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="font-black text-[#65a30d] hover:underline"
          >
            Build your plan
          </button>
        </div>

      </div>
    </div>
  );
};
