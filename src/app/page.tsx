'use client';

import React, { useState, useCallback } from 'react';
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
import { InstallAppModal } from '../components/InstallAppModal';
import { UserProfile } from '../types/plateVision';
import { toLocalDateStr } from '../lib/date';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'scanner' | 'macros' | 'admin'>('home');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Day selected on the dashboard calendar — the "+" scanner logs meals to this day
  const [scanDateStr, setScanDateStr] = useState<string>(() => toLocalDateStr());
  const [mealsRefreshKey, setMealsRefreshKey] = useState(0);

  // User Profile state (null = not signed in)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Restore the session. Identity is verified server-side via the HttpOnly cookie;
  // localStorage only caches the profile for a faster first paint.
  React.useEffect(() => {
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
          setActiveTab('home');
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
    setActiveTab('home');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
  }, []);

  const handleSelectedDateChange = useCallback((dateStr: string) => {
    setScanDateStr(dateStr);
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-[#F8F9FA] text-[#0f172a] flex flex-col selection:bg-[#b6ff2e] selection:text-[#0f172a] relative">
      
      {/* Full-Screen Immersive Nutrition Background with Soft Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/images/nutrition-bg.webp"
          alt="Fresh healthy nutrition meal background"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover blur-[1.5px] scale-102 opacity-90 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-[#F8F9FA]/85" />
      </div>

      {/* Top Fixed Header */}
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
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasProfile={!!userProfile}
        userName={userProfile?.name}
        userRole={userProfile?.role}
      />

      {/* Main Body Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* VIEW 1: HOME LANDING PAGE */}
        {activeTab === 'home' && (
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

        {/* VIEW 2: DASHBOARD */}
        {activeTab === 'dashboard' && userProfile && (
          <>
            <Dashboard
              profile={userProfile}
              onOpenScannerModal={() => setIsScannerOpen(true)}
              onSignOut={handleSignOut}
              refreshKey={mealsRefreshKey}
              onSelectedDateChange={handleSelectedDateChange}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
            <AccountDataControls onAccountDeleted={handleSignOut} />
            {/* PWA Install Suggestion ONLY appears when user is in their dashboard */}
            <PWAInstallPrompt />
          </>
        )}

        {activeTab === 'dashboard' && !userProfile && (
          <div className="py-16 text-center space-y-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm max-w-lg mx-auto px-6">
            <h3 className="text-2xl font-black text-[#0f172a]">Access Your Dashboard</h3>
            <p className="text-xs text-slate-500">Please sign in or create an account first to view your personalized CalZen nutrition dashboard.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setIsSignInOpen(true)} 
                className="px-6 py-3 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs tracking-wide shadow-sm hover:bg-[#a3f01b] transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => setIsRegisterOpen(true)} 
                className="px-6 py-3 rounded-xl bg-slate-100 text-[#0f172a] border border-slate-200 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: SCANNER ONLY PAGE */}
        {activeTab === 'scanner' && (
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
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

      {/* Scanner Popup Modal */}
      {isScannerOpen && (
        <ScannerZone
          isModal={true}
          targetDateStr={activeTab === 'dashboard' ? scanDateStr : undefined}
          onClose={() => setIsScannerOpen(false)}
          onMealScanned={() => {
            setIsScannerOpen(false);
            if (!userProfile) {
              setIsSignInOpen(true);
            } else {
              setMealsRefreshKey((k) => k + 1);
              setActiveTab('dashboard');
            }
          }}
        />
      )}

      {/* QR Code & Mobile Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Footer with legal links (extra bottom padding on mobile for the tab bar) */}
      <footer className="mt-16 pt-10 pb-28 md:pb-10 border-t-2 border-slate-200 bg-white text-slate-600">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-500 space-y-6">
          <nav aria-label="Legal & Policies" className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 font-bold text-slate-600">
            <Link href="/privacy" className="hover:text-[#65a30d] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#65a30d] transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-[#65a30d] transition-colors">Cookie Policy</Link>
            <Link href="/accessibility" className="hover:text-[#65a30d] transition-colors">Accessibility Statement</Link>
            <Link href="/terms#dmca" className="hover:text-[#65a30d] transition-colors">DMCA / Copyright</Link>
            <Link href="/admin" className="text-[#84cc16] hover:underline font-black">Admin Portal</Link>
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem('pv_cookie_consent_v1'); } catch {}
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('pv:open-cookie-settings'));
              }}
              className="text-slate-500 hover:text-[#65a30d] transition-colors underline underline-offset-2 cursor-pointer font-bold"
            >
              Cookie Preferences
            </button>
          </nav>

          {/* FTC & Medical Compliance Disclaimers */}
          <div className="max-w-3xl mx-auto text-center space-y-2 text-[11px] leading-relaxed text-slate-500">
            <p>
              <strong className="text-[#0f172a]">Health &amp; Medical Disclaimer:</strong> PlateVision AI provides automated nutrition{' '}
              <strong className="text-[#0f172a]">estimates</strong> for wellness journaling and general informational purposes only. It is not
              a medical device, does not provide medical or dietary diagnosis/treatment, and should never replace qualified professional advice.
              Always consult a physician or registered dietitian before changing your diet or fitness routine.
            </p>
            <p className="text-[10px] text-slate-400">
              All calculations rely on standard nutritional reference equations (Mifflin-St Jeor). Individual results vary.
              Sample food photography licensed under Unsplash License. User interface icons provided under ISC License (Lucide).
            </p>
          </div>

          <div className="text-center space-y-1">
            <p className="font-bold text-[#0f172a]">© {new Date().getFullYear()} PlateVision AI. All rights reserved.</p>
            <p className="text-[11px] text-slate-500 font-medium">PlateVision™ and the PlateVision logo are trademarks of PlateVision AI. Powered by Advanced Vision Intelligence.</p>
          </div>
        </div>
      </footer>

    </main>
  );
}
