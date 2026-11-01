'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { UserProfile } from '@/types/plateVision';

export default function AdminPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin Login form states
  const [email, setEmail] = useState('aimfizahmedibrahim@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch('/api/user', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUserProfile(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    }
    verifyAdmin();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Failed to authenticate administrator');
        setIsLoggingIn(false);
        return;
      }

      setUserProfile(data.user);
      setIsLoggingIn(false);
    } catch (err: any) {
      setLoginError(err?.message || 'Login request failed');
      setIsLoggingIn(false);
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#14171d] text-white flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#14171d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="PlateVision home">
            <span className="w-9 h-9 rounded-xl overflow-hidden border border-[#b6ff2e]/40 flex items-center justify-center bg-[#14171d]">
              <img src="/logo.svg" alt="PlateVision Logo" className="w-full h-full object-cover p-1" />
            </span>
            <span className="text-base font-extrabold tracking-wider">
              PLATE<span className="text-[#b6ff2e]">VISION</span>
            </span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#b6ff2e]/20 text-[#b6ff2e] border border-[#b6ff2e]/40">
              ADMIN
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#c4c8d2] bg-white/5 border border-white/10 hover:text-[#b6ff2e] hover:border-[#b6ff2e]/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Return to App
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center">
            <p className="text-xs text-[#9ea3b0]">Verifying administrator credentials...</p>
          </div>
        ) : isAdmin ? (
          <AdminDashboard />
        ) : (
          /* Dedicated Administrator Login Portal */
          <div className="py-12 max-w-md mx-auto">
            <div className="p-8 rounded-3xl glass-card border border-[rgba(255,255,255,0.12)] shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center shadow-[0_0_20px_rgba(182,255,46,0.2)]">
                  <ShieldCheck className="w-7 h-7 text-[#b6ff2e]" />
                </div>
                <h1 className="text-2xl font-black text-white">Administrator Portal</h1>
                <p className="text-xs text-[#9ea3b0]">Sign in with authorized administrator credentials to manage PlateVision.</p>
              </div>

              {loginError && (
                <div role="alert" className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1.5">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@platevision.app"
                      className="w-full pl-10 pr-4 py-3 bg-[#14171d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#b6ff2e]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-[#14171d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#b6ff2e]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#9ea3b0] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <span>Authenticating Admin...</span>
                  ) : (
                    <>
                      <span>Enter Admin Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-white/10 text-center">
                <Link href="/" className="text-xs text-[#9ea3b0] hover:text-[#b6ff2e]">
                  &larr; Back to Public Application
                </Link>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
