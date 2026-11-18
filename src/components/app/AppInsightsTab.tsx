'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, Scale } from 'lucide-react';
import { ScannedMeal } from '../../types/plateVision';
import { AppThemeTokens } from '../../lib/appTheme';
import { toLocalDateStr } from '../../lib/date';

interface AppInsightsTabProps {
  tokens: AppThemeTokens;
  meals: ScannedMeal[];
  dailyCalorieTarget: number;
  currentWeight: number;
  targetWeight: number;
  unitSystem: 'metric' | 'imperial';
  onOpenWeightModal: () => void;
}

export const AppInsightsTab: React.FC<AppInsightsTabProps> = ({
  tokens,
  meals,
  dailyCalorieTarget,
  currentWeight,
  targetWeight,
  unitSystem,
  onOpenWeightModal,
}) => {
  const [range, setRange] = useState<'week' | 'month'>('week');

  // Map dateStr -> daily totals
  const dailyMap = useMemo(() => {
    const map = new Map<string, { kcal: number; p: number; c: number; f: number }>();
    meals.forEach((m) => {
      let key = m.dateStr;
      if (!key && m.timestamp) {
        const d = new Date(m.timestamp);
        if (!isNaN(d.getTime())) key = toLocalDateStr(d);
      }
      if (!key) return;
      const cur = map.get(key) || { kcal: 0, p: 0, c: 0, f: 0 };
      map.set(key, {
        kcal: cur.kcal + (m.totalCalories || 0),
        p: cur.p + (m.totalProtein || 0),
        c: cur.c + (m.totalCarbs || 0),
        f: cur.f + (m.totalFats || 0),
      });
    });
    return map;
  }, [meals]);

  // Build bars for Week (7 days) or Month (4 weekly averages)
  const { bars, avgKcal, macroTotals } = useMemo(() => {
    const now = new Date();
    const list: Array<{ label: string; kcal: number }> = [];
    let totalKcal = 0;
    let activeDays = 0;
    let p = 0;
    let c = 0;
    let f = 0;

    if (range === 'week') {
      const currentDay = now.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = toLocalDateStr(d);
        const entry = dailyMap.get(key);
        const kcal = entry?.kcal || 0;
        list.push({ label: dayLabels[i], kcal });
        if (kcal > 0) {
          totalKcal += kcal;
          activeDays += 1;
        }
        p += entry?.p || 0;
        c += entry?.c || 0;
        f += entry?.f || 0;
      }
    } else {
      // Last 4 weeks (7-day buckets)
      for (let w = 3; w >= 0; w--) {
        let weekSum = 0;
        let weekActive = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - (w * 7 + (6 - i)));
          const key = toLocalDateStr(d);
          const entry = dailyMap.get(key);
          if (entry && entry.kcal > 0) {
            weekSum += entry.kcal;
            weekActive += 1;
            totalKcal += entry.kcal;
            activeDays += 1;
            p += entry.p;
            c += entry.c;
            f += entry.f;
          }
        }
        const weekAvg = weekActive > 0 ? Math.round(weekSum / weekActive) : 0;
        list.push({ label: `W${4 - w}`, kcal: weekAvg });
      }
    }

    return {
      bars: list,
      avgKcal: activeDays > 0 ? Math.round(totalKcal / activeDays) : 0,
      macroTotals: { p, c, f },
    };
  }, [range, dailyMap]);

  const maxChartKcal = Math.max(
    dailyCalorieTarget * 1.25,
    ...bars.map((b) => b.kcal),
    1000
  );
  const goalLinePercent = Math.min(95, (dailyCalorieTarget / maxChartKcal) * 100);

  // Macro percentages for Donut
  const totalMacroGrams = macroTotals.p + macroTotals.c + macroTotals.f;
  const pPct = totalMacroGrams > 0 ? Math.round((macroTotals.p / totalMacroGrams) * 100) : 30;
  const cPct = totalMacroGrams > 0 ? Math.round((macroTotals.c / totalMacroGrams) * 100) : 45;
  const fPct = totalMacroGrams > 0 ? Math.max(0, 100 - pPct - cPct) : 25;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const pDash = (pPct / 100) * circumference;
  const cDash = (cPct / 100) * circumference;
  const fDash = (fPct / 100) * circumference;

  const displayWeight = (kg: number) =>
    unitSystem === 'imperial' ? `${Math.round(kg * 2.20462)} lbs` : `${kg} kg`;

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: tokens.ink }}>
          Insights
        </h1>
      </div>

      {/* Segmented Week / Month Toggle */}
      <div
        className="p-1 rounded-full border grid grid-cols-2"
        style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
      >
        {(['week', 'month'] as const).map((tab) => {
          const active = range === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setRange(tab)}
              className="py-2.5 rounded-full text-xs font-semibold capitalize transition-all min-h-[40px]"
              style={{
                backgroundColor: active ? tokens.surface : 'transparent',
                color: active ? tokens.ink : tokens.muted,
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Calorie Bar Chart Card */}
      <section
        className="rounded-[20px] p-5 border space-y-4"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div>
          <p className="text-xs font-medium" style={{ color: tokens.muted }}>
            {range === 'week' ? 'Calories this week' : 'Monthly daily average'}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold tabular-nums" style={{ color: tokens.ink }}>
              {avgKcal.toLocaleString()}
            </span>
            <span className="text-xs font-medium" style={{ color: tokens.muted }}>
              kcal / day avg
            </span>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="relative h-40 pt-4 pb-1">
          {/* Dashed Goal Line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed pointer-events-none flex justify-end"
            style={{
              bottom: `${goalLinePercent}%`,
              borderColor: tokens.muted,
              opacity: 0.55,
            }}
          >
            <span
              className="text-[10px] font-semibold -mt-4 px-1.5 rounded"
              style={{ color: tokens.muted, backgroundColor: tokens.surface }}
            >
              Goal {dailyCalorieTarget.toLocaleString()}
            </span>
          </div>

          <div className="h-full flex items-end justify-between gap-2 relative z-10">
            {bars.map((bar, idx) => {
              const heightPct = bar.kcal > 0 ? Math.max(8, Math.min(100, (bar.kcal / maxChartKcal) * 100)) : 4;
              const isOverGoal = bar.kcal > dailyCalorieTarget;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                  <div className="w-full max-w-[30px] flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-[8px] transition-all duration-500"
                      title={`${bar.label}: ${bar.kcal} kcal`}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor:
                          bar.kcal === 0
                            ? tokens.border
                            : isOverGoal
                            ? tokens.fat
                            : tokens.primaryBright,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: tokens.muted }}>
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Macro Split Donut Card */}
      <section
        className="rounded-[20px] p-5 border space-y-4"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <h2 className="text-base font-semibold" style={{ color: tokens.ink }}>
          Macro split
        </h2>

        <div className="flex items-center justify-between gap-6">
          {/* SVG Donut */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 104 104">
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke={tokens.border}
                strokeWidth="12"
              />
              {/* Protein */}
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke={tokens.protein}
                strokeWidth="12"
                strokeDasharray={`${pDash} ${circumference}`}
                strokeDashoffset={0}
              />
              {/* Carbs */}
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke={tokens.carbs}
                strokeWidth="12"
                strokeDasharray={`${cDash} ${circumference}`}
                strokeDashoffset={-pDash}
              />
              {/* Fat */}
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke={tokens.fat}
                strokeWidth="12"
                strokeDasharray={`${fDash} ${circumference}`}
                strokeDashoffset={-(pDash + cDash)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold tabular-nums" style={{ color: tokens.ink }}>
                {totalMacroGrams > 0 ? '100%' : 'Sample'}
              </span>
            </div>
          </div>

          {/* Clear P / C / F Legend */}
          <div className="flex-1 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-medium" style={{ color: tokens.ink }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tokens.protein }} />
                Protein (P)
              </span>
              <span className="font-bold tabular-nums" style={{ color: tokens.ink }}>
                {pPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-medium" style={{ color: tokens.ink }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tokens.carbs }} />
                Carbs (C)
              </span>
              <span className="font-bold tabular-nums" style={{ color: tokens.ink }}>
                {cPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-medium" style={{ color: tokens.ink }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tokens.fat }} />
                Fat (F)
              </span>
              <span className="font-bold tabular-nums" style={{ color: tokens.ink }}>
                {fPct}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Weight Progress Card */}
      <button
        type="button"
        onClick={onOpenWeightModal}
        className="w-full rounded-[20px] p-4 border flex items-center justify-between text-left transition-transform active:scale-[0.99] min-h-[64px]"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center"
            style={{ backgroundColor: tokens.primarySoft, color: tokens.primary }}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: tokens.muted }}>
              Body weight progress
            </p>
            <p className="text-base font-bold tabular-nums mt-0.5" style={{ color: tokens.ink }}>
              {displayWeight(currentWeight)}{' '}
              <span className="text-xs font-medium" style={{ color: tokens.muted }}>
                · Target {displayWeight(targetWeight)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: tokens.primaryBright }}>
          <span>Log</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};

