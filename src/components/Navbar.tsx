'use client';

import React from 'react';
import { Camera, LogIn, UserPlus, Globe, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenScanner: () => void;
  onSignOut: () => void;
  activeTab: 'home' | 'dashboard' | 'scanner' | 'macros';
  setActiveTab: (tab: 'home' | 'dashboard' | 'scanner' | 'macros') => void;
  hasProfile: boolean;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSignIn,
  onOpenRegister,
  onOpenScanner,
  onSignOut,
  activeTab,
  setActiveTab,
  hasProfile,
  userName
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  const handleScanClick = () => {
    if (!hasProfile) {
      // Unauthenticated user -> Open Sign In modal!
      onOpenSignIn();
    } else {
      onOpenScanner();
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-[rgba(255,255,255,0.08)] bg-[#14171d]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#23262f] border border-[#b6ff2e]/40 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(182,255,46,0.25)]">
              <Camera className="w-6 h-6 text-[#b6ff2e]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-wider text-white">PLATE</span>
                <span className="text-xl font-extrabold tracking-wider text-[#b6ff2e]">VISION</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#b6ff2e]/15 text-[#b6ff2e] border border-[#b6ff2e]/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-[#9ea3b0] font-medium tracking-wide">{t('logoSubtitle')}</p>
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

            {hasProfile && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
                    : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
                }`}
              >
                {t('navDashboard')}
              </button>
            )}

            <button
              onClick={handleScanClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#b6ff2e] hover:bg-[#b6ff2e]/10 transition-all border border-[#b6ff2e]/30"
            >
              <Camera className="w-4 h-4 text-[#b6ff2e]" />
              {t('navScanPlate')}
            </button>
          </div>

          {/* Action Controls & Language Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              title="Switch Language / Changer de langue"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#23262f] border border-[rgba(255,255,255,0.1)] hover:border-[#b6ff2e]/50 text-xs font-extrabold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <Globe className="w-4 h-4 text-[#b6ff2e]" />
              <span>{language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
            </button>

            {hasProfile ? (
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" />
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#14171d] bg-[#b6ff2e] hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.35)] hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('navRegister')}
                </button>
              </>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
};
