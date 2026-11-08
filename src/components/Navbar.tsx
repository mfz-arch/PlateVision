'use client';

import React from 'react';
import { Camera, LogIn, UserPlus, Globe, LogOut, Home, Plus, LayoutDashboard, ShieldCheck, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenScanner: () => void;
  onSignOut: () => void;
  onOpenInstallModal?: () => void;
  activeTab: 'home' | 'dashboard' | 'scanner' | 'macros' | 'admin';
  setActiveTab: (tab: 'home' | 'dashboard' | 'scanner' | 'macros' | 'admin') => void;
  hasProfile: boolean;
  userName?: string;
  userRole?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSignIn,
  onOpenRegister,
  onOpenScanner,
  onSignOut,
  onOpenInstallModal,
  activeTab,
  setActiveTab,
  hasProfile,
  userName,
  userRole
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  const handleScanClick = () => {
    if (!hasProfile) {
      onOpenSignIn();
    } else {
      onOpenScanner();
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b-2 border-slate-200/80 text-[#0f172a] max-w-full overflow-x-hidden transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-sm bg-white p-0.5">
              <img src="/logo.svg" alt="PlateVision Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-black tracking-wider text-[#0f172a]">PLATE</span>
                <span className="text-base sm:text-xl font-black tracking-wider text-[#84cc16]">VISION</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[#b6ff2e]/20 text-[#365314] border border-[#84cc16]/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold tracking-wide hidden sm:block">{t('logoSubtitle')}</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === 'home'
                  ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm'
                  : 'text-slate-600 hover:text-[#0f172a] hover:bg-white'
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
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm'
                  : 'text-slate-600 hover:text-[#0f172a] hover:bg-white'
              }`}
            >
              {t('navDashboard')}
            </button>

            <button
              onClick={handleScanClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-[#0f172a] bg-[#b6ff2e] hover:bg-[#a3f01b] transition-all shadow-sm active:scale-95"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              {t('navScanPlate')}
            </button>

            {/* Admin Management Portal Link (Admins Only) */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm'
                    : 'text-[#0f172a] bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#84cc16]" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* Action Controls & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Get App / QR Code Button — Hidden on mobile/small screens to keep the header clean & spacious! */}
            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                title={language === 'fr' ? "Installer l'Application Mobile / Code QR" : "Install Mobile App / QR Code"}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#b6ff2e] text-[#0f172a] hover:bg-[#a3f01b] text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
              >
                <Smartphone className="w-4 h-4 stroke-[2.5]" />
                <span>{t('navInstallApp')}</span>
              </button>
            )}

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              title="Switch Language / Changer de langue"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 border-2 border-slate-200 hover:border-[#0f172a] text-xs font-black text-[#0f172a] transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#84cc16]" />
              <span>{language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
            </button>

            {hasProfile ? (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span>{t('navSignOut')}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-[#0f172a] bg-slate-100 border-2 border-slate-200 hover:border-[#0f172a] transition-all shadow-xs"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  {t('navSignIn')}
                </button>

                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black text-[#0f172a] bg-[#b6ff2e] hover:bg-[#a3f01b] transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  <span>{t('navRegister')}</span>
                </button>
              </>
            )}

          </div>

        </div>
      </div>

      {/* Floating "+" FAB — only visible on Dashboard for Mobile Phones */}
      {activeTab === 'dashboard' && (
        <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={handleScanClick}
            aria-label="Scan Meal"
            className="w-16 h-16 rounded-full bg-[#0f172a] text-[#b6ff2e] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.3)] active:scale-90 transition-all border-4 border-white"
          >
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar — Clean 3-tab layout matching bright mode */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-w-full overflow-x-hidden">
        <div className="bg-white/95 backdrop-blur-md border-t-2 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 pb-[env(safe-area-inset-bottom)] pt-1.5">
          <div className={`grid ${userRole === 'admin' ? 'grid-cols-4' : 'grid-cols-3'} items-center`}>

            {/* 1 — Home */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                activeTab === 'home' ? 'text-[#0f172a] font-black' : 'text-slate-400'
              }`}
            >
              <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5] text-[#84cc16]' : ''}`} />
              <span className="text-[10px] font-black">{t('navHome')}</span>
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
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                activeTab === 'dashboard' ? 'text-[#0f172a] font-black' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5] text-[#84cc16]' : ''}`} />
              <span className="text-[10px] font-black">{t('navDashboard')}</span>
            </button>

            {/* 3 — Scan My Meal */}
            <button
              onClick={handleScanClick}
              className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all text-slate-400 hover:text-[#0f172a]"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-black">{t('navScanPlate')}</span>
            </button>

            {/* 4 — Admin Portal (Mobile) */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                  activeTab === 'admin' ? 'text-[#0f172a] font-black' : 'text-slate-400'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${activeTab === 'admin' ? 'stroke-[2.5] text-[#84cc16]' : ''}`} />
                <span className="text-[10px] font-black">Admin</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};
