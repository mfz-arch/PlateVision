'use client';

import React from 'react';
import { X, Trash2, Sparkles, Flame, Clock } from 'lucide-react';
import { ScannedMeal } from '../../types/plateVision';
import { AppThemeTokens, LIGHT_TOKENS } from '../../lib/appTheme';

interface MealDetailModalProps {
  meal: ScannedMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  tokens?: AppThemeTokens;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  isOpen,
  onClose,
  onDelete,
  tokens = LIGHT_TOKENS,
}) => {
  if (!isOpen || !meal) return null;

  const mealId = (meal as any)._id || meal.id;

  let photo: string | null = null;
  if (typeof window !== 'undefined' && mealId) {
    photo = localStorage.getItem(`pv_photo_${mealId}`);
  }
  if (!photo && meal.imageUrl && !meal.imageUrl.includes('placeholder')) {
    photo = meal.imageUrl;
  }

  const category = (meal as any).category || 'Meal';
  const detectedItems = meal.detectedItems || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border"
        style={{
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          color: tokens.ink,
        }}
      >
        {/* Top Bar */}
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: tokens.primarySoft,
                color: tokens.isDark ? tokens.primaryBright : tokens.primary,
              }}
            >
              {category}
            </span>
            {meal.timestamp && (
              <span
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: tokens.muted }}
              >
                <Clock className="w-3.5 h-3.5" />
                {meal.timestamp}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ backgroundColor: tokens.surfaceMuted, color: tokens.ink }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {photo && (
            <div
              className="relative w-full aspect-video rounded-[20px] overflow-hidden border"
              style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
            >
              <img src={photo} alt={meal.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold tracking-tight leading-snug">{meal.title}</h2>
          </div>

          {/* Brand-Green Macro Breakdown Card */}
          <div
            className="rounded-[20px] p-5 text-white space-y-3"
            style={{ backgroundColor: tokens.primary }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Total Energy
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] leading-none font-bold tabular-nums">
                  {meal.totalCalories}
                </span>
                <span className="text-xs font-medium text-white/80">kcal</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/15">
              <span className="px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                P {meal.totalProtein}g
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                C {meal.totalCarbs}g
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                F {meal.totalFats}g
              </span>
            </div>
          </div>

          {/* Detected Food Ingredients breakdown */}
          {detectedItems.length > 0 && (
            <div
              className="rounded-[20px] p-4 border space-y-2.5"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            >
              <h4
                className="text-xs font-semibold uppercase tracking-wider px-0.5"
                style={{ color: tokens.muted }}
              >
                Ingredients &amp; Portions ({detectedItems.length})
              </h4>
              <div className="space-y-2">
                {detectedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="rounded-[14px] p-3 border flex items-center justify-between gap-3"
                    style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs tabular-nums mt-0.5" style={{ color: tokens.muted }}>
                        {item.weightGrams ? `${item.weightGrams} g` : ''}
                        {item.protein ? ` · P ${item.protein}g` : ''}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums shrink-0"
                      style={{ color: tokens.isDark ? tokens.primaryBright : tokens.primary }}
                    >
                      {item.calories} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Advice & Nutrition Tips */}
          {meal.aiAdvice && (
            <div
              className="rounded-[20px] p-4 border space-y-1.5"
              style={{
                backgroundColor: tokens.primarySoft,
                borderColor: tokens.border,
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  className="w-4 h-4"
                  style={{ color: tokens.isDark ? tokens.primaryBright : tokens.primary }}
                />
                <h4
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: tokens.isDark ? tokens.primaryBright : tokens.primary }}
                >
                  AI Nutritionist Feedback
                </h4>
              </div>
              <p className="text-xs leading-relaxed">{meal.aiAdvice}</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div
          className="p-4 border-t flex items-center gap-3 shrink-0"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this meal from your journal?')) {
                onDelete(mealId);
                onClose();
              }
            }}
            className="flex-1 py-3.5 rounded-[14px] border text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 min-h-[48px]"
            style={{
              borderColor: tokens.error,
              color: tokens.error,
              backgroundColor: 'transparent',
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Meal</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-[14px] text-white font-semibold text-xs active:scale-95 min-h-[48px]"
            style={{ backgroundColor: tokens.primary }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
