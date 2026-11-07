'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
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

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If URL contains ?install=1 (e.g. from scanning QR code or clicking install button), auto-trigger prompt
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
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const markAsInstalled = () => {
    setIsDismissed(true);
    setShowIosGuide(false);
    setShowAndroidGuide(false);
    setShowDesktopGuide(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('platevision_pwa_dismissed_session', 'true');
      window.dispatchEvent(new CustomEvent('platevision-pwa-updated'));
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          markAsInstalled();
          setDeferredPrompt(null);
        }
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    } else if (isIos) {
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

  // Don't show if already running inside installed standalone app or dismissed in this session
  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom duration-300">
        <div className="p-3.5 glass-card rounded-2xl border border-[#b6ff2e]/40 shadow-[0_10px_35px_rgba(0,0,0,0.8)] bg-[#14171d]/95 backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src="/icons/icon-192x192.png" 
              alt="PlateVision Icon" 
              className="w-10 h-10 rounded-xl shrink-0 border border-[#b6ff2e]/30 shadow-[0_0_12px_rgba(182,255,46,0.25)]"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 truncate">
                <span>Install PlateVision</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#b6ff2e]/15 text-[#b6ff2e] font-extrabold uppercase">App</span>
              </h4>
              <p className="text-[10px] text-[#9ea3b0] truncate">
                {isIos ? 'Add to Home Screen for 1-tap scanning' : 'Fast, offline-ready native app experience'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#b6ff2e] text-[#14171d] font-black text-xs hover:bg-[#a3f01b] transition-all shadow-[0_0_15px_rgba(182,255,46,0.3)] hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="p-1.5 rounded-lg text-[#9ea3b0] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari "Add to Home Screen" Visual Step-by-Step Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 glass-card rounded-3xl border border-[#b6ff2e]/30 bg-[#14171d] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#b6ff2e]" />
                <h3 className="text-base font-extrabold text-white">Install on iPhone</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-[#9ea3b0] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9ea3b0] leading-relaxed">
              Apple requires installing directly from Safari using these 2 simple steps:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#23262f] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">1. Tap the Share button</p>
                  <p className="text-[10px] text-[#9ea3b0]">In the bottom bar of Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#23262f] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/20 text-[#b6ff2e] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">2. Select "Add to Home Screen"</p>
                  <p className="text-[10px] text-[#9ea3b0]">PlateVision will appear as a native app icon</p>
                </div>
              </div>
            </div>

            <button
              onClick={markAsInstalled}
              className="w-full py-3 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide hover:bg-[#a3f01b] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      {/* Android Chrome "Install app" Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 glass-card rounded-3xl border border-[#b6ff2e]/30 bg-[#14171d] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#b6ff2e]" />
                <h3 className="text-base font-extrabold text-white">Install on Android</h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-lg text-[#9ea3b0] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9ea3b0] leading-relaxed">
              Install PlateVision on your phone in 2 simple steps:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#23262f] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/20 text-[#b6ff2e] flex items-center justify-center font-bold text-sm shrink-0">
                  ⋮
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">1. Tap the three dots (⋮)</p>
                  <p className="text-[10px] text-[#9ea3b0]">In the top-right corner of Chrome</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#23262f] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/20 text-[#b6ff2e] flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">2. Tap "Install app" or "Add to Home screen"</p>
                  <p className="text-[10px] text-[#9ea3b0]">PlateVision will install instantly without Play Store</p>
                </div>
              </div>
            </div>

            <button
              onClick={markAsInstalled}
              className="w-full py-3 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide hover:bg-[#a3f01b] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Desktop Chrome "Install app" Guide Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 glass-card rounded-3xl border border-[#b6ff2e]/30 bg-[#14171d] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#b6ff2e]" />
                <h3 className="text-base font-extrabold text-white">Install PlateVision</h3>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1 rounded-lg text-[#9ea3b0] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9ea3b0] leading-relaxed">
              Install PlateVision as a desktop app on your computer:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#23262f] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/20 text-[#b6ff2e] flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Look at your address bar</p>
                  <p className="text-[10px] text-[#9ea3b0]">Click the install icon (⊕ or computer) at the right end of the URL bar</p>
                </div>
              </div>
            </div>

            <button
              onClick={markAsInstalled}
              className="w-full py-3 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide hover:bg-[#a3f01b] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

