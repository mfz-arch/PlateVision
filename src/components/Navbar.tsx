'use client';

import React from 'react';
import { Camera, LogIn, UserPlus, Globe, LogOut, Home, Plus, LayoutDashboard, ShieldCheck, Flame, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenScanner: () => void;
  onSignOut: () => void;
  activeTab: 'home' | 'dashboard' | 'scanner' | 'macros' | 'admin';
  setActiveTab: React.Dispatch<React.SetStateAction<'home' | 'dashboard' | 'scanner' | 'macros' | 'admin'>>;
  hasProfile: boolean;
  userName?: string;
  userRole?: string;
  isAppMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSignIn,
  onOpenRegister,
  onOpenScanner,
  onSignOut,
  activeTab,
  setActiveTab,
  hasProfile,
  userName,
  userRole,
  isAppMode = false
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  const handleScanClick = () => {
    if (!hasProfile) {
      onOpenSignIn();
    } else {
      onOpenScanner();
    }
  };

  // APP MODE NAVBAR (CalZen-like Native App Layout)
  if (isAppMode) {
    return (
      <nav className="sticky top-0 z-40 w-full bg-[#14171d]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Left: Streak Flame Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#23262f] border border-white/10 shadow-sm">
            <Flame className="w-4 h-4 text-[#b6ff2e]" />
            <span className="text-xs font-black text-white">0</span>
          </div>

          {/* Center: App Name & Clean Plate Icon */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white p-0.5 border border-white/20 shadow-[0_0_10px_rgba(182,255,46,0.25)]">
              <img src="/logo.svg" alt="PlateVision" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">PlateVision</span>
          </div>

          {/* Right: Profile Avatar / Controls */}
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab(activeTab === 'admin' ? 'dashboard' : 'admin')}
                aria-label="Admin Portal"
                className={`p-2 rounded-full border transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#b6ff2e] text-[#14171d] border-[#b6ff2e]'
                    : 'bg-[#23262f] border-white/10 text-[#b6ff2e]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {hasProfile ? (
              <button
                onClick={() => {
                  if (window.confirm(language === 'fr' ? 'Se déconnecter de PlateVision ?' : 'Sign out from PlateVision?')) {
                    onSignOut();
                  }
                }}
                title={userName || 'Account Profile'}
                aria-label="User Account"
                className="w-9 h-9 rounded-full bg-[#23262f] border border-white/20 flex items-center justify-center text-white hover:border-[#b6ff2e] active:scale-95 transition-all shadow-sm"
              >
                <User className="w-4 h-4 text-[#b6ff2e]" />
              </button>
            ) : (
              <button
                onClick={onOpenSignIn}
                aria-label="Sign In"
                className="w-9 h-9 rounded-full bg-[#23262f] border border-white/20 flex items-center justify-center text-white hover:border-[#b6ff2e] active:scale-95 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-[#b6ff2e]" />
              </button>
            )}
          </div>

        </div>

        {/* Floating "+" FAB button on App Dashboard (Native Style) */}
        {activeTab === 'dashboard' && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
            <button
              onClick={handleScanClick}
              aria-label="Scan Food Plate"
              className="w-16 h-16 rounded-full bg-[#b6ff2e] flex items-center justify-center shadow-[0_0_30px_rgba(182,255,46,0.6)] active:scale-90 transition-all border-4 border-[#14171d]"
            >
              <Plus className="w-8 h-8 text-[#14171d] stroke-[2.5]" />
            </button>
          </div>
        )}
      </nav>
    );
  }

  // STANDARD WEBSITE NAVBAR (Full Web Features)
  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-[rgba(255,255,255,0.08)] bg-[#14171d] max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-white/20 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(182,255,46,0.25)] bg-white">
              <img src="/logo.svg" alt="PlateVision Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-extrabold tracking-wider text-white">PLATE</span>
                <span className="text-base sm:text-xl font-extrabold tracking-wider text-[#b6ff2e]">VISION</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1 py-0.5 rounded bg-[#b6ff2e]/15 text-[#b6ff2e] border border-[#b6ff2e]/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#9ea3b0] font-medium tracking-wide hidden sm:block">{t('logoSubtitle')}</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-[#23262f]/60 p-1.5 rounded-2xl border border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
                  : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
              }`}
            >
              {t('navHome')}
            </button>

            <button
              onClick={() => {
                if (!hasProfile) {
                  onOpenSignIn();
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
                  : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
              }`}
            >
              {t('navDashboard')}
            </button>

            <button
              onClick={handleScanClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#b6ff2e] hover:bg-[#b6ff2e]/10 transition-all border border-[#b6ff2e]/30"
            >
              <Camera className="w-4 h-4 text-[#b6ff2e]" />
              {t('navScanPlate')}
            </button>

            {/* Admin Management Portal Link (Admins Only) */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.35)]'
                    : 'text-[#b6ff2e] bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 hover:bg-[#b6ff2e]/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#b6ff2e]" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* Action Controls & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              title="Switch Language / Changer de langue"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#23262f] border border-[rgba(255,255,255,0.1)] hover:border-[#b6ff2e]/50 text-[11px] sm:text-xs font-extrabold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#b6ff2e]" />
              <span>{language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
            </button>

            {hasProfile ? (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-md"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t('navSignOut')}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#23262f] border border-[rgba(255,255,255,0.12)] hover:border-[#b6ff2e]/40 hover:text-[#b6ff2e] transition-all shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  {t('navSignIn')}
                </button>

                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#14171d] bg-[#b6ff2e] hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.35)] hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {t('navRegister')}
                </button>
              </>
            )}

          </div>

        </div>
      </div>

      {/* Floating "+" FAB — only visible on Dashboard (Website view) */}
      {activeTab === 'dashboard' && (
        <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={handleScanClick}
            aria-label="Scan Meal"
            className="w-16 h-16 rounded-full bg-[#b6ff2e] flex items-center justify-center shadow-[0_0_28px_rgba(182,255,46,0.5)] active:scale-90 transition-all border-4 border-[#14171d]"
          >
            <Plus className="w-8 h-8 text-[#14171d] stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Website mode only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-w-full overflow-x-hidden">
        <div className="bg-[#14171d] border-t border-[rgba(255,255,255,0.12)] shadow-[0_-10px_30px_rgba(0,0,0,0.95)] px-4 pb-[env(safe-area-inset-bottom)] pt-1">
          <div className={`grid ${userRole === 'admin' ? 'grid-cols-4' : 'grid-cols-3'} items-center`}>

            {/* 1 — Home */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'home' ? 'text-[#b6ff2e]' : 'text-[#9ea3b0]'
              }`}
            >
              <Home className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-semibold">{t('navHome')}</span>
            </button>

            {/* 2 — Dashboard */}
            <button
              onClick={() => {
                if (!hasProfile) {
                  onOpenSignIn();
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'dashboard' ? 'text-[#b6ff2e]' : 'text-[#9ea3b0]'
              }`}
            >
              <LayoutDashboard className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-semibold">{t('navDashboard')}</span>
            </button>

            {/* 3 — Scan My Meal */}
            <button
              onClick={handleScanClick}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all text-[#9ea3b0]"
            >
              <Camera className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-semibold">{t('navScanPlate')}</span>
            </button>

            {/* 4 — Admin Portal (Mobile) */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'admin' ? 'text-[#b6ff2e]' : 'text-[#9ea3b0]'
                }`}
              >
                <ShieldCheck className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-semibold">Admin</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};
