'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, PlusSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
      });
    }

    // Check if already running as installed standalone app
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    if (checkStandalone) {
      setIsDismissed(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Check if dismissed in this session
    const sessionDismissed = sessionStorage.getItem('platevision_pwa_dismissed_session');
    if (sessionDismissed) {
      setIsDismissed(true);
    }

    // Official browser event fired when app is installed
    const handleAppInstalled = () => {
      localStorage.setItem('platevision_pwa_installed', 'true');
      setIsDismissed(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('platevision-pwa-updated'));
      }
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for manual trigger from Dashboard button
    const handleOpenInstall = () => {
      setIsDismissed(false);
      handleInstallClick();
    };
    window.addEventListener('platevision-open-install', handleOpenInstall);

    // Check if early interceptor in layout.tsx already caught beforeinstallprompt
    if (typeof window !== 'undefined' && (window as any).__pwaPrompt) {
      setDeferredPrompt((window as any).__pwaPrompt);
    }

    const handlePromptReady = () => {
      if (typeof window !== 'undefined' && (window as any).__pwaPrompt) {
        setDeferredPrompt((window as any).__pwaPrompt);
      }
    };
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If URL contains ?install=1, auto-trigger prompt
    const hasInstallQuery = typeof window !== 'undefined' && 
      (window.location.search.includes('install=1') || window.location.search.includes('install=true'));

    if (hasInstallQuery && !checkStandalone) {
      setIsDismissed(false);
      setTimeout(() => {
        handleInstallClick();
      }, 750);
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('platevision-open-install', handleOpenInstall);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const markAsInstalled = () => {
    localStorage.setItem('platevision_pwa_installed', 'true');
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('platevision-pwa-updated'));
    }
  };

  const handleInstallClick = async () => {
    const prompt = (window as any).__pwaPrompt || deferredPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          markAsInstalled();
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') (window as any).__pwaPrompt = null;
        }
        return;
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    }

    if (isIos) {
      setShowIosGuide(true);
    } else if (/android/.test(navigator.userAgent.toLowerCase())) {
      setShowAndroidGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('platevision_pwa_dismissed_session', 'true');
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom duration-300">
        <div className="p-3.5 bg-white/95 backdrop-blur-xl rounded-2xl border-2 border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 text-[#0f172a]">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src="/icons/icon-192x192.png" 
              alt="PlateVision Icon" 
              className="w-10 h-10 rounded-xl shrink-0 border border-slate-200 shadow-sm"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-black text-[#0f172a] flex items-center gap-1.5 truncate">
                <span>{isFr ? 'Installer PlateVision' : 'Install PlateVision'}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#b6ff2e]/25 text-[#365314] font-black uppercase">App</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold truncate">
                {isIos 
                  ? (isFr ? 'Ajoutez à l\'écran d\'accueil' : 'Add to Home Screen for 1-tap scanning')
                  : (isFr ? 'Application rapide et hors-ligne' : 'Fast, offline-ready native app experience')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs hover:bg-[#a3f01b] transition-all shadow-xs hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isFr ? 'Installer' : 'Install'}</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label={isFr ? "Fermer" : "Close"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-3xl border-2 border-slate-200 text-[#0f172a] space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#84cc16]" />
                <h3 className="text-base font-black text-[#0f172a]">
                  {isFr ? 'Installer sur iPhone' : 'Install on iPhone'}
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                aria-label={isFr ? "Fermer" : "Close"}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {isFr 
                ? 'Apple exige l\'installation depuis Safari en 2 étapes :' 
                : 'Apple requires installing directly from Safari using these 2 simple steps:'}
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#0f172a]">
                    {isFr ? '1. Appuyez sur le bouton Partager' : '1. Tap the Share button'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isFr ? 'En bas dans Safari' : 'In the bottom bar of Safari'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/25 text-[#365314] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#0f172a]">
                    {isFr ? '2. Choisissez "Sur l\'écran d\'accueil"' : '2. Select "Add to Home Screen"'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isFr ? 'PlateVision apparaîtra comme une app native' : 'PlateVision will appear as a native app icon'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-3.5 rounded-2xl bg-[#0f172a] hover:bg-black text-white font-black text-xs transition-colors active:scale-95"
              >
                {isFr ? 'Compris !' : 'Got it!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Chrome Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-3xl border-2 border-slate-200 text-[#0f172a] space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#84cc16]" />
                <h3 className="text-base font-black text-[#0f172a]">
                  {isFr ? 'Installer sur Android' : 'Install on Android'}
                </h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                aria-label={isFr ? "Fermer" : "Close"}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {isFr 
                ? 'Installez PlateVision sur votre téléphone en 2 étapes simples :'
                : 'Install PlateVision on your phone in 2 simple steps:'}
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-black text-sm shrink-0">
                  ⋮
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#0f172a]">
                    {isFr ? '1. Appuyez sur les 3 points (⋮)' : '1. Tap the three dots (⋮)'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isFr ? 'En haut à droite de Chrome' : 'In the top-right corner of Chrome'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/25 text-[#365314] flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#0f172a]">
                    {isFr ? '2. Appuyez sur "Installer l\'application"' : '2. Tap "Install app" or "Add to Home screen"'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isFr ? 'Sans passer par le Play Store' : 'Installs instantly without Play Store'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  const prompt = (window as any).__pwaPrompt || deferredPrompt;
                  if (prompt) {
                    try {
                      await prompt.prompt();
                      setShowAndroidGuide(false);
                      return;
                    } catch (e) {
                      console.warn('Install error:', e);
                    }
                  }
                  setShowAndroidGuide(false);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs hover:bg-[#a3f01b] transition-all shadow-md active:scale-95"
              >
                {isFr ? "Installer l'application" : "Install App"}
              </button>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                {isFr ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Guide Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-3xl border-2 border-slate-200 text-[#0f172a] space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#84cc16]" />
                <h3 className="text-base font-black text-[#0f172a]">
                  {isFr ? 'Installer PlateVision' : 'Install PlateVision'}
                </h3>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                aria-label={isFr ? "Fermer" : "Close"}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {isFr 
                ? 'Installez PlateVision sur votre ordinateur :' 
                : 'Install PlateVision as a desktop app on your computer:'}
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/25 text-[#365314] flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#0f172a]">
                    {isFr ? 'Regardez la barre d\'adresse' : 'Look at your address bar'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isFr 
                      ? 'Cliquez sur l\'icône d\'installation (⊕ ou ordinateur) à droite de la barre d\'adresse' 
                      : 'Click the install icon (⊕ or computer) at the right end of the URL bar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  const prompt = (window as any).__pwaPrompt || deferredPrompt;
                  if (prompt) {
                    try {
                      await prompt.prompt();
                      setShowDesktopGuide(false);
                      return;
                    } catch (e) {
                      console.warn('Install error:', e);
                    }
                  }
                  setShowDesktopGuide(false);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs hover:bg-[#a3f01b] transition-all shadow-md active:scale-95"
              >
                {isFr ? "Installer l'application" : "Install App"}
              </button>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                {isFr ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
