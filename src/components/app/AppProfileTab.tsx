'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Monitor,
  Sliders,
  X,
} from 'lucide-react';
import { UserProfile } from '../../types/plateVision';
import { AppThemeMode, AppThemeTokens } from '../../lib/appTheme';

interface AppProfileTabProps {
  tokens: AppThemeTokens;
  profile: UserProfile;
  themeMode: AppThemeMode;
  onChangeThemeMode: (mode: AppThemeMode) => void;
  unitSystem: 'metric' | 'imperial';
  onToggleUnitSystem: () => void;
  onOpenNutritionReport: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  onSignOut: () => void;
}

export const AppProfileTab: React.FC<AppProfileTabProps> = ({
  tokens,
  profile,
  themeMode,
  onChangeThemeMode,
  unitSystem,
  onToggleUnitSystem,
  onOpenNutritionReport,
  onUpdateProfile,
  onSignOut,
}) => {
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [goalCals, setGoalCals] = useState(String(profile.dailyCaloriesGoal || 2100));
  const [goalP, setGoalP] = useState(String(profile.proteinGoalGrams || 130));
  const [goalC, setGoalC] = useState(String(profile.carbsGoalGrams || 240));
  const [goalF, setGoalF] = useState(String(profile.fatsGoalGrams || 70));

  const initial = (profile.name || 'A').trim().charAt(0).toUpperCase();
  const goalLabelMap: Record<string, string> = {
    lose_weight: 'Lose weight',
    maintain_weight: 'Maintain weight',
    gain_weight: 'Gain weight',
    build_muscle: 'Build muscle',
  };
  const goalLabel = goalLabelMap[profile.goal] || 'Custom nutrition plan';

  const handleSaveGoals = () => {
    const cals = Math.max(1000, Math.min(6000, parseInt(goalCals, 10) || 2100));
    const p = Math.max(30, Math.min(400, parseInt(goalP, 10) || 130));
    const c = Math.max(20, Math.min(800, parseInt(goalC, 10) || 240));
    const f = Math.max(20, Math.min(250, parseInt(goalF, 10) || 70));

    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        dailyCaloriesGoal: cals,
        proteinGoalGrams: p,
        carbsGoalGrams: c,
        fatsGoalGrams: f,
      });
    }
    setIsEditGoalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. Identity Header */}
      <section className="flex flex-col items-center text-center pt-4 pb-2 space-y-2.5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border"
          style={{
            backgroundColor: tokens.primarySoft,
            color: tokens.isDark ? tokens.primaryBright : tokens.primary,
            borderColor: tokens.border,
          }}
        >
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: tokens.ink }}>
            {profile.name || 'Athlete'}
          </h1>
          <p className="text-xs font-medium mt-0.5" style={{ color: tokens.muted }}>
            {profile.role === 'admin' ? 'PlateVision Admin' : 'PlateVision member'}
          </p>
        </div>
      </section>

      {/* 2. Daily Goal Card */}
      <section
        className="rounded-[20px] p-4 border space-y-3"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: tokens.muted }}
            >
              Daily goal
            </p>
            <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: tokens.ink }}>
              {(profile.dailyCaloriesGoal || 2100).toLocaleString()} kcal
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: tokens.muted }}>
              {goalLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setGoalCals(String(profile.dailyCaloriesGoal || 2100));
              setGoalP(String(profile.proteinGoalGrams || 130));
              setGoalC(String(profile.carbsGoalGrams || 240));
              setGoalF(String(profile.fatsGoalGrams || 70));
              setIsEditGoalOpen(true);
            }}
            className="px-4 py-2 rounded-[14px] text-xs font-semibold border transition-transform active:scale-95 min-h-[40px]"
            style={{
              backgroundColor: tokens.primarySoft,
              borderColor: tokens.border,
              color: tokens.isDark ? tokens.primaryBright : tokens.primary,
            }}
          >
            Edit
          </button>
        </div>

        <div
          className="flex flex-wrap items-center gap-4 pt-2.5 border-t text-xs font-semibold tabular-nums"
          style={{ borderColor: tokens.border }}
        >
          <span className="inline-flex items-center gap-1.5" style={{ color: tokens.ink }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.protein }} />
            P {profile.proteinGoalGrams || 130}g
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ color: tokens.ink }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.carbs }} />
            C {profile.carbsGoalGrams || 240}g
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ color: tokens.ink }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.fat }} />
            F {profile.fatsGoalGrams || 70}g
          </span>
        </div>
      </section>

      {/* 3. Appearance Selector (Light / Dark / System) */}
      <section
        className="rounded-[20px] p-4 border space-y-3"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: tokens.ink }}>
            Appearance
          </span>
          <span className="text-xs font-medium capitalize" style={{ color: tokens.muted }}>
            {themeMode}
          </span>
        </div>

        <div
          className="grid grid-cols-3 gap-1.5 p-1 rounded-[14px] border"
          style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
        >
          {[
            { id: 'light' as const, label: 'Light', icon: Sun },
            { id: 'dark' as const, label: 'Dark', icon: Moon },
            { id: 'system' as const, label: 'System', icon: Monitor },
          ].map((opt) => {
            const IconComp = opt.icon;
            const active = themeMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeThemeMode(opt.id)}
                className="py-2 px-2 rounded-[10px] flex items-center justify-center gap-1.5 text-xs font-semibold transition-all min-h-[40px]"
                style={{
                  backgroundColor: active ? tokens.primary : 'transparent',
                  color: active ? '#FFFFFF' : tokens.muted,
                }}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Grouped Settings Card */}
      <section
        className="rounded-[20px] border divide-y overflow-hidden"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        {/* Units */}
        <button
          type="button"
          onClick={onToggleUnitSystem}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left min-h-[52px]"
          style={{ borderColor: tokens.border }}
        >
          <span className="text-sm font-medium flex items-center gap-3" style={{ color: tokens.ink }}>
            <Sliders className="w-4 h-4" style={{ color: tokens.muted }} />
            <span>Units</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: tokens.muted }}>
            <span className="capitalize">{unitSystem}</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Nutrition Report */}
        <button
          type="button"
          onClick={onOpenNutritionReport}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left min-h-[52px]"
          style={{ borderColor: tokens.border }}
        >
          <span className="text-sm font-medium flex items-center gap-3" style={{ color: tokens.ink }}>
            <FileText className="w-4 h-4" style={{ color: tokens.muted }} />
            <span>Nutrition Report</span>
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: tokens.muted }} />
        </button>

        {/* Health & Privacy */}
        <a
          href="/privacy"
          className="w-full px-4 py-3.5 flex items-center justify-between text-left min-h-[52px]"
          style={{ borderColor: tokens.border }}
        >
          <span className="text-sm font-medium flex items-center gap-3" style={{ color: tokens.ink }}>
            <ShieldCheck className="w-4 h-4" style={{ color: tokens.muted }} />
            <span>Health &amp; Privacy</span>
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: tokens.muted }} />
        </a>

        {/* Help & Feedback */}
        <a
          href="mailto:support@platevision.app"
          className="w-full px-4 py-3.5 flex items-center justify-between text-left min-h-[52px]"
          style={{ borderColor: tokens.border }}
        >
          <span className="text-sm font-medium flex items-center gap-3" style={{ color: tokens.ink }}>
            <HelpCircle className="w-4 h-4" style={{ color: tokens.muted }} />
            <span>Help &amp; Feedback</span>
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: tokens.muted }} />
        </a>

        {/* Admin Portal (only if admin) */}
        {profile.role === 'admin' && (
          <a
            href="/admin"
            className="w-full px-4 py-3.5 flex items-center justify-between text-left min-h-[52px]"
            style={{ borderColor: tokens.border }}
          >
            <span className="text-sm font-semibold flex items-center gap-3" style={{ color: tokens.primaryBright }}>
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Management Portal</span>
            </span>
            <ChevronRight className="w-4 h-4" style={{ color: tokens.primaryBright }} />
          </a>
        )}

        {/* Log out (red and last, per spec) */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Sign out from your PlateVision account?')) {
              onSignOut();
            }
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left min-h-[52px]"
          style={{ borderColor: tokens.border }}
        >
          <span className="text-sm font-semibold flex items-center gap-3" style={{ color: tokens.error }}>
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </span>
        </button>
      </section>

      <p className="text-center text-[11px] font-medium pt-1" style={{ color: tokens.muted }}>
        PlateVision App · v2.0
      </p>

      {/* Inline Goal Editor Modal */}
      {isEditGoalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[24px] p-6 space-y-4 border shadow-2xl"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.ink }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit daily goals</h3>
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center border"
                style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: tokens.muted }}>
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  value={goalCals}
                  onChange={(e) => setGoalCals(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-[14px] border text-sm font-bold tabular-nums outline-none"
                  style={{
                    backgroundColor: tokens.surfaceMuted,
                    borderColor: tokens.border,
                    color: tokens.ink,
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-semibold" style={{ color: tokens.protein }}>
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={goalP}
                    onChange={(e) => setGoalP(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-[14px] border text-sm font-bold tabular-nums outline-none"
                    style={{
                      backgroundColor: tokens.surfaceMuted,
                      borderColor: tokens.border,
                      color: tokens.ink,
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: tokens.carbs }}>
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={goalC}
                    onChange={(e) => setGoalC(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-[14px] border text-sm font-bold tabular-nums outline-none"
                    style={{
                      backgroundColor: tokens.surfaceMuted,
                      borderColor: tokens.border,
                      color: tokens.ink,
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: tokens.fat }}>
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={goalF}
                    onChange={(e) => setGoalF(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-[14px] border text-sm font-bold tabular-nums outline-none"
                    style={{
                      backgroundColor: tokens.surfaceMuted,
                      borderColor: tokens.border,
                      color: tokens.ink,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(false)}
                className="flex-1 py-3.5 rounded-[14px] text-sm font-semibold border min-h-[48px]"
                style={{
                  backgroundColor: tokens.surfaceMuted,
                  borderColor: tokens.border,
                  color: tokens.ink,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoals}
                className="flex-1 py-3.5 rounded-[14px] text-sm font-semibold text-white min-h-[48px]"
                style={{ backgroundColor: tokens.primary }}
              >
                Save goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
