'use client';

import React, { useState } from 'react';
import { Download, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';

interface AccountDataControlsProps {
  onAccountDeleted: () => void;
}

/**
 * GDPR / CCPA data-subject rights: export (access/portability) and delete (erasure).
 */
export const AccountDataControls: React.FC<AccountDataControlsProps> = ({ onAccountDeleted }) => {
  const [confirming, setConfirming] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setIsWorking(true);
    try {
      const [userRes, mealsRes] = await Promise.all([
        fetch('/api/user', { cache: 'no-store' }),
        fetch('/api/meals', { cache: 'no-store' })
      ]);
      if (!userRes.ok || !mealsRes.ok) throw new Error('Could not export your data.');
      const user = await userRes.json();
      const meals = await mealsRes.json();
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), profile: user.user, meals: meals.meals }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'platevision-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Export failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsWorking(true);
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete your account. Please try again.');
      onAccountDeleted();
    } catch (err: any) {
      setError(err?.message || 'Deletion failed.');
      setIsWorking(false);
    }
  };

  return (
    <section
      aria-labelledby="privacy-controls-title"
      className="mt-8 mb-24 md:mb-0 p-5 glass-card rounded-3xl border border-white/10 space-y-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#b6ff2e]" aria-hidden="true" />
        <h2 id="privacy-controls-title" className="text-sm font-extrabold text-white">Your data &amp; privacy</h2>
      </div>
      <p className="text-xs text-[#c4c8d2] leading-relaxed">
        Your meals are private to your account. You can download a copy of all your data or permanently delete your
        account and every meal at any time.
      </p>

      {error && <p role="alert" className="text-xs font-semibold text-rose-300">{error}</p>}

      {!confirming ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            id="export-my-data"
            onClick={handleExport}
            disabled={isWorking}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" aria-hidden="true" /> Download my data
          </button>
          <button
            id="delete-account"
            onClick={() => setConfirming(true)}
            disabled={isWorking}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete my account
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
          <p className="text-xs font-semibold text-rose-200">
            This permanently deletes your profile and all logged meals. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={isWorking}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-account"
              onClick={handleDelete}
              disabled={isWorking}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-rose-600 disabled:opacity-60"
            >
              {isWorking ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />}
              Yes, delete everything
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
