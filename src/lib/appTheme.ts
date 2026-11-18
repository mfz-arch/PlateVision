'use client';

import { useState, useEffect } from 'react';

export type AppThemeMode = 'light' | 'dark' | 'system';

export interface AppThemeTokens {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  ink: string;
  muted: string;
  primary: string;
  primaryBright: string;
  primarySoft: string;
  protein: string;
  carbs: string;
  fat: string;
  warning: string;
  error: string;
}

export const LIGHT_TOKENS: AppThemeTokens = {
  isDark: false,
  bg: '#F6F8F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F4F2',
  border: '#E5E7EB',
  ink: '#111827',
  muted: '#6B7280',
  primary: '#0B8556',
  primaryBright: '#1DB27A',
  primarySoft: '#E3F6EE',
  protein: '#4C6FFF',
  carbs: '#F5A524',
  fat: '#F0646A',
  warning: '#F59E0B',
  error: '#DC2626',
};

export const DARK_TOKENS: AppThemeTokens = {
  isDark: true,
  bg: '#0D1411',
  surface: '#16201B',
  surfaceMuted: '#1E2B24',
  border: '#25322B',
  ink: '#F2F7F4',
  muted: '#93A39A',
  primary: '#0B8556',
  primaryBright: '#1DB27A',
  primarySoft: 'rgba(29, 178, 122, 0.16)',
  protein: '#6B8AFF',
  carbs: '#FBBF24',
  fat: '#F87171',
  warning: '#FBBF24',
  error: '#EF4444',
};

const STORAGE_KEY = 'pv_app_theme';

export function useAppTheme() {
  const [mode, setModeState] = useState<AppThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as AppThemeMode | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          return saved;
        }
      } catch {}
    }
    return 'light';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const setMode = (next: AppThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;

  return { mode, setMode, isDark, tokens };
}

