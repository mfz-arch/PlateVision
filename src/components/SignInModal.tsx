'use client';

import React, { useState } from 'react';
import { X, LogIn, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (name: string) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate quick authentication
    setTimeout(() => {
      setIsLoading(false);
      onSuccessLogin(email.split('@')[0] || "Aim'fiz");
      onClose();
    }, 900);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccessLogin("Aim'fiz Ibrahim");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md p-8 glass-card rounded-3xl border border-[rgba(255,255,255,0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9ea3b0] hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center">
            <LogIn className="w-6 h-6 text-[#b6ff2e]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Connexion à PlateVision</h2>
          <p className="text-xs text-[#9ea3b0] mt-1">Accédez à votre suivi nutritionnel et historique de repas</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1.5">
              Adresse E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full pl-10 pr-4 py-3 bg-[#14171d] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-[#b6ff2e] focus:ring-1 focus:ring-[#b6ff2e] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#14171d] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-[#b6ff2e] focus:ring-1 focus:ring-[#b6ff2e] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Vérification...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.08)]">
          <p className="text-center text-xs text-[#9ea3b0] mb-3">Test rapide sans mot de passe :</p>
          <button
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#b6ff2e]/40 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-[#b6ff2e]" />
            Connexion démo immédiate (Aim'fiz)
          </button>
        </div>
      </div>
    </div>
  );
};
