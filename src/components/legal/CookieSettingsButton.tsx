'use client';

import React from 'react';
import { Settings2 } from 'lucide-react';

/** Re-opens the cookie consent banner. */
export function CookieSettingsButton() {
  const handleClick = () => {
    try {
      localStorage.removeItem('pv_cookie_consent_v1');
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pv:open-cookie-settings'));
    }
  };

  return (
    <button
      id="open-cookie-settings"
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] text-xs font-extrabold hover:bg-[#a3f01b] transition-all focus-visible:outline-none"
    >
      <Settings2 className="w-4 h-4" aria-hidden="true" /> Cookie Preferences
    </button>
  );
}
