'use client';

import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('platevision_splash_shown');
      if (!alreadyShown) {
        setVisible(true);
        sessionStorage.setItem('platevision_splash_shown', 'true');
        const fadeTimer = setTimeout(() => setFadeOut(true), 2100);
        const hideTimer = setTimeout(() => setVisible(false), 2800);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#14171d] text-white px-6 text-center transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-20 h-20 rounded-2xl bg-white p-1 mb-6 shadow-[0_0_35px_rgba(182,255,46,0.35)] flex items-center justify-center">
        <img src="/logo.svg" alt="PlateVision Logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#b6ff2e] mb-2 tracking-wide">
        Welcome to PLATEVISION AI
      </h1>
      <p className="text-sm text-[#9ea3b0] font-medium tracking-wide">
        Reach or achieve your nutrition goals
      </p>
      <div className="mt-8 w-12 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#b6ff2e] animate-pulse" />
      </div>
    </div>
  );
};
