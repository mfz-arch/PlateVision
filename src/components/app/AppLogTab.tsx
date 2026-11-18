'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Utensils } from 'lucide-react';
import { ScannedMeal } from '../../types/plateVision';
import { AppThemeTokens } from '../../lib/appTheme';
import { toLocalDateStr } from '../../lib/date';

interface AppLogTabProps {
  tokens: AppThemeTokens;
  meals: ScannedMeal[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  dailyCalorieTarget: number;
  onOpenMealDetail: (meal: ScannedMeal) => void;
  onDeleteMeal: (id: string) => void;
  onAddMealForCategory: (cat: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => void;
  getMealPhoto: (meal?: ScannedMeal | null) => string | null;
}

type MealWithMeta = ScannedMeal & { _id?: string; category?: string };

const CATEGORIES: Array<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'> = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
];

export const AppLogTab: React.FC<AppLogTabProps> = ({
  tokens,
  meals,
  selectedDateStr,
  onSelectDate,
  dailyCalorieTarget,
  onOpenMealDetail,
  onDeleteMeal,
  onAddMealForCategory,
  getMealPhoto,
}) => {
  const todayStr = useMemo(() => toLocalDateStr(), []);
  const [weekOffset, setWeekOffset] = useState(0);

  // Set of dateStrs that have at least one logged meal
  const loggedDatesSet = useMemo(() => {
    const set = new Set<string>();
    meals.forEach((m) => {
      if (m.dateStr) set.add(m.dateStr);
      else if (m.timestamp) {
        const d = new Date(m.timestamp);
        if (!isNaN(d.getTime())) set.add(toLocalDateStr(d));
      }
    });
    return set;
  }, [meals]);

  // 7-day week strip for current weekOffset
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);

    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateStr(d);
      return {
        label: labels[i],
        dayNum: d.getDate(),
        dateStr,
        hasMeals: loggedDatesSet.has(dateStr),
      };
    });
  }, [weekOffset, loggedDatesSet]);

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [selectedDateStr]);

  // Meals for selected date
  const mealsForDate = useMemo(() => {
    return meals.filter((meal) => {
      if (meal.dateStr) return meal.dateStr === selectedDateStr;
      if (meal.timestamp) {
        const d = new Date(meal.timestamp);
        if (!isNaN(d.getTime())) return toLocalDateStr(d) === selectedDateStr;
      }
      return selectedDateStr === todayStr;
    });
  }, [meals, selectedDateStr, todayStr]);

  const dayTotals = useMemo(() => {
    return mealsForDate.reduce(
      (acc, m) => ({
        kcal: acc.kcal + (m.totalCalories || 0),
        p: acc.p + (m.totalProtein || 0),
        c: acc.c + (m.totalCarbs || 0),
        f: acc.f + (m.totalFats || 0),
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
  }, [mealsForDate]);

  return (
    <div className="space-y-4">
      {/* Header + Week Switcher */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: tokens.ink }}>
          Log
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform active:scale-95"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.ink }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                onSelectDate(todayStr);
              }}
              className="px-3 h-9 rounded-full text-xs font-semibold border transition-transform active:scale-95"
              style={{ backgroundColor: tokens.primarySoft, borderColor: tokens.border, color: tokens.primary }}
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
            disabled={weekOffset >= 0}
            aria-label="Next week"
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.ink }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Strip with activity dots */}
      <section
        className="rounded-[20px] p-2.5 border"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((d) => {
            const isSelected = d.dateStr === selectedDateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => onSelectDate(d.dateStr)}
                className="flex flex-col items-center justify-center py-2 rounded-[14px] transition-all min-h-[54px]"
                style={{
                  backgroundColor: isSelected ? tokens.primary : 'transparent',
                  color: isSelected ? '#FFFFFF' : tokens.ink,
                }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : tokens.muted }}
                >
                  {d.label}
                </span>
                <span className="text-sm font-bold tabular-nums mt-0.5">{d.dayNum}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1"
                  style={{
                    backgroundColor: d.hasMeals
                      ? isSelected
                        ? '#FFFFFF'
                        : tokens.primaryBright
                      : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Day Summary Card */}
      <section
        className="rounded-[20px] p-4 border space-y-2.5"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <p className="text-xs font-medium" style={{ color: tokens.muted }}>
          {formattedSelectedDate}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums" style={{ color: tokens.ink }}>
            {dayTotals.kcal.toLocaleString()}
          </span>
          <span className="text-sm font-medium tabular-nums" style={{ color: tokens.muted }}>
            / {dailyCalorieTarget.toLocaleString()} kcal
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold tabular-nums pt-0.5">
          <span className="inline-flex items-center gap-1.5" style={{ color: tokens.ink }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.protein }} />
            P {dayTotals.p}g
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ color: tokens.ink }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.carbs }} />
            C {dayTotals.c}g
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ color: tokens.ink }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.fat }} />
            F {dayTotals.f}g
          </span>
        </div>
      </section>

      {/* Grouped Meals by Type */}
      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const groupMeals = mealsForDate.filter(
            (m) => ((m as MealWithMeta).category || 'Lunch').toLowerCase() === category.toLowerCase()
          );
          const groupCalories = groupMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);

          return (
            <section key={category} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-semibold" style={{ color: tokens.ink }}>
                  {category}
                </h2>
                {groupMeals.length > 0 && (
                  <span className="text-xs font-semibold tabular-nums" style={{ color: tokens.muted }}>
                    {groupCalories.toLocaleString()} kcal
                  </span>
                )}
              </div>

              {groupMeals.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onAddMealForCategory(category)}
                  className="w-full py-3.5 px-4 rounded-[20px] border border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-[0.99] min-h-[48px]"
                  style={{
                    borderColor: tokens.primaryBright,
                    color: tokens.primaryBright,
                    backgroundColor: tokens.surface,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {category.toLowerCase()}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {groupMeals.map((meal, idx) => {
                    const mealId = (meal as MealWithMeta)._id || meal.id || `log-${category}-${idx}`;
                    const photo = getMealPhoto(meal);
                    return (
                      <div
                        key={mealId}
                        onClick={() => onOpenMealDetail(meal)}
                        className="rounded-[20px] p-3 border flex items-center gap-3 cursor-pointer transition-all active:scale-[0.99]"
                        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                      >
                        <div
                          className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 flex items-center justify-center border"
                          style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
                        >
                          {photo ? (
                            <img src={photo} alt={meal.title} className="w-full h-full object-cover" />
                          ) : (
                            <Utensils className="w-5 h-5" style={{ color: tokens.muted }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate" style={{ color: tokens.ink }}>
                            {meal.title}
                          </h3>
                          <p className="text-xs tabular-nums mt-0.5" style={{ color: tokens.muted }}>
                            P {meal.totalProtein}g · C {meal.totalCarbs}g · F {meal.totalFats}g
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold tabular-nums" style={{ color: tokens.ink }}>
                            {meal.totalCalories}
                          </span>
                          <span className="block text-[10px]" style={{ color: tokens.muted }}>
                            kcal
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMeal(mealId);
                          }}
                          aria-label="Delete meal"
                          className="p-2 rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                          style={{ color: tokens.muted }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

