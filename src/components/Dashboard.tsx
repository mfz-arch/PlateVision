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
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  onOpenScannerModal,
  onSignOut,
  refreshKey = 0,
  onSelectedDateChange
}) => {
  const { t } = useLanguage();
  const todayStr = toLocalDateStr();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [loggedMeals, setLoggedMeals] = useState<ScannedMeal[]>([]);
  const [waterDrankLiters, setWaterDrankLiters] = useState<number>(0);
  const [isLoadingMeals, setIsLoadingMeals] = useState<boolean>(true);

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
        
        {/* Header with Title & Install Button */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#14171d] border border-white/10 flex items-center justify-center text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-[#b6ff2e]" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">PlateVision</span>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('platevision_pwa_dismissed_session');
              window.dispatchEvent(new CustomEvent('platevision-open-install'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b6ff2e]/10 border border-[#b6ff2e]/40 text-[#b6ff2e] text-xs font-bold hover:bg-[#b6ff2e]/20 active:scale-95 transition-all shadow-[0_0_10px_rgba(182,255,46,0.15)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </div>

        {/* Days of Week Row (CalZen style - Interactive Date Selector) */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 px-1 glass-card rounded-2xl border border-white/5">
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
                <span className="text-[10px] font-bold text-[#9ea3b0]">{item.dayLabel}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isSelected 
                    ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_12px_#b6ff2e]' 
                    : 'text-white hover:bg-white/5'
                }`}>
                  {item.dayNum}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Calories Remaining Card (CalZen style) */}
        <div className="p-5 glass-card rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  {Math.max(0, profile.dailyCaloriesGoal - totalCaloriesConsumed)}
                </span>
                <span className="text-xs text-[#9ea3b0] font-semibold">/{profile.dailyCaloriesGoal}</span>
              </div>
              <p className="text-xs text-[#9ea3b0] font-medium mt-0.5">Calories left</p>
            </div>

            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#14171d]"
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
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
            <div>
              <p className="text-[10px] font-bold text-white mb-0.5">Protein</p>
              <div className="w-full bg-[#14171d] h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-rose-400 h-full" style={{ width: `${proteinPercentage}%` }} />
              </div>
              <p className="text-[9px] text-[#9ea3b0] truncate">{totalProteinConsumed}/{profile.proteinGoalGrams}g</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-white mb-0.5">Fat</p>
              <div className="w-full bg-[#14171d] h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, (totalFatsConsumed / (profile.fatsGoalGrams || 60)) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-[#9ea3b0] truncate">{totalFatsConsumed}/{profile.fatsGoalGrams || 60}g</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-white mb-0.5">Carbs</p>
              <div className="w-full bg-[#14171d] h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-sky-400 h-full" style={{ width: `${carbsPercentage}%` }} />
              </div>
              <p className="text-[9px] text-[#9ea3b0] truncate">{totalCarbsConsumed}/{profile.carbsGoalGrams}g</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-white mb-0.5">Water</p>
              <div className="w-full bg-[#14171d] h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-[#9ea3b0] truncate">{waterDrankLiters}/{profile.waterGoalLiters}L</p>
            </div>
          </div>
        </div>

        {/* Water Tracker & Weight Card Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 glass-card rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-sky-400">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Droplets className="w-4 h-4" />
                <span>Water</span>
              </div>
              <button 
                onClick={handleAddWater}
                aria-label="Add 250 ml of water"
                className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{Math.round(waterDrankLiters * 1000)} <span className="text-xs font-normal text-[#9ea3b0]">ml</span></p>
              <p className="text-[10px] text-[#9ea3b0]">of {Math.round(profile.waterGoalLiters * 1000)} ml</p>
            </div>
            <div className="w-full bg-[#14171d] h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full" style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }} />
            </div>
          </div>

          <div className="p-4 glass-card rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#9ea3b0]">My progress</span>
              <p className="text-lg font-extrabold text-[#b6ff2e] mt-1">{profile.currentWeightKg} kg</p>
              <p className="text-[10px] text-[#9ea3b0]">Target: {profile.targetWeightKg} kg</p>
            </div>
            <button 
              onClick={onOpenScannerModal}
              className="mt-2 py-1.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold text-center"
            >
              Log weight
            </button>
          </div>
        </div>

        {/* Meal Category Row (Breakfast, Lunch, Snack, Dinner) */}
        <div className="p-4 glass-card rounded-2xl border border-white/10 space-y-3">
          <span className="text-xs font-bold text-white">Log Meal by Category</span>
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
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="relative w-12 h-12 rounded-full bg-[#14171d] border border-white/10 flex items-center justify-center text-lg">
                  <span>{cat.icon}</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#b6ff2e] text-[#14171d] flex items-center justify-center text-[10px] font-bold">
                    +
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recently Logged Meals Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-white">Recently</h3>
            <span className="text-[11px] font-semibold text-[#9ea3b0]">{selectedDateLabel}</span>
          </div>
          {isLoadingMeals ? (
            <div className="p-5 glass-card rounded-2xl border border-white/5 text-center text-xs text-[#9ea3b0]">Loading meals...</div>
          ) : mealsForSelectedDate.length === 0 ? (
            <div className="p-5 glass-card rounded-2xl border border-dashed border-white/10 text-center space-y-2">
              <p className="text-xs text-[#9ea3b0]">No meals logged for {selectedDateStr === todayStr ? 'today' : 'this day'}.</p>
              <button
                onClick={onOpenScannerModal}
                className="px-4 py-2 rounded-xl bg-[#b6ff2e] text-[#14171d] text-xs font-bold"
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
                  <div key={mealKey} className="p-3 glass-card rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#23262f] border border-white/10 flex items-center justify-center">
                      <img 
                        src={meal.imageUrl || '/icons/icon-192x192.png'} 
                        alt={meal.title}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/icons/icon-192x192.png';
                          e.currentTarget.className = 'w-8 h-8 object-contain opacity-80';
                        }}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{meal.title}</h4>
                      <p className="text-[10px] text-[#b6ff2e] font-semibold">{meal.totalCalories} Calories • {meal.timestamp}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(mealIdToDelete)}
                      aria-label={`Delete ${meal.title}`}
                      className="p-1.5 text-[#9ea3b0] hover:text-rose-400"
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

      {/* DESKTOP VIEW (Preserved exact Desktop Layout) */}
      <div className="hidden md:block space-y-8 animate-in fade-in duration-300">
        
        {/* Top Welcome Header & Desktop Calendar Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#b6ff2e]">{t('activeProfileBadge')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#b6ff2e] animate-ping" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('greeting', { name: profile.name })}
            </h2>
            <p className="text-xs text-[#9ea3b0] mt-1">
              {goalText} ({profile.targetWeightKg} kg) • {profile.workoutDaysPerWeek} {t('workoutDaysUnit')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop Calendar Week Selector Strip */}
            <div className="p-2 glass-card rounded-2xl border border-white/10 flex items-center gap-1 bg-[#14171d]/80">
              <div className="flex items-center gap-1 px-2 text-xs font-bold text-[#b6ff2e]">
                <Calendar className="w-4 h-4 text-[#b6ff2e]" />
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
                        ? 'bg-[#b6ff2e] text-[#14171d] font-extrabold shadow-[0_0_12px_#b6ff2e]'
                        : 'bg-[#14171d] text-[#9ea3b0] hover:text-white hover:bg-white/5 border border-white/5'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold">{item.dayLabel}</span>
                    <span className="text-xs font-black">{item.dayNum}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem('platevision_pwa_dismissed_session');
                window.dispatchEvent(new CustomEvent('platevision-open-install'));
              }}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#23262f] border border-[#b6ff2e]/30 text-[#b6ff2e] font-extrabold text-sm hover:bg-[#b6ff2e]/10 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>

            <button
              onClick={onOpenScannerModal}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_25px_rgba(182,255,46,0.35)] hover:scale-105 active:scale-95 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-[#14171d]" />
              <span>{t('scanPlateButton')}</span>
            </button>
          </div>
        </div>

        {/* Top 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Calories Gauge Ring */}
          <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)] flex items-center justify-between relative overflow-hidden group">
            <div>
              <p className="text-xs font-bold text-[#9ea3b0] uppercase tracking-wider mb-1">{t('caloriesConsumed')}</p>
              <h3 className="text-3xl font-extrabold text-[#b6ff2e]">
                {totalCaloriesConsumed} <span className="text-xs font-normal text-white">/ {profile.dailyCaloriesGoal} kcal</span>
              </h3>
              <p className="text-[11px] text-[#9ea3b0] mt-2 font-medium">
                {t('remainingCalories')} : <span className="text-white font-bold">{Math.max(0, profile.dailyCaloriesGoal - totalCaloriesConsumed)} kcal</span>
              </p>
            </div>

            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#14171d]"
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
          <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#9ea3b0] uppercase">{t('proteinsLabel')}</span>
              </div>
              <span className="text-xs font-extrabold text-white">{proteinPercentage}%</span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">
                {totalProteinConsumed}g <span className="text-xs font-normal text-[#9ea3b0]">/ {profile.proteinGoalGrams}g</span>
              </h3>
            </div>

            <div className="w-full bg-[#14171d] h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-rose-400 h-full transition-all duration-700" 
                style={{ width: `${proteinPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Carbs Progress Bar */}
          <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wheat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#9ea3b0] uppercase">{t('carbsLabel')}</span>
              </div>
              <span className="text-xs font-extrabold text-white">{carbsPercentage}%</span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">
                {totalCarbsConsumed}g <span className="text-xs font-normal text-[#9ea3b0]">/ {profile.carbsGoalGrams}g</span>
              </h3>
            </div>

            <div className="w-full bg-[#14171d] h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-amber-400 h-full transition-all duration-700" 
                style={{ width: `${carbsPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 4: Water Tracker */}
          <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Droplets className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#9ea3b0] uppercase">{t('hydration')}</span>
              </div>
              <button
                onClick={handleAddWater}
                className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-[10px] font-bold transition-all flex items-center gap-1 border border-sky-500/30"
              >
                <Plus className="w-3 h-3" />
                {t('addWaterButton')}
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-sky-400">
                {waterDrankLiters} L <span className="text-xs font-normal text-[#9ea3b0]">/ {profile.waterGoalLiters} L</span>
              </h3>
            </div>

            <div className="w-full bg-[#14171d] h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-sky-400 h-full transition-all duration-700" 
                style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Embedded Scanner Workspace */}
        <div className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)]">
          <ScannerZone onMealScanned={handleMealScanned} targetDateStr={selectedDateStr} />
        </div>

        {/* Logged Meals History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#b6ff2e]" />
              <span>{t('loggedMealsTitle')}</span>
            </h3>
            <span className="text-xs text-[#9ea3b0] font-semibold">{selectedDateLabel} • {t('loggedMealsCount', { count: mealsForSelectedDate.length })}</span>
          </div>

          {isLoadingMeals ? (
            <div className="p-8 glass-card rounded-3xl border border-white/5 text-center text-xs text-[#9ea3b0]">Loading meals...</div>
          ) : mealsForSelectedDate.length === 0 ? (
            <div className="p-8 glass-card rounded-3xl border border-dashed border-white/10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e]">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">{t('emptyMealsTitle')}</h4>
              <p className="text-xs text-[#9ea3b0] max-w-md mx-auto">{t('emptyMealsDesc')}</p>
              <button
                onClick={onOpenScannerModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_15px_rgba(182,255,46,0.3)] mt-2"
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
                    className="p-4 glass-card rounded-2xl border border-[rgba(255,255,255,0.08)] flex items-center gap-4 hover:border-[#b6ff2e]/40 transition-all group"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#23262f] border border-white/10 flex items-center justify-center">
                      <img 
                        src={meal.imageUrl || '/icons/icon-192x192.png'} 
                        alt={meal.title}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
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
                        <span className="text-[10px] text-[#9ea3b0] font-semibold">{meal.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#b6ff2e]">{meal.totalCalories} kcal</span>
                          <button
                            onClick={() => handleDeleteMeal(mealIdToDelete)}
                            title="Delete meal"
                            aria-label={`Delete ${meal.title}`}
                            className="p-1 rounded-lg text-[#9ea3b0] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{meal.title}</h4>
                      
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9ea3b0]">
                        <span>{t('proteinsLabel')}: <strong className="text-white">{meal.totalProtein}g</strong></span>
                        <span>{t('carbsLabel')}: <strong className="text-white">{meal.totalCarbs}g</strong></span>
                        <span>{t('fatsLabel')}: <strong className="text-white">{meal.totalFats}g</strong></span>
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
