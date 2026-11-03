'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Flame, FileText, User, Plus, Camera, Image as ImageIcon, 
  Scale, X, Trash2, ShieldCheck, ChevronRight, Droplets, 
  Footprints, Check, ArrowLeft, Download, Sparkles, Heart, Mic, Barcode
} from 'lucide-react';
import { UserProfile, ScannedMeal } from '../../types/plateVision';
import { toLocalDateStr } from '../../lib/date';
import { ScannerZone } from '../ScannerZone';

interface MobileAppDashboardProps {
  profile: UserProfile;
  onSignOut: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const MobileAppDashboard: React.FC<MobileAppDashboardProps> = ({
  profile,
  onSignOut,
  onUpdateProfile
}) => {
  // Calendar date selection
  const todayStr = useMemo(() => toLocalDateStr(), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Meals data
  const [meals, setMeals] = useState<ScannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [refreshKey, setMealsRefreshKey] = useState(0);

  // Modals & Bottom Sheets
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isNutritionReportOpen, setIsNutritionReportOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Selected meal category for scanning (auto-detected by time of day)
  const getAutoMealCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    if (hour >= 15 && hour < 18) return 'Snack';
    return 'Dinner';
  };
  const [selectedCategory, setSelectedCategory] = useState<'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'>(getAutoMealCategory);

  // Local water and steps tracking (cached per day)
  const [waterMl, setWaterMl] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`pv_water_${todayStr}`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [stepsCount, setStepsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`pv_steps_${todayStr}`);
      return saved ? parseInt(saved, 10) : 1240;
    }
    return 1240;
  });

  const handleAddWater = () => {
    setWaterMl((prev) => {
      const next = prev + 250;
      localStorage.setItem(`pv_water_${selectedDateStr}`, next.toString());
      return next;
    });
  };

  // Weight logging state
  const [currentWeight, setCurrentWeight] = useState<number>(profile.currentWeightKg || 70);
  const [newWeightInput, setNewWeightInput] = useState<string>(profile.currentWeightKg?.toString() || '70');

  // Fetch meals from DB
  useEffect(() => {
    let isMounted = true;
    async function fetchMeals() {
      try {
        setIsLoadingMeals(true);
        const res = await fetch('/api/meals');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.meals)) {
            setMeals(data.meals);
          }
        }
      } catch (err) {
        console.error('Failed to fetch meals in app:', err);
      } finally {
        if (isMounted) setIsLoadingMeals(false);
      }
    }
    fetchMeals();
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Filter meals for selected calendar date
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

  // Daily Totals
  const totalCaloriesLogged = mealsForDate.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const totalProteinLogged = mealsForDate.reduce((sum, m) => sum + (m.totalProtein || 0), 0);
  const totalCarbsLogged = mealsForDate.reduce((sum, m) => sum + (m.totalCarbs || 0), 0);
  const totalFatsLogged = mealsForDate.reduce((sum, m) => sum + (m.totalFats || 0), 0);
  const totalFiberLogged = Math.round(totalCarbsLogged * 0.15); // standard fiber estimation

  const dailyCalorieTarget = profile.dailyCaloriesGoal || 2400;
  const caloriesLeft = Math.max(0, dailyCalorieTarget - totalCaloriesLogged);

  // Generate 7-day week calendar strip
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const days = [];
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateStr(d);
      days.push({
        label: labels[i],
        dayNum: d.getDate(),
        dateStr,
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [todayStr]);

  // Delete Meal
  const handleDeleteMeal = async (id: string) => {
    if (!window.confirm('Delete this meal from your journal?')) return;
    try {
      const res = await fetch(`/api/meals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMealsRefreshKey((k) => k + 1);
      }
    } catch (e) {
      console.error('Failed to delete meal:', e);
    }
  };

  // Open Action Sheet with auto-detected category
  const handleOpenActionSheet = (cat?: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner') => {
    if (cat) setSelectedCategory(cat);
    else setSelectedCategory(getAutoMealCategory());
    setIsActionSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#14171d] font-sans pb-28 selection:bg-[#b6ff2e] selection:text-[#14171d]">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Left: Streak Flame Badge */}
          <button
            onClick={() => setIsStreakModalOpen(true)}
            aria-label="View Streak"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200/60 transition-all active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-xs font-black text-gray-800">0</span>
          </button>

          {/* Center: Brand Title */}
          <div 
            onClick={() => setSelectedDateStr(todayStr)}
            className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white p-0.5 border border-gray-200 shadow-sm">
              <img src="/logo.svg" alt="PlateVision" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#14171d]">
              Plate<span className="text-[#84cc16]">Vision</span>
            </span>
          </div>

          {/* Right: Nutrition Report & Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNutritionReportOpen(true)}
              aria-label="Nutrition Report"
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="User Profile"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-800 active:scale-95 transition-all"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        
        {/* WEEKLY CALENDAR STRIP */}
        <section className="bg-white rounded-3xl p-3 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedDateStr;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDateStr(d.dateStr)}
                  className={`flex flex-col items-center justify-center py-2 rounded-2xl transition-all ${
                    isSelected 
                      ? 'bg-[#14171d] text-white shadow-md' 
                      : 'hover:bg-gray-50 text-gray-500'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                    {d.label}
                  </span>
                  <span className={`text-sm font-extrabold mt-0.5 ${isSelected ? 'text-[#b6ff2e]' : 'text-gray-800'}`}>
                    {d.dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* HERO CALORIES & MACROS CARD */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#14171d] tracking-tight">{caloriesLeft}</span>
                <span className="text-sm font-bold text-gray-400">/{dailyCalorieTarget}</span>
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">Calories left</p>
            </div>

            {/* Circular Gauge Ring with Activity Fire */}
            <div className="w-16 h-16 rounded-full border-4 border-gray-100 relative flex items-center justify-center shadow-inner">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="#b6ff2e"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="163"
                  strokeDashoffset={163 - (Math.min(1, totalCaloriesLogged / dailyCalorieTarget) * 163)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="flex flex-col items-center">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-[10px] font-black text-gray-700">+120</span>
              </div>
            </div>
          </div>

          {/* Macros Progress Rows */}
          <div className="grid grid-cols-4 gap-2 pt-6 border-t border-gray-100 mt-5">
            {/* Protein */}
            <div>
              <p className="text-[11px] font-bold text-gray-400">Protein</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden my-1">
                <div 
                  className="bg-[#b6ff2e] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalProteinLogged / (profile.proteinGoalGrams || 120)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-gray-700">{totalProteinLogged}/{profile.proteinGoalGrams || 120}g</p>
            </div>

            {/* Fat */}
            <div>
              <p className="text-[11px] font-bold text-gray-400">Fat</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden my-1">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFatsLogged / (profile.fatsGoalGrams || 70)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-gray-700">{totalFatsLogged}/{profile.fatsGoalGrams || 70}g</p>
            </div>

            {/* Carbs */}
            <div>
              <p className="text-[11px] font-bold text-gray-400">Carbs</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden my-1">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCarbsLogged / (profile.carbsGoalGrams || 250)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-gray-700">{totalCarbsLogged}/{profile.carbsGoalGrams || 250}g</p>
            </div>

            {/* Fiber */}
            <div>
              <p className="text-[11px] font-bold text-gray-400">Fiber</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden my-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFiberLogged / 38) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-gray-700">{totalFiberLogged}/38g</p>
            </div>
          </div>
        </section>

        {/* TWIN METRIC CARDS: STEPS & WATER */}
        <section className="grid grid-cols-2 gap-3">
          
          {/* Steps */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs mb-2">
              <Footprints className="w-4 h-4" />
              <span>Steps</span>
            </div>
            <div className="text-2xl font-black text-[#14171d]">{stepsCount}</div>
            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">of 8,000</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-rose-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (stepsCount / 8000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sky-500 font-bold text-xs">
                <Droplets className="w-4 h-4" />
                <span>Water</span>
              </div>
              <button
                onClick={handleAddWater}
                title="Add 250ml glass"
                className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 font-extrabold flex items-center justify-center hover:bg-sky-100 active:scale-90 transition-all"
              >
                +
              </button>
            </div>
            <div className="text-2xl font-black text-[#14171d]">{waterMl} ml</div>
            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">of 2,000 ml</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (waterMl / 2000) * 100)}%` }}
              />
            </div>
          </div>

        </section>

        {/* MY PROGRESS ROW */}
        <section 
          onClick={() => setIsWeightModalOpen(true)}
          className="bg-white rounded-3xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer hover:border-gray-200 transition-all active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-bold text-gray-400">My progress</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-black text-[#14171d]">{currentWeight} kg</span>
              <span className="text-xs font-semibold text-gray-400">Target: {profile.targetWeightKg || 65} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700">Log weight</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </section>

        {/* LOG MEAL BY CATEGORY SLOTS */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-4 gap-2 text-center">
            
            {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map((cat) => {
              // Check if any meal exists for this category
              const catMeal = mealsForDate.find((m) => (m as any).category === cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleOpenActionSheet(cat)}
                  className="flex flex-col items-center group active:scale-95 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center relative overflow-hidden group-hover:border-[#b6ff2e]">
                    {catMeal?.imageUrl ? (
                      <img src={catMeal.imageUrl} alt={cat} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-[#14171d] flex items-center justify-center text-white">
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-800 mt-2">{cat}</span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {catMeal ? `${catMeal.totalCalories} kcal` : 'Add'}
                  </span>
                </button>
              );
            })}

          </div>
        </section>

        {/* RECENTLY LOGGED MEALS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-[#14171d]">Recently</h3>
            <span className="text-xs font-bold text-gray-400">
              {selectedDateStr === todayStr ? 'Today' : selectedDateStr}
            </span>
          </div>

          {isLoadingMeals ? (
            <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-6 h-6 border-2 border-[#14171d] border-t-[#b6ff2e] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-400 mt-2">Loading your meals...</p>
            </div>
          ) : mealsForDate.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm space-y-2">
              <p className="text-base font-bold text-gray-800">No meals yet!</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Grab something tasty, tap the <strong>+</strong> button below to scan your plate in 2 seconds!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mealsForDate.map((meal, index) => {
                const mealId = (meal as any)._id || meal.id || `app-meal-${index}`;
                return (
                  <div 
                    key={mealId}
                    className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3 hover:border-gray-200 transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      <img 
                        src={meal.imageUrl || '/icons/icon-192x192.png'} 
                        alt={meal.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/icons/icon-192x192.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-extrabold text-gray-900 truncate">{meal.title}</h4>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">
                        <span className="text-[#65a30d] font-black">{meal.totalCalories} kcal</span> • {meal.totalProtein}g protein
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(mealId)}
                      aria-label="Delete meal"
                      className="p-2 text-gray-300 hover:text-rose-500 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* FLOATING ACTION BUTTON (The signature CalZen-like Black + Button) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => handleOpenActionSheet()}
          aria-label="Add or Scan Meal"
          className="w-16 h-16 rounded-full bg-[#14171d] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:bg-black active:scale-90 transition-all border-2 border-white/20"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ACTION SHEET: AUTO-DETECTED MEAL TIME + ACTION LIST               */}
      {/* ========================================================================= */}
      {isActionSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-gray-100"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* Auto-detected Meal Category Pills (Breakfast / Lunch / Snack / Dinner) */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-[#14171d] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* List of Actions */}
            <div className="divide-y divide-gray-100 text-sm font-extrabold text-[#14171d]">
              
              {/* 1. Camera */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsScannerModalOpen(true);
                }}
                className="w-full py-4 flex items-center gap-4 hover:text-[#84cc16] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                  <Camera className="w-5 h-5" />
                </div>
                <span>Camera</span>
              </button>

              {/* 2. Album / Gallery */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsScannerModalOpen(true);
                }}
                className="w-full py-4 flex items-center gap-4 hover:text-[#84cc16] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span>Album</span>
              </button>

              {/* 3. Text or Voice */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsScannerModalOpen(true);
                }}
                className="w-full py-4 flex items-center gap-4 hover:text-[#84cc16] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                  <Mic className="w-5 h-5" />
                </div>
                <span>Text or voice</span>
              </button>

              {/* 4. Barcode */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsScannerModalOpen(true);
                }}
                className="w-full py-4 flex items-center gap-4 hover:text-[#84cc16] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                  <Barcode className="w-5 h-5" />
                </div>
                <span>Barcode</span>
              </button>

              {/* 5. Favorites */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsScannerModalOpen(true);
                }}
                className="w-full py-4 flex items-center gap-4 hover:text-[#84cc16] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                  <Heart className="w-5 h-5" />
                </div>
                <span>Favorites</span>
              </button>

              {/* 6. Log Weight */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsWeightModalOpen(true);
                }}
                className="w-full py-4 flex items-center gap-4 hover:text-[#84cc16] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                  <Scale className="w-5 h-5" />
                </div>
                <span>Log weight</span>
              </button>

            </div>

            <button
              onClick={() => setIsActionSheetOpen(false)}
              className="mt-4 w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-extrabold text-xs hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCANNER MODAL (PlateVision AI Computer Vision)                            */}
      {/* ========================================================================= */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#14171d] text-white border border-white/10 rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">📸 Scan Plate</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#b6ff2e] text-[#14171d] font-black text-[10px]">
                  {selectedCategory}
                </span>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 font-bold"
              >
                ✕
              </button>
            </div>
            
            <ScannerZone
              targetDateStr={selectedDateStr}
              onMealScanned={() => {
                setMealsRefreshKey((k) => k + 1);
                setIsScannerModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREAK MODAL (Screenshot 48)                                              */}
      {/* ========================================================================= */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsStreakModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-orange-50 mx-auto flex items-center justify-center">
              <Flame className="w-9 h-9 text-orange-500 fill-orange-500 animate-pulse" />
            </div>

            <div>
              <h2 className="text-4xl font-black text-[#14171d]">0</h2>
              <p className="text-base font-extrabold text-gray-700">days streak</p>
            </div>

            {/* Weekdays Row */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-400">{d}</span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    i === 1 ? 'border-orange-500 bg-orange-500 text-white font-bold text-xs' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {i === 1 ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Streak Savers */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-black text-gray-800">Streak saver x2</p>
                <p className="text-[10px] text-gray-400">Automatically applies if you miss a day</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">🛡️</span>
                <span className="text-lg">🛡️</span>
              </div>
            </div>

            <button
              onClick={() => setIsStreakModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#14171d] text-white font-black text-sm active:scale-95 transition-all shadow-md"
            >
              Keep it going
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NUTRITION REPORT MODAL (Screenshot 49)                                    */}
      {/* ========================================================================= */}
      {isNutritionReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3" />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#14171d]">Nutrition Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Summary of calories, macros, weight, and meal diary to share with your coach.
                </p>
              </div>
              <button onClick={() => setIsNutritionReportOpen(false)} className="text-gray-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {[
                { title: 'Last 7 days', dates: 'Recent 7-day breakdown' },
                { title: 'Previous week', dates: 'Full week review' },
                { title: 'Last 2 weeks', dates: '14-day progress report' },
                { title: 'Last 30 days', dates: 'Monthly deep dive' }
              ].map((opt) => (
                <button
                  key={opt.title}
                  onClick={() => {
                    alert(`Nutrition Report for "${opt.title}" generated!`);
                    setIsNutritionReportOpen(false);
                  }}
                  className="w-full p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-between border border-gray-100 font-extrabold text-sm text-gray-800 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">{opt.title}</p>
                    <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{opt.dates}</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsNutritionReportOpen(false)}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFILE & SETTINGS MODAL (Screenshots 46, 47, 50)                          */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#F8F9FA] overflow-y-auto">
          <div className="max-w-md mx-auto p-4 space-y-5 pb-16">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between py-2">
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black text-gray-900">Profile & Settings</h2>
              <div className="w-10" />
            </div>

            {/* User Biometrics Summary Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm divide-y divide-gray-100">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Your goal</span>
                <span className="text-xs font-black text-gray-900 capitalize">{profile.goal || 'Gain weight'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Goal weight</span>
                <span className="text-xs font-black text-gray-900">{profile.targetWeightKg || 65} kg</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Current weight</span>
                <span className="text-xs font-black text-gray-900">{currentWeight} kg</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Gender</span>
                <span className="text-xs font-black text-gray-900 capitalize">{profile.gender || 'Male'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Age</span>
                <span className="text-xs font-black text-gray-900">{profile.age || 22}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Height</span>
                <span className="text-xs font-black text-gray-900">{profile.heightCm || 175} cm</span>
              </div>
            </div>

            {/* Daily Goals Section */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm divide-y divide-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Goals</h3>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Daily Water Goal</span>
                <span className="text-xs font-black text-gray-900">2,000 ml</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Daily Steps Goal</span>
                <span className="text-xs font-black text-gray-900">8,000</span>
              </div>
            </div>

            {/* Admin Portal Shortcut (If role is admin) */}
            {profile.role === 'admin' && (
              <a
                href="/admin"
                className="w-full p-4 rounded-3xl bg-[#14171d] text-white flex items-center justify-between shadow-md active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#b6ff2e]" />
                  <div className="text-left">
                    <p className="text-xs font-black">Admin Management Portal</p>
                    <p className="text-[10px] text-gray-400">View users, all scans & tokens</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </a>
            )}

            {/* Sign Out Button */}
            <button
              onClick={() => {
                if (window.confirm('Sign out from your PlateVision account?')) {
                  onSignOut();
                }
              }}
              className="w-full py-4 rounded-3xl bg-rose-50 text-rose-600 font-black text-xs hover:bg-rose-100 active:scale-95 transition-all border border-rose-100"
            >
              Sign Out
            </button>

            <p className="text-[10px] text-center text-gray-400">PlateVision AI • Version 1.0.0</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOG WEIGHT MODAL                                                          */}
      {/* ========================================================================= */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#14171d]">Log your weight</h3>
            <p className="text-xs text-gray-400">Track your daily progress towards your goal</p>
            
            <div className="flex items-center justify-center gap-2 py-4">
              <input
                type="number"
                step="0.1"
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                className="w-28 text-3xl font-black text-center text-[#14171d] border-b-2 border-[#b6ff2e] focus:outline-none"
              />
              <span className="text-base font-bold text-gray-500">kg</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(newWeightInput);
                  if (!isNaN(val) && val > 30 && val < 300) {
                    setCurrentWeight(val);
                    if (onUpdateProfile) {
                      onUpdateProfile({ ...profile, currentWeightKg: val });
                    }
                  }
                  setIsWeightModalOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-[#14171d] text-[#b6ff2e] font-black text-xs shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
