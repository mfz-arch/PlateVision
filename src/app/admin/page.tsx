'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, ShieldCheck, Lock } from 'lucide-react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { UserProfile } from '@/types/plateVision';

export default function AdminPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#14171d] text-white flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#14171d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="PlateVision home">
            <span className="w-9 h-9 rounded-xl bg-[#23262f] border border-[#b6ff2e]/40 flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#b6ff2e]" aria-hidden="true" />
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
          <div className="py-24 max-w-md mx-auto text-center space-y-4 p-8 rounded-3xl glass-card border border-rose-500/30">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-xs text-[#9ea3b0]">
              You must be logged in as an authorized administrator to view the executive management portal.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs inline-block"
              >
                Sign In on Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
