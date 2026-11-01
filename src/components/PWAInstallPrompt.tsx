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
  const [dismissed, setDismissed] = useState(true); // default true until verified in useEffect

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

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Check if user previously dismissed prompt (expires after 7 days)
    const dismissedTime = localStorage.getItem('platevision_pwa_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('platevision_pwa_dismissed', Date.now().toString());
  };

  // Don't show if already running in standalone app or dismissed
  if (isStandalone || dismissed) return null;

  // Only show if deferredPrompt is available (Android/Chrome) OR if on iOS Safari
  if (!deferredPrompt && !isIos) return null;

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
              onClick={() => setShowIosGuide(false)}
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

