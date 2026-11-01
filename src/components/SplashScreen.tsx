'use client';

import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [fadeOut, setFadeOut] = useState(false);

  // Auto fade after 2.5 s
  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-[#14171d] text-white transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <h1 className="text-3xl font-extrabold text-[#b6ff2e] mb-2 animate-pulse">
        Welcome to PLATEVISION AI
      </h1>
      <p className="text-sm text-[#9ea3b0]">
        Reach or achieve your nutrition goals
      </p>
    </div>
  );
};

