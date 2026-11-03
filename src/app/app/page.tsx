'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/plateVision';
import { MobileAppDashboard } from '../../components/app/MobileAppDashboard';
import { MobileAppOnboarding } from '../../components/app/MobileAppOnboarding';
import { MobileAppSignInModal } from '../../components/app/MobileAppSignInModal';
import { SplashScreen } from '../../components/SplashScreen';

export default function MobileAppPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Restore session
  useEffect(() => {
    async function loadSession() {
      try {
        const stored = localStorage.getItem('platevision_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed._id || parsed.email)) {
              setUserProfile(parsed);
            }
          } catch (e) {}
        }

        const res = await fetch('/api/user', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUserProfile(data.user);
            localStorage.setItem('platevision_user', JSON.stringify(data.user));
          }
        }
      } catch (err) {
        console.error('[App] Failed to load user session:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }
    loadSession();
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem('platevision_user');
    setUserProfile(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleSuccessLogin = (user: UserProfile) => {
    setUserProfile(user);
    localStorage.setItem('platevision_user', JSON.stringify(user));
  };

  const handleCompleteOnboarding = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('platevision_user', JSON.stringify(profile));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#14171d]">
      
      {/* App Splash Screen on first launch */}
      <SplashScreen />

      {/* Conditional Rendering: Dashboard vs Onboarding */}
      {isLoadingSession ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-md p-2 mb-3 animate-pulse">
            <img src="/logo.svg" alt="PlateVision" className="w-full h-full object-contain" />
          </div>
          <div className="w-6 h-6 border-2 border-gray-900 border-t-[#b6ff2e] rounded-full animate-spin" />
        </div>
      ) : userProfile ? (
        <MobileAppDashboard 
          profile={userProfile} 
          onSignOut={handleSignOut}
          onUpdateProfile={(updated) => {
            setUserProfile(updated);
            localStorage.setItem('platevision_user', JSON.stringify(updated));
          }}
        />
      ) : (
        <MobileAppOnboarding 
          onComplete={handleCompleteOnboarding}
          onOpenSignIn={() => setIsSignInOpen(true)}
        />
      )}

      {/* Quick Sign In Modal for Existing Users */}
      <MobileAppSignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccessLogin={handleSuccessLogin}
        onSwitchToRegister={() => setIsSignInOpen(false)}
      />

    </div>
  );
}

