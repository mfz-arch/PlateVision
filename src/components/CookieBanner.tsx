'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

const CONSENT_KEY = 'pv_cookie_consent_v1';

export type CookieConsent = 'all' | 'necessary';

/** Read the stored consent choice (null = not decided yet). */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.choice === 'all' || parsed?.choice === 'necessary' ? parsed.choice : null;
  } catch {
    return null;
  }
}

/**
 * GDPR / ePrivacy cookie notice.
 * PlateVision currently only uses strictly-necessary storage (session cookie,
 * language & consent preference). If analytics or marketing tools are ever added,
 * they MUST only load when getCookieConsent() === 'all'.
 */
export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
    const reopen = () => setVisible(true);
    window.addEventListener('pv:open-cookie-settings', reopen);
    return () => window.removeEventListener('pv:open-cookie-settings', reopen);
  }, []);

  const save = (choice: CookieConsent) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, date: new Date().toISOString() }));
    } catch {
      /* storage unavailable — banner will simply show again next visit */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed left-3 right-3 bottom-24 md:bottom-6 md:left-6 md:right-auto md:max-w-md z-[70] p-5 rounded-3xl bg-[#1b1e25]/95 backdrop-blur-xl border border-[#b6ff2e]/25 shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center">
          <Cookie className="w-5 h-5 text-[#b6ff2e]" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 id="cookie-banner-title" className="text-sm font-extrabold text-white">We value your privacy</h2>
          <p id="cookie-banner-desc" className="text-xs text-[#c4c8d2] leading-relaxed">
            We use only essential cookies to keep you signed in and remember your preferences. We don&apos;t use
            advertising or tracking cookies. Read our{' '}
            <Link href="/cookies" className="text-[#b6ff2e] underline underline-offset-2">Cookie Policy</Link>.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          id="cookie-necessary-only"
          onClick={() => save('necessary')}
          className="py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold hover:bg-white/10 transition-all"
        >
          Necessary only
        </button>
        <button
          id="cookie-accept-all"
          onClick={() => save('all')}
          className="py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] text-xs font-extrabold hover:bg-[#a3f01b] transition-all shadow-[0_0_15px_rgba(182,255,46,0.3)]"
        >
          Accept all
        </button>
      </div>
    </div>
  );
};
