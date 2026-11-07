'use client';

import React, { useState } from 'react';
import { QrCode, Smartphone, X, Copy, Check, ArrowRight, ExternalLink, Download, Share } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const isMobile = typeof window !== 'undefined' && (/iphone|ipad|ipod|android/.test(navigator.userAgent.toLowerCase()) || window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<'qr' | 'guide'>(() => isMobile ? 'guide' : 'qr');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/app?install=1` 
    : 'https://platevision.app/app?install=1';

  // High-resolution crisp QR code URL pointing directly to /app?install=1
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(appUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy link:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#14171d] text-white border border-[#b6ff2e]/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-1 space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#b6ff2e]/15 border border-[#b6ff2e]/30 flex items-center justify-center mx-auto text-[#b6ff2e]">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white">Télécharger PlateVision</h3>
          <p className="text-xs text-[#9ea3b0]">
            Installez l&apos;application directement sur votre téléphone sans passer par le Play Store / App Store
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#23262f] p-1 rounded-2xl border border-white/5 text-xs font-black">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-[#b6ff2e] text-[#14171d] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Code QR</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'guide'
                ? 'bg-[#b6ff2e] text-[#14171d] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Instructions Mobile</span>
          </button>
        </div>

        {/* TAB 1: QR CODE */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center animate-in fade-in duration-200">
            {/* White card container for high-contrast scanning */}
            <div className="bg-white p-4 rounded-3xl inline-block shadow-lg border-4 border-[#b6ff2e]/20 mx-auto">
              <img 
                src={qrCodeImageUrl} 
                alt="Code QR pour installer PlateVision" 
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
                loading="eager"
              />
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
              📷 <strong>Ouvrez l&apos;appareil photo</strong> de votre téléphone et pointez-le sur ce code QR pour télécharger et ouvrir l&apos;application !
            </p>

            {/* Direct Link & Copy */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#23262f] border border-white/10 text-xs">
              <span className="text-gray-300 truncate font-mono text-[11px] px-2">{appUrl}</span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1 shrink-0 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#b6ff2e]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <a
              href="/app?install=1"
              className="w-full py-3.5 rounded-2xl bg-[#b6ff2e] text-[#14171d] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] active:scale-98"
            >
              <span>Ouvrir directement l&apos;application (/app)</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP MOBILE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-3.5 animate-in fade-in duration-200 text-left">
            
            {/* iPhone / Safari */}
            <div className="p-3.5 rounded-2xl bg-[#23262f] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-black text-xs">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">🍏</span>
                <span>Sur iPhone (Safari) :</span>
              </div>
              <ol className="text-xs text-[#9ea3b0] space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
                <li>Ouvrez le lien <strong>platevision.app/app</strong> dans <strong>Safari</strong>.</li>
                <li>Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3 h-3 inline mx-0.5 text-sky-400" /> (le carré avec la flèche vers le haut).</li>
                <li>Faites défiler vers le bas et appuyez sur <strong>« Sur l&apos;écran d&apos;accueil »</strong>.</li>
                <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
              </ol>
            </div>

            {/* Android / Chrome */}
            <div className="p-3.5 rounded-2xl bg-[#23262f] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-black text-xs">
                <span className="w-5 h-5 rounded-full bg-[#b6ff2e]/20 text-[#b6ff2e] flex items-center justify-center text-[11px]">🤖</span>
                <span>Sur Android (Chrome) :</span>
              </div>
              <ol className="text-xs text-[#9ea3b0] space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
                <li>Ouvrez <strong>platevision.app/app</strong> dans Chrome.</li>
                <li>Appuyez sur les <strong>3 petits points (⋮)</strong> en haut à droite.</li>
                <li>Appuyez sur <strong>« Installer l&apos;application »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.</li>
              </ol>
            </div>

            <a
              href="/app?install=1"
              className="w-full py-4 rounded-2xl bg-[#b6ff2e] text-[#14171d] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] active:scale-98"
            >
              <span>Lancer l&apos;application & Installer (/app)</span>
              <ExternalLink className="w-4 h-4" />
            </a>

          </div>
        )}

      </div>
    </div>
  );
};

