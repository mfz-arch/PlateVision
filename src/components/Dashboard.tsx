'use client';

import React, { useState } from 'react';
import { 
  Flame, Dumbbell, Wheat, Droplets, Plus, Sparkles, 
  Clock, TrendingUp, Award, Calendar, LogOut, Utensils, Trash2, Download
} from 'lucide-react';
import { UserProfile, ScannedMeal } from '../types/plateVision';
import { ScannerZone } from './ScannerZone';
import { useLanguage } from '../context/LanguageContext';
import { toLocalDateStr } from '../lib/date';

interface DashboardProps {
  profile: UserProfile;
  onOpenScannerModal: () => void;
  onSignOut: () => void;
  /** Bumped by the parent whenever a meal is logged from outside the dashboard (e.g. the "+" modal) */
  refreshKey?: number;
  /** Tells the parent which calendar day is selected so new scans are logged to that day */
  onSelectedDateChange?: (dateStr: string) => void;
  onOpenInstallModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  onOpenScannerModal,
  onSignOut,
  refreshKey = 0,
  onSelectedDateChange,
  onOpenInstallModal
}) => {
  const { t } = useLanguage();
  const todayStr = toLocalDateStr();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [loggedMeals, setLoggedMeals] = useState<ScannedMeal[]>([]);
  const [waterDrankLiters, setWaterDrankLiters] = useState<number>(0);
  const [isLoadingMeals, setIsLoadingMeals] = useState<boolean>(true);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkInstalled = () => {
        const isStandalone = 
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true;
        setIsAppInstalled(isStandalone);
      };

      checkInstalled();

      const handleAppInstalled = () => {
        localStorage.setItem('platevision_pwa_installed', 'true');
        setIsAppInstalled(true);
      };

      const handlePwaUpdate = () => {
        checkInstalled();
      };

      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('platevision-pwa-updated', handlePwaUpdate);

      return () => {
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('platevision-pwa-updated', handlePwaUpdate);
      };
    }
  }, []);

  // Generate 7-day calendar week ending today (local timezone)
  const weekDays = React.useMemo(() => {
    const days = [];
    const curr = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(curr);
      d.setDate(curr.getDate() - i);
      const dateStr = toLocalDateStr(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dayNum = d.getDate();
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      days.push({ dateStr, dayLabel, dayNum, monthLabel });
    }
    return days;
  }, []);

  React.useEffect(() => {
    onSelectedDateChange?.(selectedDateStr);
  }, [selectedDateStr, onSelectedDateChange]);

  // Load ONLY the signed-in user's meals for the selected day
  React.useEffect(() => {
    const controller = new AbortController();
    async function loadMeals() {
      setIsLoadingMeals(true);
      try {
        const res = await fetch(`/api/meals?date=${encodeURIComponent(selectedDateStr)}`, {
          signal: controller.signal,
          cache: 'no-store'
        });
        if (res.status === 401) {
          onSignOut();
          return;
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.meals)) {
          setLoggedMeals(data.meals);
        } else {
          setLoggedMeals([]);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error('Failed to load meals from DB:', err);
      } finally {
        if (!controller.signal.aborted) setIsLoadingMeals(false);
      }
    }
    loadMeals();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateStr, refreshKey]);

  // Defensive: only ever show meals that belong to the selected calendar day
  const mealsForSelectedDate = loggedMeals.filter((m) => m.dateStr === selectedDateStr);

  const totalCaloriesConsumed = mealsForSelectedDate.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const totalProteinConsumed = mealsForSelectedDate.reduce((acc, m) => acc + (m.totalProtein || 0), 0);
  const totalCarbsConsumed = mealsForSelectedDate.reduce((acc, m) => acc + (m.totalCarbs || 0), 0);
  const totalFatsConsumed = mealsForSelectedDate.reduce((acc, m) => acc + (m.totalFats || 0), 0);

  const calPercentage = Math.min(100, Math.round((totalCaloriesConsumed / (profile.dailyCaloriesGoal || 2000)) * 100));
  const proteinPercentage = Math.min(100, Math.round((totalProteinConsumed / (profile.proteinGoalGrams || 150)) * 100));
  const carbsPercentage = Math.min(100, Math.round((totalCarbsConsumed / (profile.carbsGoalGrams || 200)) * 100));

  // Meal was already saved by ScannerZone — just show it if it belongs to the visible day
  const handleMealScanned = (newMeal: ScannedMeal) => {
    if (newMeal?.dateStr === selectedDateStr) {
      setLoggedMeals((prev) => [newMeal, ...prev]);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!mealId) return;
    try {
      const res = await fetch(`/api/meals?id=${encodeURIComponent(mealId)}`, { method: 'DELETE' });
      if (res.ok) {
        setLoggedMeals((prev) => prev.filter((m) => m.id !== mealId && (m as any)._id !== mealId));
      }
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
  };

  const selectedDateLabel = selectedDateStr === todayStr
    ? 'Today'
    : new Date(`${selectedDateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const handleAddWater = () => {
    setWaterDrankLiters((prev) => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  };

  const goalText = profile.goal === 'lose' ? t('dashGoalLoss') : profile.goal === 'gain' ? t('dashGoalGain') : t('dashGoalMaintain');

  return (
    <div>
      {/* MOBILE VIEW (CalZen Arrangement for Mobile Phones ONLY) */}
      <div className="block md:hidden space-y-5 pb-20">
        
        {/* Header with Title (Clean & uncluttered mobile header) */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xs font-black shadow-xs">
              <Flame className="w-4 h-4 text-[#84cc16]" />
            </div>
            <span className="text-2xl font-black text-[#0f172a] tracking-tight">PlateVision</span>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {selectedDateLabel}
          </span>
        </div>

        {/* Days of Week Row (CalZen style - Interactive Date Selector) */}
        <div className="grid grid-cols-7 gap-1 text-center py-2.5 px-1 bg-white rounded-2xl border-2 border-slate-200 shadow-xs">
          {weekDays.map((item) => {
            const isSelected = item.dateStr === selectedDateStr;
            return (
              <button 
                key={item.dateStr}
                onClick={() => setSelectedDateStr(item.dateStr)}
                aria-label={`Show meals for ${item.monthLabel} ${item.dayNum}`}
                aria-pressed={isSelected}
                className="flex flex-col items-center gap-1 focus:outline-none"
              >
                <span className={`text-[10px] font-black ${isSelected ? 'text-[#0f172a]' : 'text-slate-400'}`}>{item.dayLabel}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isSelected 
                    ? 'bg-[#b6ff2e] text-[#0f172a] shadow-xs' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}>
                  {item.dayNum}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Calories Remaining Card (CalZen style - High Contrast Sleek Dark Slate Card) */}
        <div className="p-5 bg-[#0f172a] text-white rounded-3xl border border-slate-800 shadow-md space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {Math.max(0, profile.dailyCaloriesGoal - totalCaloriesConsumed)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/{profile.dailyCaloriesGoal}</span>
              </div>
              <p className="text-xs text-slate-300 font-bold mt-0.5">Calories left</p>
            </div>

            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#b6ff2e] transition-all duration-700"
                  strokeDasharray={`${calPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#b6ff2e]" />
              </div>
            </div>
          </div>

          {/* 4 Macro Progress Bars */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
            <div>
              <p className="text-[10px] font-black text-white mb-0.5">Protein</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-rose-400 h-full" style={{ width: `${proteinPercentage}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 truncate font-semibold">{totalProteinConsumed}/{profile.proteinGoalGrams}g</p>
            </div>

            <div>
              <p className="text-[10px] font-black text-white mb-0.5">Fat</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, (totalFatsConsumed / (profile.fatsGoalGrams || 60)) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 truncate font-semibold">{totalFatsConsumed}/{profile.fatsGoalGrams || 60}g</p>
            </div>

            <div>
              <p className="text-[10px] font-black text-white mb-0.5">Carbs</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-sky-400 h-full" style={{ width: `${carbsPercentage}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 truncate font-semibold">{totalCarbsConsumed}/{profile.carbsGoalGrams}g</p>
            </div>

            <div>
              <p className="text-[10px] font-black text-white mb-0.5">Water</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 truncate font-semibold">{waterDrankLiters}/{profile.waterGoalLiters}L</p>
            </div>
          </div>
        </div>

        {/* Water Tracker & Weight Card Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-sky-500">
              <div className="flex items-center gap-1.5 text-xs font-black">
                <Droplets className="w-4 h-4" />
                <span>Water</span>
              </div>
              <button 
                onClick={handleAddWater}
                aria-label="Add 250 ml of water"
                className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 hover:bg-sky-200 flex items-center justify-center font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-lg font-black text-[#0f172a]">{Math.round(waterDrankLiters * 1000)} <span className="text-xs font-normal text-slate-500">ml</span></p>
              <p className="text-[10px] text-slate-500 font-semibold">of {Math.round(profile.waterGoalLiters * 1000)} ml</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full" style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }} />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-slate-500">My progress</span>
              <p className="text-lg font-black text-[#0f172a] mt-1">{profile.currentWeightKg} kg</p>
              <p className="text-[10px] text-slate-500 font-semibold">Target: {profile.targetWeightKg} kg</p>
            </div>
            <button 
              onClick={onOpenScannerModal}
              className="mt-2 py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black text-center hover:bg-amber-100"
            >
              Log weight
            </button>
          </div>
        </div>

        {/* Meal Category Row (Breakfast, Lunch, Snack, Dinner) */}
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-black text-[#0f172a]">Log Meal by Category</span>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { name: 'Breakfast', icon: '🥣' },
              { name: 'Lunch', icon: '🍲' },
              { name: 'Snack', icon: '🍿' },
              { name: 'Dinner', icon: '🍽️' }
            ].map((cat) => (
              <button
                key={cat.name}
                onClick={onOpenScannerModal}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
              >
                <div className="relative w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">
                  <span>{cat.icon}</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#b6ff2e] text-[#0f172a] flex items-center justify-center text-[10px] font-black">
                    +
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#0f172a]">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recently Logged Meals Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-[#0f172a]">Recently</h3>
            <span className="text-[11px] font-bold text-slate-500">{selectedDateLabel}</span>
          </div>
          {isLoadingMeals ? (
            <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 text-center text-xs text-slate-500">Loading meals...</div>
          ) : mealsForSelectedDate.length === 0 ? (
            <div className="p-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500 font-semibold">No meals logged for {selectedDateStr === todayStr ? 'today' : 'this day'}.</p>
              <button
                onClick={onOpenScannerModal}
                className="px-4 py-2 rounded-xl bg-[#b6ff2e] text-[#0f172a] text-xs font-black hover:bg-[#a3f01b] transition-all shadow-xs"
              >
                Scan your meal now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {mealsForSelectedDate.map((meal, index) => {
                const mealKey = (meal as any)._id || meal.id || `mob-m-${index}`;
                const mealIdToDelete = (meal as any)._id || meal.id;
                return (
                  <div key={mealKey} className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-3 hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <img 
                        src={meal.imageUrl || '/icons/icon-192x192.png'} 
                        alt={meal.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/icons/icon-192x192.png';
                          e.currentTarget.className = 'w-8 h-8 object-contain opacity-80';
                        }}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-black text-[#0f172a] truncate">{meal.title}</h4>
                      <p className="text-[10px] text-[#65a30d] font-bold">{meal.totalCalories} Calories • {meal.timestamp}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(mealIdToDelete)}
                      aria-label={`Delete ${meal.title}`}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block space-y-8 animate-in fade-in duration-300">
        
        {/* Top Welcome Header & Desktop Calendar Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#65a30d]">{t('activeProfileBadge')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-ping" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a]">
              {t('greeting', { name: profile.name })}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {goalText} ({profile.targetWeightKg} kg) • {profile.workoutDaysPerWeek} {t('workoutDaysUnit')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop Calendar Week Selector Strip */}
            <div className="p-2 bg-slate-100 rounded-2xl border-2 border-slate-200 flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 text-xs font-bold text-[#84cc16]">
                <Calendar className="w-4 h-4 text-[#84cc16]" />
              </div>
              {weekDays.map((item) => {
                const isSelected = item.dateStr === selectedDateStr;
                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setSelectedDateStr(item.dateStr)}
                    aria-label={`Show meals for ${item.monthLabel} ${item.dayNum}`}
                    aria-pressed={isSelected}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#b6ff2e] text-[#0f172a] font-black shadow-xs'
                        : 'bg-white text-slate-600 hover:text-[#0f172a] hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold">{item.dayLabel}</span>
                    <span className="text-xs font-black">{item.dayNum}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onOpenScannerModal}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#b6ff2e] text-[#0f172a] font-black text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-xs hover:scale-105 active:scale-95 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-[#0f172a]" />
              <span>{t('scanPlateButton')}</span>
            </button>
          </div>
        </div>

        {/* Top 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Calories Gauge Ring (High Contrast Sleek Dark Card) */}
          <div className="p-6 bg-[#0f172a] text-white rounded-3xl border border-slate-800 shadow-md flex items-center justify-between relative overflow-hidden group">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">{t('caloriesConsumed')}</p>
              <h3 className="text-3xl font-black text-[#b6ff2e]">
                {totalCaloriesConsumed} <span className="text-xs font-semibold text-slate-400">/ {profile.dailyCaloriesGoal} kcal</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-2 font-medium">
                {t('remainingCalories')} : <span className="text-white font-black">{Math.max(0, profile.dailyCaloriesGoal - totalCaloriesConsumed)} kcal</span>
              </p>
            </div>

            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#b6ff2e] transition-all duration-1000 ease-out"
                  strokeDasharray={`${calPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-6 h-6 text-[#b6ff2e]" />
              </div>
            </div>
          </div>

          {/* Card 2: Protein Progress Bar */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-500">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-500 uppercase">{t('proteinsLabel')}</span>
              </div>
              <span className="text-xs font-black text-[#0f172a]">{proteinPercentage}%</span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-[#0f172a]">
                {totalProteinConsumed}g <span className="text-xs font-semibold text-slate-500">/ {profile.proteinGoalGrams}g</span>
              </h3>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-rose-400 h-full transition-all duration-700" 
                style={{ width: `${proteinPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Carbs Progress Bar */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-500">
                  <Wheat className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-500 uppercase">{t('carbsLabel')}</span>
              </div>
              <span className="text-xs font-black text-[#0f172a]">{carbsPercentage}%</span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-[#0f172a]">
                {totalCarbsConsumed}g <span className="text-xs font-semibold text-slate-500">/ {profile.carbsGoalGrams}g</span>
              </h3>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-amber-400 h-full transition-all duration-700" 
                style={{ width: `${carbsPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 4: Water Tracker */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-500">
                  <Droplets className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-500 uppercase">{t('hydration')}</span>
              </div>
              <button
                onClick={handleAddWater}
                className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-600 hover:bg-sky-200 text-[10px] font-black transition-all flex items-center gap-1 border border-sky-200"
              >
                <Plus className="w-3 h-3" />
                {t('addWaterButton')}
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-black text-sky-600">
                {waterDrankLiters} L <span className="text-xs font-semibold text-slate-500">/ {profile.waterGoalLiters} L</span>
              </h3>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-sky-400 h-full transition-all duration-700" 
                style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Embedded Scanner Workspace */}
        <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
          <ScannerZone onMealScanned={handleMealScanned} targetDateStr={selectedDateStr} />
        </div>

        {/* Logged Meals History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#0f172a] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#84cc16]" />
              <span>{t('loggedMealsTitle')}</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{selectedDateLabel} • {t('loggedMealsCount', { count: mealsForSelectedDate.length })}</span>
          </div>

          {isLoadingMeals ? (
            <div className="p-8 bg-white rounded-3xl border-2 border-slate-200 text-center text-xs text-slate-500 font-semibold">Loading meals...</div>
          ) : mealsForSelectedDate.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#84cc16]">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-[#0f172a]">{t('emptyMealsTitle')}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">{t('emptyMealsDesc')}</p>
              <button
                onClick={onOpenScannerModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs tracking-wide hover:bg-[#a3f01b] transition-all shadow-xs mt-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('scanPlateButton')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mealsForSelectedDate.map((meal, index) => {
                const mealKey = (meal as any)._id || meal.id || `meal-${index}`;
                const mealIdToDelete = (meal as any)._id || meal.id;

                return (
                  <div 
                    key={mealKey}
                    className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-4 hover:border-[#84cc16] transition-all group"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <img 
                        src={meal.imageUrl || '/icons/icon-192x192.png'} 
                        alt={meal.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/icons/icon-192x192.png';
                          e.currentTarget.className = 'w-10 h-10 object-contain opacity-80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all"
                      />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-semibold">{meal.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#65a30d]">{meal.totalCalories} kcal</span>
                          <button
                            onClick={() => handleDeleteMeal(mealIdToDelete)}
                            title="Delete meal"
                            aria-label={`Delete ${meal.title}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-[#0f172a] truncate">{meal.title}</h4>
                      
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                        <span>{t('proteinsLabel')}: <strong className="text-[#0f172a]">{meal.totalProtein}g</strong></span>
                        <span>{t('carbsLabel')}: <strong className="text-[#0f172a]">{meal.totalCarbs}g</strong></span>
                        <span>{t('fatsLabel')}: <strong className="text-[#0f172a]">{meal.totalFats}g</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
