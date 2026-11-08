'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, LogIn, Lock, Mail, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile } from '../types/plateVision';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: UserProfile) => void;
  onSwitchToRegister?: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  onSwitchToRegister
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus input and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timeout = setTimeout(() => emailInputRef.current?.focus(), 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Bot trap: reject silently if honeypot was filled
    if (honeypot) {
      setIsLoading(false);
      setErrorMessage('Login failed');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Incorrect email or password');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccessLogin(data.user);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage('Incorrect email or password');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      <div 
        className="relative w-full max-w-md p-8 bg-white rounded-3xl border-2 border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200 text-[#0f172a]"
      >
        <button
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 transition-all focus-visible:ring-2 focus-visible:ring-[#84cc16]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#84cc16]">
            <LogIn className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
          </div>
          <h2 id="signin-modal-title" className="text-2xl font-black text-[#0f172a] tracking-tight">
            {t('signInTitle')}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">{t('signInSubtitle')}</p>
        </div>

        {errorMessage && (
          <div 
            role="alert" 
            className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center animate-in fade-in duration-200"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot anti-spam field */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="sr-only"
            aria-hidden="true"
          />

          <div>
            <label htmlFor="signin-email" className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="signin-email"
                ref={emailInputRef}
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:outline-none focus:bg-white focus:border-[#84cc16] transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signin-password" className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:outline-none focus:bg-white focus:border-[#84cc16] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-[#0f172a] transition-all focus-visible:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>{t('signInVerifying')}</span>
            ) : (
              <>
                <span>{t('signInButton')}</span>
                <ArrowRight className="w-4 h-4 text-[#0f172a]" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Link to Registration Modal */}
        {onSwitchToRegister && (
          <div className="mt-6 pt-5 border-t border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500 font-semibold">{t('noAccountPrompt')}</p>
            <button
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
              className="inline-flex items-center justify-center gap-2 text-xs font-black text-[#65a30d] hover:underline focus-visible:outline-none"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>{t('createAccountLink')}</span>
            </button>
            <div className="pt-2">
              <a
                href="/admin"
                className="text-[11px] text-slate-400 hover:text-[#0f172a] underline transition-colors font-medium"
              >
                Administrator? Open Admin Portal &rarr;
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
