'use client';

import React, { useState } from 'react';
import { 
  Flame, Dumbbell, Wheat, Droplets, Plus, Sparkles, 
  Clock, TrendingUp, Award, Calendar, LogOut, Utensils, Trash2, Download,
  Footprints, Check, ChevronRight
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
      {/* MOBILE VIEW — Matches MobileAppDashboard 1:1 */}
      <div className="block md:hidden space-y-4 pb-16">
        
        {/* WEEKLY CALENDAR STRIP */}
        <section className="bg-white rounded-3xl p-3 border-2 border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((item) => {
              const isSelected = item.dateStr === selectedDateStr;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  aria-label={`Show meals for ${item.monthLabel} ${item.dayNum}`}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-[#0f172a] text-white shadow-md'
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.dayLabel}
                  </span>
                  <span className={`text-sm font-black mt-0.5 ${isSelected ? 'text-[#b6ff2e]' : 'text-slate-800'}`}>
                    {item.dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* HERO CALORIES & MACROS CARD (Clean White App Card) */}
        <section className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#0f172a] tracking-tight">
                  {Math.max(0, profile.dailyCaloriesGoal - totalCaloriesConsumed)}
                </span>
                <span className="text-sm font-extrabold text-slate-400">/{profile.dailyCaloriesGoal}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Calories left</p>
            </div>

            {/* Circular Gauge Ring */}
            <div className="w-18 h-18 relative flex items-center justify-center shrink-0">
              <svg className="w-18 h-18 -rotate-90" viewBox="0 0 68 68" width="72" height="72">
                <circle
                  cx="34"
                  cy="34"
                  r="27"
                  stroke="#f1f5f9"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="27"
                  stroke="#0f172a"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 27}
                  strokeDashoffset={2 * Math.PI * 27 * (1 - Math.min(1, totalCaloriesConsumed / Math.max(1, profile.dailyCaloriesGoal)))}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Flame className="w-4 h-4 text-[#0f172a] fill-[#0f172a]" />
                <span className="text-[10px] font-black text-[#0f172a] mt-0.5">
                  +{totalCaloriesConsumed}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Macro Progress Rows */}
          <div className="grid grid-cols-4 gap-2 pt-6 border-t-2 border-slate-100 mt-5">
            <div>
              <p className="text-[11px] font-bold text-slate-500">Protein</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className="bg-[#84cc16] h-full rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercentage}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalProteinConsumed}/{profile.proteinGoalGrams}g</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500">Fat</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFatsConsumed / (profile.fatsGoalGrams || 70)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalFatsConsumed}/{profile.fatsGoalGrams || 70}g</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500">Carbs</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercentage}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalCarbsConsumed}/{profile.carbsGoalGrams}g</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500">Fiber</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (Math.round(totalCarbsConsumed * 0.15) / 38) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{Math.round(totalCarbsConsumed * 0.15)}/38g</p>
            </div>
          </div>
        </section>

        {/* TWIN METRIC CARDS: STEPS & WATER */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs mb-2">
              <Footprints className="w-4 h-4" />
              <span>Steps</span>
            </div>
            <div className="text-2xl font-black text-[#0f172a]">1,240</div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">of 8,000</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: '16%' }} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sky-500 font-extrabold text-xs">
                <Droplets className="w-4 h-4" />
                <span>Water</span>
              </div>
              <button
                onClick={handleAddWater}
                aria-label="Add 250 ml of water"
                className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 font-black flex items-center justify-center hover:bg-sky-100 active:scale-90 transition-all border border-sky-100"
              >
                +
              </button>
            </div>
            <div className="text-2xl font-black text-[#0f172a]">{Math.round(waterDrankLiters * 1000)} ml</div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">of {Math.round(profile.waterGoalLiters * 1000)} ml</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (waterDrankLiters / profile.waterGoalLiters) * 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* MY PROGRESS ROW */}
        <section className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400">My progress</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-black text-[#0f172a]">{profile.currentWeightKg} kg</span>
              <span className="text-xs font-bold text-slate-400">Target: {profile.targetWeightKg} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              On track
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </section>

        {/* LOG MEAL BY CATEGORY SLOTS — Clean App Circles (NO Emojis) */}
        <section className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map((cat) => {
              const catMeal = mealsForSelectedDate.find(
                (m) => ((m as any).category || '').toLowerCase() === cat.toLowerCase()
              );
              const photo = catMeal?.imageUrl && !catMeal.imageUrl.includes('placeholder') ? catMeal.imageUrl : null;
              return (
                <button
                  key={cat}
                  onClick={onOpenScannerModal}
                  className="flex flex-col items-center group active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-[#f1f3f5] border-2 border-slate-200/90 flex items-center justify-center relative overflow-hidden group-hover:border-[#0f172a] shadow-sm">
                    {photo ? (
                      <img src={photo} alt={cat} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#f1f3f5]">
                        <div className="w-6 h-6 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-400">
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0f172a] text-white flex items-center justify-center border-2 border-white shadow-sm">
                      {photo ? (
                        <Check className="w-3 h-3 stroke-[3] text-[#b6ff2e]" />
                      ) : (
                        <Plus className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#0f172a] mt-2">{cat}</span>
                  <span className="text-[10px] font-bold text-slate-400">
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
            <h3 className="text-base font-black text-[#0f172a]">Recently</h3>
            <span className="text-xs font-bold text-slate-400">{selectedDateLabel}</span>
          </div>
          {isLoadingMeals ? (
            <div className="bg-white rounded-3xl p-6 text-center border-2 border-slate-200/90 shadow-sm">
              <div className="w-6 h-6 border-2 border-[#0f172a] border-t-[#b6ff2e] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400 mt-2">Loading your meals...</p>
            </div>
          ) : mealsForSelectedDate.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200/90 shadow-sm space-y-3">
              <p className="text-base font-black text-[#0f172a]">No meals yet!</p>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                Snap a photo of your plate to log your calories &amp; macros in seconds.
              </p>
              <button
                onClick={onOpenScannerModal}
                className="px-5 py-2.5 rounded-2xl bg-[#b6ff2e] text-[#0f172a] text-xs font-black hover:bg-[#a3f01b] transition-all shadow-xs"
              >
                Scan your meal now
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mealsForSelectedDate.map((meal, index) => {
                const mealKey = (meal as any)._id || meal.id || `mob-m-${index}`;
                const mealIdToDelete = (meal as any)._id || meal.id;
                const photo = meal.imageUrl && !meal.imageUrl.includes('placeholder') ? meal.imageUrl : null;
                return (
                  <div
                    key={mealKey}
                    className="bg-white rounded-2xl p-3 border-2 border-slate-200/90 shadow-sm flex items-center gap-3 hover:border-[#0f172a] transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt={meal.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-500 font-black text-xs">PV</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {(meal as any).category || 'Meal'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">{meal.timestamp || ''}</span>
                      </div>
                      <h4 className="text-sm font-black text-[#0f172a] truncate mt-0.5">{meal.title}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        <span className="text-[#65a30d] font-black">{meal.totalCalories} kcal</span> • {meal.totalProtein}g protein
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(mealIdToDelete)}
                      aria-label={`Delete ${meal.title}`}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
