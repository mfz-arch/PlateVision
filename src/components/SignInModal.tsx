import React, { useState } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md p-8 glass-card rounded-3xl border border-[rgba(255,255,255,0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9ea3b0] hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center">
            <LogIn className="w-6 h-6 text-[#b6ff2e]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">{t('signInTitle')}</h2>
          <p className="text-xs text-[#9ea3b0] mt-1">{t('signInSubtitle')}</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold text-center animate-in fade-in duration-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1.5">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#14171d] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-[#b6ff2e] focus:ring-1 focus:ring-[#b6ff2e] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1.5">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-[#14171d] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-[#b6ff2e] focus:ring-1 focus:ring-[#b6ff2e] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#9ea3b0] hover:text-white transition-all"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>{t('signInVerifying')}</span>
            ) : (
              <>
                <span>{t('signInButton')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Registration Modal */}
        {onSwitchToRegister && (
          <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.08)] text-center">
            <p className="text-xs text-[#9ea3b0] mb-2">{t('noAccountPrompt')}</p>
            <button
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#b6ff2e] hover:underline"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('createAccountLink')}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
