'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { LandingHero } from '../components/LandingHero';
import { Dashboard } from '../components/Dashboard';
import { OnboardingModal } from '../components/OnboardingModal';
import { SignInModal } from '../components/SignInModal';
import { ScannerZone } from '../components/ScannerZone';
import { AccountDataControls } from '../components/AccountDataControls';
import { AdminDashboard } from '../components/AdminDashboard';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { SplashScreen } from '../components/SplashScreen';
import { UserProfile } from '../types/plateVision';
import { toLocalDateStr } from '../lib/date';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'scanner' | 'macros' | 'admin'>('home');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAppMode, setIsAppMode] = useState(false);

  // Day selected on the dashboard calendar — the "+" scanner logs meals to this day
  const [scanDateStr, setScanDateStr] = useState<string>(() => toLocalDateStr());
  const [mealsRefreshKey, setMealsRefreshKey] = useState(0);

  // User Profile state (null = not signed in)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Detect PWA / standalone installed App vs Website
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        window.location.search.includes('source=pwa') ||
        window.location.search.includes('mode=app') ||
        document.referrer.includes('android-app://');

      if (isStandalone) {
        localStorage.setItem('platevision_pwa_mode', 'true');
        setIsAppMode(true);
        setActiveTab('dashboard');
      } else if (localStorage.getItem('platevision_pwa_mode') === 'true') {
        setIsAppMode(true);
        setActiveTab('dashboard');
      }
    }
  }, []);

  // Restore session
  useEffect(() => {
    async function loadUser() {
      try {
        const storedJson = localStorage.getItem('platevision_user');
        if (storedJson) {
          const parsed = JSON.parse(storedJson);
          setUserProfile(parsed);
          setActiveTab('dashboard');
        }

        const res = await fetch('/api/user', { cache: 'no-store' });
        if (res.status === 401) {
          localStorage.removeItem('platevision_user');
          setUserProfile(null);
          // If not in App mode, go to home landing
          if (!localStorage.getItem('platevision_pwa_mode')) {
            setActiveTab('home');
          } else {
            setActiveTab('dashboard');
          }
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          setUserProfile(data.user);
          localStorage.setItem('platevision_user', JSON.stringify(data.user));
          setActiveTab('dashboard');
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      }
    }
    loadUser();
  }, []);

  const handleCompleteOnboarding = async (profile: UserProfile) => {
    const safeProfile = { ...profile };
    delete (safeProfile as any).password;
    setUserProfile(safeProfile);
    localStorage.setItem('platevision_user', JSON.stringify(safeProfile));
    setActiveTab('dashboard');
  };

  const handleSuccessLogin = (user: UserProfile) => {
    setUserProfile(user);
    localStorage.setItem('platevision_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem('platevision_user');
    setUserProfile(null);
    if (!isAppMode) {
      setActiveTab('home');
    } else {
      setActiveTab('dashboard');
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
  }, [isAppMode]);

  const handleSelectedDateChange = useCallback((dateStr: string) => {
    setScanDateStr(dateStr);
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-[#14171d] text-white flex flex-col selection:bg-[#b6ff2e] selection:text-[#14171d]">
      
      {/* Welcome Splash Screen */}
      <SplashScreen />

      {/* Top Header (Adapts automatically between App Mode and Website Mode) */}
      <Navbar
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenScanner={() => {
          if (!userProfile) {
            setIsSignInOpen(true);
          } else {
            setIsScannerOpen(true);
          }
        }}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasProfile={!!userProfile}
        userName={userProfile?.name}
        userRole={userProfile?.role}
        isAppMode={isAppMode}
      />

      {/* Main Body Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: HOME LANDING PAGE (Website only) */}
        {activeTab === 'home' && !isAppMode && (
          <LandingHero
            onStartAssessment={() => setIsRegisterOpen(true)}
            onOpenScanner={() => {
              if (!userProfile) {
                setIsSignInOpen(true);
              } else {
                setIsScannerOpen(true);
              }
            }}
            hasProfile={!!userProfile}
            onOpenSignIn={() => setIsSignInOpen(true)}
          />
        )}

        {/* VIEW 2: DASHBOARD (Active in App Mode or when selected on Website) */}
        {activeTab === 'dashboard' && userProfile && (
          <>
            <Dashboard
              profile={userProfile}
              onOpenScannerModal={() => setIsScannerOpen(true)}
              onSignOut={handleSignOut}
              refreshKey={mealsRefreshKey}
              onSelectedDateChange={handleSelectedDateChange}
            />
            <AccountDataControls onAccountDeleted={handleSignOut} />
            {/* PWA Install Suggestion ONLY appears when in dashboard and not already in app mode */}
            {!isAppMode && <PWAInstallPrompt />}
          </>
        )}

        {activeTab === 'dashboard' && !userProfile && (
          <div className="py-16 text-center space-y-4 glass-card rounded-3xl border border-white/10 max-w-lg mx-auto px-6">
            <h3 className="text-2xl font-extrabold text-white">Access Your Dashboard</h3>
            <p className="text-xs text-[#9ea3b0]">Please sign in or create an account first to view your personalized CalZen nutrition dashboard.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setIsSignInOpen(true)} 
                className="px-6 py-3 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide shadow-[0_0_15px_rgba(182,255,46,0.3)]"
              >
                Sign In
              </button>
              <button 
                onClick={() => setIsRegisterOpen(true)} 
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: SCANNER ONLY PAGE */}
        {activeTab === 'scanner' && (
          <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)]">
            <ScannerZone onMealScanned={() => { setMealsRefreshKey((k) => k + 1); setActiveTab('dashboard'); }} />
          </div>
        )}

        {/* VIEW 4: ADMIN MANAGEMENT DASHBOARD */}
        {activeTab === 'admin' && userProfile?.role === 'admin' && (
          <AdminDashboard />
        )}

      </div>

      {/* MODALS */}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccessLogin={handleSuccessLogin}
        onSwitchToRegister={() => setIsRegisterOpen(true)}
      />

      {/* Register / Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onComplete={handleCompleteOnboarding}
      />

      {/* Scanner Popup Modal (from Dashboard "+") */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#14171d] border border-white/15 rounded-3xl p-6 overflow-y-auto max-h-[90vh] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📸 Scan Food Plate</span>
                {scanDateStr && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#b6ff2e]/15 text-[#b6ff2e] border border-[#b6ff2e]/30">
                    Logging for {scanDateStr}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all font-bold"
              >
                ✕
              </button>
            </div>
            <ScannerZone
              targetDateStr={scanDateStr}
              onMealScanned={() => {
                setMealsRefreshKey((k) => k + 1);
                setIsScannerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Footer (Website only) */}
      {!isAppMode && (
        <footer className="border-t border-white/5 py-8 text-center text-xs text-[#9ea3b0]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} PlateVision AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </footer>
      )}

    </main>
  );
}
