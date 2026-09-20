'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { LandingHero } from '../components/LandingHero';
import { Dashboard } from '../components/Dashboard';
import { OnboardingModal } from '../components/OnboardingModal';
import { SignInModal } from '../components/SignInModal';
import { ScannerZone } from '../components/ScannerZone';
import { UserProfile } from '../types/plateVision';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'scanner' | 'macros'>('home');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // User Profile state (null = not signed in)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleCompleteOnboarding = (profile: UserProfile) => {
    setUserProfile(profile);
    setActiveTab('dashboard');
  };

  const handleSuccessLogin = (userName: string) => {
    const defaultProfile: UserProfile = {
      goal: 'lose',
      name: userName,
      age: 18,
      gender: 'male',
      heightCm: 178,
      currentWeightKg: 78,
      targetWeightKg: 72,
      workoutDaysPerWeek: 4,
      timeframeMonths: 3,
      dailyCaloriesGoal: 2150,
      proteinGoalGrams: 156,
      carbsGoalGrams: 210,
      fatsGoalGrams: 60,
      waterGoalLiters: 2.8
    };

    setUserProfile(defaultProfile);
    setActiveTab('dashboard');
  };

  const handleSignOut = () => {
    setUserProfile(null);
    setActiveTab('home');
  };

  return (
    <main className="min-h-screen bg-[#14171d] text-white flex flex-col selection:bg-[#b6ff2e] selection:text-[#14171d]">
      
      {/* Top Fixed Header */}
      <Navbar
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasProfile={!!userProfile}
        userName={userProfile?.name}
      />

      {/* Main Body Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: HOME LANDING PAGE */}
        {activeTab === 'home' && !userProfile && (
          <LandingHero
            onStartAssessment={() => setIsRegisterOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {/* VIEW 2: DASHBOARD */}
        {(activeTab === 'dashboard' || (activeTab === 'home' && userProfile)) && userProfile && (
          <Dashboard
            profile={userProfile}
            onOpenScannerModal={() => setIsScannerOpen(true)}
            onSignOut={handleSignOut}
          />
        )}

        {/* VIEW 3: SCANNER ONLY PAGE */}
        {activeTab === 'scanner' && (
          <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)]">
            <ScannerZone onMealScanned={() => setActiveTab('dashboard')} />
          </div>
        )}

      </div>

      {/* MODALS */}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccessLogin={handleSuccessLogin}
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
          onClose={() => setIsScannerOpen(false)}
          onMealScanned={(meal) => {
            setIsScannerOpen(false);
            if (!userProfile) {
              handleSuccessLogin("User");
            } else {
              setActiveTab('dashboard');
            }
          }}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-[rgba(255,255,255,0.06)] bg-[#14171d]">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#9ea3b0] space-y-2">
          <p className="font-semibold text-white">PLATEVISION AI • Next.js & TypeScript Nutrition System</p>
          <p>Conçu pour Aim'fiz Ibrahim & MindEN Labs. Powered by Gemini Vision API.</p>
        </div>
      </footer>

    </main>
  );
}
