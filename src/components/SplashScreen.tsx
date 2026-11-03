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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-[#14171d] px-6 text-center transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-24 h-24 rounded-3xl bg-[#f7fdf0] border-2 border-[#b6ff2e]/40 p-3 mb-6 shadow-[0_8px_30px_rgba(182,255,46,0.2)] flex items-center justify-center">
        <img src="/logo.svg" alt="PlateVision Logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#14171d] mb-2 tracking-tight">
        Welcome to PlateVision
      </h1>
      <p className="text-sm text-gray-500 font-semibold tracking-wide">
        Achieve your nutrition goals
      </p>
      <div className="mt-8 w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#b6ff2e] animate-pulse" />
      </div>
    </div>
  );
};
