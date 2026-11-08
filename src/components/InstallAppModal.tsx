'use client';

import React, { useState } from 'react';
import { QrCode, Smartphone, X, Copy, Check, ArrowRight, ExternalLink, Download, Share } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isMobile = typeof window !== 'undefined' && (/iphone|ipad|ipod|android/.test(navigator.userAgent.toLowerCase()) || window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<'qr' | 'guide'>(() => isMobile ? 'guide' : 'qr');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/app?install=1` 
    : 'https://platevision.app/app?install=1';

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

  const isFr = language === 'fr';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white text-[#0f172a] border-2 border-slate-200 rounded-3xl p-6 shadow-2xl relative space-y-5"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={isFr ? "Fermer" : "Close"}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-1 space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#b6ff2e]/20 border-2 border-[#84cc16]/30 flex items-center justify-center mx-auto text-[#0f172a]">
            <Smartphone className="w-6 h-6 stroke-[2.5] text-[#84cc16]" />
          </div>
          <h3 className="text-xl font-black text-[#0f172a]">
            {isFr ? "Télécharger PlateVision" : "Install PlateVision App"}
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {isFr 
              ? "Installez l'application directement sur votre téléphone sans passer par le Play Store / App Store"
              : "Install the app directly on your phone instantly without using Play Store / App Store"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-black">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{isFr ? "Code QR" : "QR Code"}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'guide'
                ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isFr ? "Instructions Mobile" : "Phone Instructions"}</span>
          </button>
        </div>

        {/* TAB 1: QR CODE */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center animate-in fade-in duration-200">
            {/* White card container for high-contrast scanning */}
            <div className="bg-slate-50 p-4 rounded-3xl inline-block shadow-inner border-2 border-slate-200 mx-auto">
              <img 
                src={qrCodeImageUrl} 
                alt={isFr ? "Code QR pour installer PlateVision" : "QR Code to install PlateVision"} 
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
                loading="eager"
              />
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
              {isFr ? (
                <>📷 <strong>Ouvrez l&apos;appareil photo</strong> de votre téléphone et pointez-le sur ce code QR pour télécharger et ouvrir l&apos;application !</>
              ) : (
                <>📷 <strong>Open your phone camera</strong> and scan this QR code to download and open the app instantly!</>
              )}
            </p>

            {/* Direct Link & Copy */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-700 truncate font-mono text-[11px] px-2">{appUrl}</span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0f172a] border border-slate-200 font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#84cc16]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier' : 'Copy')}</span>
              </button>
            </div>

            <a
              href="/app?install=1"
              className="w-full py-4 rounded-full bg-[#b6ff2e] text-[#0f172a] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#a3f01b] transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] active:scale-98"
            >
              <span>{isFr ? "Ouvrir directement l'application (/app)" : "Open Web App Directly (/app)"}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP MOBILE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-3.5 animate-in fade-in duration-200 text-left">
            
            {/* iPhone / Safari */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[#0f172a] font-black text-xs">
                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[11px]">🍏</span>
                <span>{isFr ? "Sur iPhone (Safari) :" : "On iPhone (Safari):"}</span>
              </div>
              <ol className="text-xs text-slate-600 font-medium space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
                {isFr ? (
                  <>
                    <li>Ouvrez le lien <strong>platevision.app/app</strong> dans <strong>Safari</strong>.</li>
                    <li>Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3 h-3 inline mx-0.5 text-sky-500" />.</li>
                    <li>Appuyez sur <strong>« Sur l&apos;écran d&apos;accueil »</strong>.</li>
                    <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
                  </>
                ) : (
                  <>
                    <li>Open <strong>platevision.app/app</strong> in <strong>Safari</strong>.</li>
                    <li>Tap the <strong>Share</strong> button <Share className="w-3 h-3 inline mx-0.5 text-sky-500" /> at the bottom.</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong>Add</strong> at the top right.</li>
                  </>
                )}
              </ol>
            </div>

            {/* Android / Chrome */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[#0f172a] font-black text-xs">
                <span className="w-5 h-5 rounded-full bg-[#b6ff2e]/20 text-[#365314] flex items-center justify-center text-[11px]">🤖</span>
                <span>{isFr ? "Sur Android (Chrome) :" : "On Android (Chrome):"}</span>
              </div>
              <ol className="text-xs text-slate-600 font-medium space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
                {isFr ? (
                  <>
                    <li>Ouvrez <strong>platevision.app/app</strong> dans Chrome.</li>
                    <li>Appuyez sur les <strong>3 petits points (⋮)</strong> en haut à droite.</li>
                    <li>Appuyez sur <strong>« Installer l&apos;application »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.</li>
                  </>
                ) : (
                  <>
                    <li>Open <strong>platevision.app/app</strong> in Chrome.</li>
                    <li>Tap the <strong>three dots (⋮)</strong> at the top right.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  </>
                )}
              </ol>
            </div>

            <a
              href="/app?install=1"
              className="w-full py-4 rounded-full bg-[#b6ff2e] text-[#0f172a] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#a3f01b] transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] active:scale-98"
            >
              <span>{isFr ? "Lancer l'application & Installer (/app)" : "Launch App & Install (/app)"}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

          </div>
        )}

      </div>
    </div>
  );
};
