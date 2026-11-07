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
  const [dismissGlp1, setDismissGlp1] = useState(false);

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

  // Helper to reliably retrieve food photo (local camera capture cache, or DB imageUrl)
  const getMealPhoto = (meal?: ScannedMeal | null): string | null => {
    if (!meal) return null;
    const id = (meal as any)._id || meal.id;
    if (typeof window !== 'undefined' && id) {
      const cached = localStorage.getItem(`pv_photo_${id}`);
      if (cached) return cached;
    }
    if (meal.imageUrl && !meal.imageUrl.includes('placeholder')) {
      return meal.imageUrl;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#14171d] font-sans pb-28 selection:bg-[#b6ff2e] selection:text-[#14171d]">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Left: Streak Flame Badge */}
          <button
            onClick={() => setIsStreakModalOpen(true)}
            aria-label="View Streak"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 transition-all active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-xs font-black text-slate-800">0</span>
          </button>

          {/* Center: Brand Title */}
          <div 
            onClick={() => setSelectedDateStr(todayStr)}
            className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white p-0.5 border-2 border-slate-200 shadow-sm">
              <img src="/logo.svg" alt="PlateVision" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#0f172a]">
              Plate<span className="text-[#84cc16]">Vision</span>
            </span>
          </div>

          {/* Right: Nutrition Report & Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNutritionReportOpen(true)}
              aria-label="Nutrition Report"
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all border border-slate-200"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="User Profile"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 flex items-center justify-center text-slate-800 active:scale-95 transition-all"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        
        {/* WEEKLY CALENDAR STRIP */}
        <section className="bg-white rounded-3xl p-3 border-2 border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedDateStr;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDateStr(d.dateStr)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                    isSelected 
                      ? 'bg-[#0f172a] text-white shadow-md' 
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {d.label}
                  </span>
                  <span className={`text-sm font-black mt-0.5 ${isSelected ? 'text-[#b6ff2e]' : 'text-slate-800'}`}>
                    {d.dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* HERO CALORIES & MACROS CARD */}
        <section className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#0f172a] tracking-tight">{caloriesLeft}</span>
                <span className="text-sm font-extrabold text-slate-400">/{dailyCalorieTarget}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Calories left</p>
            </div>

            {/* Circular Gauge Ring matching CalZen Reference (Concentric & Smooth) */}
            <div className="w-18 h-18 relative flex items-center justify-center shrink-0">
              <svg className="w-18 h-18 -rotate-90" viewBox="0 0 68 68" width="72" height="72">
                {/* Complete background track */}
                <circle
                  cx="34"
                  cy="34"
                  r="27"
                  stroke="#f1f5f9"
                  strokeWidth="5"
                  fill="none"
                />
                {/* Active progress stroke */}
                <circle
                  cx="34"
                  cy="34"
                  r="27"
                  stroke="#0f172a"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 27}
                  strokeDashoffset={2 * Math.PI * 27 * (1 - Math.min(1, totalCaloriesLogged / dailyCalorieTarget))}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Flame className="w-4 h-4 text-[#0f172a] fill-[#0f172a]" />
                <span className="text-[10px] font-black text-[#0f172a] mt-0.5">
                  +{totalCaloriesLogged > 0 ? totalCaloriesLogged : 6}
                </span>
              </div>
            </div>
          </div>

          {/* Macros Progress Rows */}
          <div className="grid grid-cols-4 gap-2 pt-6 border-t-2 border-slate-100 mt-5">
            {/* Protein */}
            <div>
              <p className="text-[11px] font-bold text-slate-500">Protein</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div 
                  className="bg-[#84cc16] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalProteinLogged / (profile.proteinGoalGrams || 120)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalProteinLogged}/{profile.proteinGoalGrams || 120}g</p>
            </div>

            {/* Fat */}
            <div>
              <p className="text-[11px] font-bold text-slate-500">Fat</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFatsLogged / (profile.fatsGoalGrams || 70)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalFatsLogged}/{profile.fatsGoalGrams || 70}g</p>
            </div>

            {/* Carbs */}
            <div>
              <p className="text-[11px] font-bold text-slate-500">Carbs</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCarbsLogged / (profile.carbsGoalGrams || 250)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalCarbsLogged}/{profile.carbsGoalGrams || 250}g</p>
            </div>

            {/* Fiber */}
            <div>
              <p className="text-[11px] font-bold text-slate-500">Fiber</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1.5">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFiberLogged / 38) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f172a]">{totalFiberLogged}/38g</p>
            </div>
          </div>
        </section>

        {/* TWIN METRIC CARDS: STEPS & WATER */}
        <section className="grid grid-cols-2 gap-3">
          
          {/* Steps */}
          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs mb-2">
              <Footprints className="w-4 h-4" />
              <span>Steps</span>
            </div>
            <div className="text-2xl font-black text-[#0f172a]">{stepsCount}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">of 8,000</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-rose-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (stepsCount / 8000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sky-500 font-extrabold text-xs">
                <Droplets className="w-4 h-4" />
                <span>Water</span>
              </div>
              <button
                onClick={handleAddWater}
                title="Add 250ml glass"
                className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 font-black flex items-center justify-center hover:bg-sky-100 active:scale-90 transition-all border border-sky-100"
              >
                +
              </button>
            </div>
            <div className="text-2xl font-black text-[#0f172a]">{waterMl} ml</div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">of 2,000 ml</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
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
          className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-black text-slate-400">My progress</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-black text-[#0f172a]">{currentWeight} kg</span>
              <span className="text-xs font-bold text-slate-400">Target: {profile.targetWeightKg || 65} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">Log weight</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </section>

        {/* GLP-1 DIARY CARD (Screenshot 9) */}
        {!dismissGlp1 && (
          <section className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm space-y-3">
            <div>
              <h4 className="text-sm font-black text-[#0f172a]">GLP-1 diary</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                If you&apos;ve been prescribed Ozempic, Mounjaro or a similar medication, log your shots and how you feel alongside your meals.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDismissGlp1(true)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0f172a] font-black text-xs transition-colors border border-slate-200"
              >
                Not now
              </button>
              <button
                onClick={() => alert('GLP-1 diary enabled for your daily logs!')}
                className="flex-1 py-3 rounded-2xl bg-[#0f172a] hover:bg-black text-white font-black text-xs transition-colors"
              >
                Try it
              </button>
            </div>
          </section>
        )}

        {/* LOG MEAL BY CATEGORY SLOTS (Screenshot 8) */}
        <section className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            
            {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map((cat) => {
              // Check if any meal exists for this category
              const catMeal = mealsForDate.find((m) => (m as any).category === cat);
              const photo = getMealPhoto(catMeal);
              return (
                <button
                  key={cat}
                  onClick={() => handleOpenActionSheet(cat)}
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
                    {/* Bottom-right badge matching user screenshot 8 */}
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
            <span className="text-xs font-bold text-slate-400">
              {selectedDateStr === todayStr ? 'Today' : selectedDateStr}
            </span>
          </div>

          {isLoadingMeals ? (
            <div className="bg-white rounded-3xl p-6 text-center border-2 border-slate-200/90 shadow-sm">
              <div className="w-6 h-6 border-2 border-[#0f172a] border-t-[#b6ff2e] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400 mt-2">Loading your meals...</p>
            </div>
          ) : mealsForDate.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200/90 shadow-sm space-y-2">
              <p className="text-base font-black text-[#0f172a]">No meals yet!</p>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                Grab something tasty, log it here, and check out our Instagram <strong>@platevision.ai</strong>!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mealsForDate.map((meal, index) => {
                const mealId = (meal as any)._id || meal.id || `app-meal-${index}`;
                const photo = getMealPhoto(meal);
                return (
                  <div 
                    key={mealId}
                    className="bg-white rounded-2xl p-3 border-2 border-slate-200/90 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                      {photo ? (
                        <img 
                          src={photo} 
                          alt={meal.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-black text-xs">
                          PV
                        </div>
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
                      onClick={() => handleDeleteMeal(mealId)}
                      aria-label="Delete meal"
                      className="p-2 text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
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
              defaultCategory={selectedCategory}
              onMealScanned={() => {
                setMealsRefreshKey((k) => k + 1);
                setIsScannerModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREAK MODAL (Screenshot 7)                                               */}
      {/* ========================================================================= */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#FAFAFA] rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsStreakModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Big Metallic Flame */}
            <div className="pt-2">
              <div className="w-20 h-20 mx-auto flex items-center justify-center text-gray-300">
                <Flame className="w-16 h-16 fill-gray-300 text-gray-400 drop-shadow-sm" />
              </div>
              <h2 className="text-4xl font-black text-[#14171d] mt-1">0</h2>
              <p className="text-sm font-extrabold text-[#14171d]">days streak</p>
            </div>

            {/* Weekdays Row Mon-Sun */}
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-2 px-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d} className={d === 'Tue' ? 'text-black font-extrabold' : ''}>{d}</span>
                ))}
              </div>
              <div className="flex items-center justify-between px-1">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      i === 1 ? 'bg-black text-white font-black text-xs' : 'bg-gray-100 text-transparent'
                    }`}
                  >
                    {i === 1 ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Twin cards: Nov 3 / Streak started & 0% / Better than 0% PlateVision users */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
                <p className="text-sm font-black text-[#14171d]">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Streak started</p>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
                <p className="text-sm font-black text-[#84cc16]">0%</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Better than 0% PlateVision users</p>
              </div>
            </div>

            {/* Milestone Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-gray-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                  </div>
                  <span className="text-xs">0</span>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-[#14171d]">3 more days</p>
                  <p className="text-[9px] font-bold text-gray-400">to next milestone</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">3</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5 fill-gray-400 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#b6ff2e] h-full rounded-full w-[15%]" />
              </div>
            </div>

            {/* Streak Savers */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-black text-[#14171d]">Streak saver <span className="text-[#84cc16]">×2</span></p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Automatically applies if you miss a day</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-lime-100 text-lime-700 flex items-center justify-center text-xs">🛡️</span>
                <span className="w-6 h-6 rounded-full bg-lime-100 text-lime-700 flex items-center justify-center text-xs">🛡️</span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => setIsStreakModalOpen(false)}
              className="w-full py-4 rounded-2xl bg-[#14171d] text-white font-black text-sm active:scale-98 transition-all shadow-md"
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
      {/* PROFILE & SETTINGS MODAL (Screenshots 5 & 6)                              */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#F7F7F8] overflow-y-auto">
          <div className="max-w-md mx-auto p-4 space-y-4 pb-16">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between py-2">
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-800 active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-extrabold text-[#14171d]">Profile</h2>
              <div className="w-10" />
            </div>

            {/* Group 1: Notifications & Units */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm divide-y divide-gray-100">
              <div className="py-2.5 flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-black text-[#14171d]">Notifications</p>
                  <p className="text-[10px] font-semibold text-gray-400">Manage meal reminders</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="py-2.5 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-black text-[#14171d]">Measurement Units</span>
                <div className="flex items-center gap-1 text-gray-400">
                  <span className="text-xs font-semibold text-gray-500">metric</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Section: Goals */}
            <div>
              <p className="text-xs font-black text-[#14171d] px-2 mb-2">Goals</p>
              <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm divide-y divide-gray-100">
                <div className="py-2.5 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-gray-800">Daily Water Goal</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="text-xs font-semibold text-gray-500">2000 ml</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="py-2.5 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-gray-800">Daily Steps Goal</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="text-xs font-semibold text-gray-500">10,000</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="py-2.5 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-gray-800">Health Connect</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="text-xs font-semibold text-gray-500">Connected</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: PlateVision Pro */}
            <div>
              <p className="text-xs font-black text-[#14171d] px-2 mb-2">PlateVision Pro</p>
              <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
                <div className="py-1 flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-black text-[#14171d]">Choose a plan</p>
                    <p className="text-[10px] font-semibold text-gray-400">Monthly or yearly</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Section: About us */}
            <div>
              <p className="text-xs font-black text-[#14171d] px-2 mb-2">About us</p>
              <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm divide-y divide-gray-100">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="py-2.5 flex items-center justify-between text-xs font-bold text-gray-800"
                >
                  <span>Our Instagram</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="py-2.5 flex items-center justify-between text-xs font-bold text-gray-800"
                >
                  <span>Our TikTok</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Section: Support */}
            <div>
              <p className="text-xs font-black text-[#14171d] px-2 mb-2">Support</p>
              <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm divide-y divide-gray-100">
                <button 
                  onClick={() => alert('Subscription status checked.')}
                  className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-gray-800 text-left"
                >
                  <span>Restore subscription</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <a 
                  href="mailto:contact@platevision.ai"
                  className="py-2.5 flex items-center justify-between text-xs font-bold text-gray-800"
                >
                  <span>Support</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
                <a 
                  href="/terms"
                  className="py-2.5 flex items-center justify-between text-xs font-bold text-gray-800"
                >
                  <span>Terms of Use</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
                <a 
                  href="/privacy"
                  className="py-2.5 flex items-center justify-between text-xs font-bold text-gray-800"
                >
                  <span>Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
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
              className="w-full py-3.5 rounded-3xl bg-rose-50 text-rose-600 font-black text-xs hover:bg-rose-100 active:scale-95 transition-all border border-rose-100"
            >
              Sign Out
            </button>

            {/* Version footer */}
            <p className="text-center text-[10px] font-semibold text-gray-400 pt-2">
              version: 1.3.97 (675)
            </p>

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

