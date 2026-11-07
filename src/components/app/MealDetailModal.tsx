'use client';

import React from 'react';
import { X, Trash2, Sparkles, Flame, Clock, Tag } from 'lucide-react';
import { ScannedMeal } from '../../types/plateVision';

interface MealDetailModalProps {
  meal: ScannedMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  isOpen,
  onClose,
  onDelete
}) => {
  if (!isOpen || !meal) return null;

  const mealId = (meal as any)._id || meal.id;

  // Retrieve cached photo or URL
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
        className="w-full sm:max-w-md bg-white text-[#0f172a] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border-t sm:border-2 border-slate-200"
      >
        
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#0f172a] text-[#b6ff2e] text-[10px] font-black uppercase tracking-wider">
              {category}
            </span>
            {meal.timestamp && (
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meal.timestamp}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          
          {/* Meal Photo (if available) */}
          {photo && (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-200/90 shadow-sm">
              <img 
                src={photo} 
                alt={meal.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Meal Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight leading-snug">
              {meal.title}
            </h2>
          </div>

          {/* Macro Breakdown Card (Matching bright & dark contrast) */}
          <div className="bg-[#0f172a] text-white rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Total Energy
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#b6ff2e] tracking-tight">
                  {meal.totalCalories}
                </span>
                <span className="text-xs font-bold text-slate-300">kcal</span>
              </div>
            </div>

            {/* Protein, Carbs, Fats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase">Protein</p>
                <p className="text-sm font-black text-[#b6ff2e] mt-0.5">{meal.totalProtein}g</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase">Carbs</p>
                <p className="text-sm font-black text-white mt-0.5">{meal.totalCarbs}g</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase">Fats</p>
                <p className="text-sm font-black text-white mt-0.5">{meal.totalFats}g</p>
              </div>
            </div>
          </div>

          {/* Detected Food Ingredients breakdown */}
          {detectedItems.length > 0 && (
            <div className="bg-slate-50 rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 px-1">
                Ingredients & Portions ({detectedItems.length})
              </h4>
              <div className="space-y-2">
                {detectedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-[#0f172a] truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {item.weightGrams ? `${item.weightGrams}g` : ''} 
                        {item.protein ? ` • ${item.protein}g protein` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#65a30d] shrink-0">
                      {item.calories} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Advice & Nutrition Tips */}
          {meal.aiAdvice && (
            <div className="bg-emerald-50 rounded-3xl p-4 border-2 border-emerald-200 text-emerald-950 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  AI Nutritionist Feedback
                </h4>
              </div>
              <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                {meal.aiAdvice}
              </p>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this meal from your journal?')) {
                onDelete(mealId);
                onClose();
              }
            }}
            className="flex-1 py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition-colors border border-rose-200 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Meal</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-[#0f172a] hover:bg-black text-white font-black text-xs transition-colors active:scale-95"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
