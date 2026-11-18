'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  CalendarDays,
  BarChart2,
  User,
  Camera,
  Image as ImageIcon,
  X,
  Trash2,
  Droplets,
  Footprints,
  Download,
  Utensils,
} from 'lucide-react';
import { UserProfile, ScannedMeal } from '../../types/plateVision';
import { toLocalDateStr } from '../../lib/date';
import { useAppTheme } from '../../lib/appTheme';
import { MobileAppScannerModal } from './MobileAppScannerModal';
import { MealDetailModal } from './MealDetailModal';
import { AppLogTab } from './AppLogTab';
import { AppInsightsTab } from './AppInsightsTab';
import { AppProfileTab } from './AppProfileTab';

interface MobileAppDashboardProps {
  profile: UserProfile;
  onSignOut: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
}

type AppTab = 'home' | 'log' | 'insights' | 'profile';

export const MobileAppDashboard: React.FC<MobileAppDashboardProps> = ({
  profile,
  onSignOut,
  onUpdateProfile,
}) => {
  const { mode: themeMode, setMode: setThemeMode, tokens } = useAppTheme();

  // Active Bottom Navigation Tab
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // Unit System (metric / imperial)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_app_units');
      if (saved === 'imperial') return 'imperial';
    }
    return 'metric';
  });

  const handleToggleUnitSystem = () => {
    setUnitSystem((prev) => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      try {
        localStorage.setItem('pv_app_units', next);
      } catch {}
      return next;
    });
  };

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
  const [selectedImageForScan, setSelectedImageForScan] = useState<string | null>(null);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<ScannedMeal | null>(null);
  const [isNutritionReportOpen, setIsNutritionReportOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Hidden native file inputs for Camera and Album
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth = 900): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth || height > maxWidth) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxWidth) / height);
                height = maxWidth;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleImagePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 900);
      if (base64) {
        setSelectedImageForScan(base64);
        setIsActionSheetOpen(false);
        setIsScannerModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to process image file:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Auto-detected meal category by time of day
  const getAutoMealCategory = (): 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    if (hour >= 15 && hour < 18) return 'Snack';
    return 'Dinner';
  };
  const [selectedCategory, setSelectedCategory] = useState<
    'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'
  >(getAutoMealCategory);

  // Local water and steps tracking
  const [waterMl, setWaterMl] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`pv_water_${todayStr}`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [stepsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`pv_steps_${todayStr}`);
      return saved ? parseInt(saved, 10) : 1240;
    }
    return 1240;
  });

  const handleAddWater = () => {
    setWaterMl((prev) => {
      const next = prev + 250;
      try {
        localStorage.setItem(`pv_water_${todayStr}`, next.toString());
      } catch {}
      return next;
    });
  };

  // Weight logging state
  const [currentWeight, setCurrentWeight] = useState<number>(profile.currentWeightKg || 70);
  const [newWeightInput, setNewWeightInput] = useState<string>(
    profile.currentWeightKg?.toString() || '70'
  );

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
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Today's meals for Home tab
  const todaysMeals = useMemo(() => {
    return meals.filter((meal) => {
      if (meal.dateStr) return meal.dateStr === todayStr;
      if (meal.timestamp) {
        const d = new Date(meal.timestamp);
        if (!isNaN(d.getTime())) return toLocalDateStr(d) === todayStr;
      }
      return false;
    });
  }, [meals, todayStr]);

  // Daily Totals for Home tab
  const totalCaloriesEaten = todaysMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const totalProteinEaten = todaysMeals.reduce((sum, m) => sum + (m.totalProtein || 0), 0);
  const totalCarbsEaten = todaysMeals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0);
  const totalFatsEaten = todaysMeals.reduce((sum, m) => sum + (m.totalFats || 0), 0);

  const dailyCalorieTarget = profile.dailyCaloriesGoal || 2100;
  const proteinGoal = profile.proteinGoalGrams || 130;
  const carbsGoal = profile.carbsGoalGrams || 240;
  const fatsGoal = profile.fatsGoalGrams || 70;

  const isOverGoal = totalCaloriesEaten > dailyCalorieTarget;
  const remainingCalories = isOverGoal
    ? totalCaloriesEaten - dailyCalorieTarget
    : dailyCalorieTarget - totalCaloriesEaten;

  // Dynamic Greeting & Date
  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const userInitial = (profile.name || 'A').trim().charAt(0).toUpperCase();

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

  // Helper to reliably retrieve food photo
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

  // Ring geometry
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = Math.min(1, totalCaloriesEaten / Math.max(1, dailyCalorieTarget));

  return (
    <div
      className="min-h-screen font-sans pb-28 transition-colors duration-200"
      style={{ backgroundColor: tokens.bg, color: tokens.ink }}
    >
      {/* MAIN CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* ================================================================= */}
        {/* TAB 1: HOME                                                       */}
        {/* ================================================================= */}
        {activeTab === 'home' && (
          <>
            {/* 1. Greeting Row (Page 4) */}
            <header className="flex items-center justify-between pt-1">
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: tokens.ink }}>
                  {greetingText}, {profile.name?.split(' ')[0] || 'Athlete'}
                </h1>
                <p className="text-xs font-medium mt-0.5" style={{ color: tokens.muted }}>
                  {formattedToday}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                aria-label="Open Profile"
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border transition-transform active:scale-95"
                style={{
                  backgroundColor: tokens.primarySoft,
                  color: tokens.isDark ? tokens.primaryBright : tokens.primary,
                  borderColor: tokens.border,
                }}
              >
                {userInitial}
              </button>
            </header>

            {/* 2. Calorie Ring Card (Page 4) */}
            <section
              className="rounded-[20px] p-5 border flex items-center justify-between gap-4"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            >
              {/* Left: Circular Progress Ring */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                  <circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    stroke={tokens.surfaceMuted}
                    strokeWidth="9"
                    fill="none"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    stroke={isOverGoal ? tokens.fat : tokens.primaryBright}
                    strokeWidth="9"
                    fill="none"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - ringProgress)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span
                    className="text-lg font-bold tabular-nums leading-none"
                    style={{ color: tokens.ink }}
                  >
                    {totalCaloriesEaten.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium mt-1" style={{ color: tokens.muted }}>
                    kcal eaten
                  </span>
                </div>
              </div>

              {/* Right: Remaining Hero Number + Goal + Status Chip */}
              <div className="flex-1 space-y-1.5 text-left pl-2">
                <p className="text-xs font-medium" style={{ color: tokens.muted }}>
                  {isOverGoal ? 'Over goal' : 'Remaining'}
                </p>
                <p
                  className="text-[32px] leading-[38px] font-bold tabular-nums tracking-tight"
                  style={{ color: isOverGoal ? tokens.fat : tokens.ink }}
                >
                  {remainingCalories.toLocaleString()} kcal
                </p>
                <p className="text-xs font-medium tabular-nums" style={{ color: tokens.muted }}>
                  Goal {dailyCalorieTarget.toLocaleString()} kcal
                </p>
                <div className="pt-1">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: isOverGoal
                        ? tokens.isDark
                          ? 'rgba(240,100,106,0.18)'
                          : '#FEE2E2'
                        : tokens.primarySoft,
                      color: isOverGoal
                        ? tokens.fat
                        : tokens.isDark
                        ? tokens.primaryBright
                        : tokens.primary,
                    }}
                  >
                    {isOverGoal ? 'Over' : 'On track'}
                  </span>
                </div>
              </div>
            </section>

            {/* 3. Macro Bars Card (P / C / F with semantic colors & labels) */}
            <section
              className="rounded-[20px] p-5 border space-y-4"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            >
              {[
                {
                  key: 'P',
                  label: 'Protein',
                  eaten: totalProteinEaten,
                  goal: proteinGoal,
                  color: tokens.protein,
                },
                {
                  key: 'C',
                  label: 'Carbs',
                  eaten: totalCarbsEaten,
                  goal: carbsGoal,
                  color: tokens.carbs,
                },
                {
                  key: 'F',
                  label: 'Fat',
                  eaten: totalFatsEaten,
                  goal: fatsGoal,
                  color: tokens.fat,
                },
              ].map((m) => {
                const pct = Math.min(100, (m.eaten / Math.max(1, m.goal)) * 100);
                return (
                  <div key={m.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.key}
                        </span>
                        <span>{m.label}</span>
                      </span>
                      <span className="font-semibold tabular-nums" style={{ color: tokens.muted }}>
                        <strong style={{ color: tokens.ink }}>{m.eaten}</strong> / {m.goal} g
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: tokens.surfaceMuted }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 4. Compact Twin Cards: Water & Steps */}
            <section className="grid grid-cols-2 gap-3">
              <div
                className="rounded-[20px] p-4 border"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold flex items-center gap-1.5"
                    style={{ color: tokens.protein }}
                  >
                    <Droplets className="w-4 h-4" />
                    <span>Water</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddWater}
                    aria-label="Add 250ml water"
                    className="w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center border transition-transform active:scale-90"
                    style={{
                      backgroundColor: tokens.primarySoft,
                      borderColor: tokens.border,
                      color: tokens.isDark ? tokens.primaryBright : tokens.primary,
                    }}
                  >
                    +
                  </button>
                </div>
                <p className="text-lg font-bold tabular-nums mt-1.5">{waterMl} ml</p>
                <p className="text-[11px]" style={{ color: tokens.muted }}>
                  of 2,000 ml
                </p>
              </div>

              <div
                className="rounded-[20px] p-4 border"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <span
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: tokens.primaryBright }}
                >
                  <Footprints className="w-4 h-4" />
                  <span>Steps</span>
                </span>
                <p className="text-lg font-bold tabular-nums mt-2.5">
                  {stepsCount.toLocaleString()}
                </p>
                <p className="text-[11px]" style={{ color: tokens.muted }}>
                  of 8,000 goal
                </p>
              </div>
            </section>

            {/* 5. Today's Meals Section */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h2 className="text-lg font-semibold" style={{ color: tokens.ink }}>
                  Today&apos;s meals
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('log')}
                  className="text-xs font-semibold min-h-[36px] px-1"
                  style={{ color: tokens.isDark ? tokens.primaryBright : tokens.primary }}
                >
                  See all
                </button>
              </div>

              {/* Skeleton Placeholders while Loading (Page 9) */}
              {isLoadingMeals ? (
                <div className="space-y-2.5">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="rounded-[20px] p-3.5 border flex items-center gap-3 animate-pulse"
                      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                    >
                      <div
                        className="w-12 h-12 rounded-[14px]"
                        style={{ backgroundColor: tokens.surfaceMuted }}
                      />
                      <div className="flex-1 space-y-2">
                        <div
                          className="h-3.5 w-2/3 rounded"
                          style={{ backgroundColor: tokens.surfaceMuted }}
                        />
                        <div
                          className="h-3 w-1/3 rounded"
                          style={{ backgroundColor: tokens.surfaceMuted }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : todaysMeals.length === 0 ? (
                /* Empty State (Page 9) */
                <div
                  className="rounded-[20px] p-7 border text-center space-y-3"
                  style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                >
                  <div
                    className="w-12 h-12 rounded-full border-2 border-dashed mx-auto flex items-center justify-center"
                    style={{ borderColor: tokens.primaryBright, color: tokens.primaryBright }}
                  >
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">No meals logged today</p>
                    <p className="text-xs" style={{ color: tokens.muted }}>
                      Snap a photo of your plate to see calories and macros in seconds.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenActionSheet()}
                    className="px-5 py-3 rounded-[14px] text-white text-xs font-semibold min-h-[44px]"
                    style={{ backgroundColor: tokens.primary }}
                  >
                    Scan your first meal
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todaysMeals.map((meal, index) => {
                    const mealId = (meal as any)._id || meal.id || `home-meal-${index}`;
                    const photo = getMealPhoto(meal);
                    return (
                      <div
                        key={mealId}
                        onClick={() => setSelectedMealForDetail(meal)}
                        className="rounded-[20px] p-3 border flex items-center gap-3 cursor-pointer transition-transform active:scale-[0.99]"
                        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                      >
                        <div
                          className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 flex items-center justify-center border"
                          style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt={meal.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Utensils className="w-5 h-5" style={{ color: tokens.muted }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{meal.title}</h3>
                          <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                            {(meal as any).category || 'Meal'}
                            {meal.timestamp ? ` · ${meal.timestamp}` : ''}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold tabular-nums">
                            {meal.totalCalories} kcal
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(mealId);
                          }}
                          aria-label="Delete meal"
                          className="p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"
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
          </>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LOG                                                        */}
        {/* ================================================================= */}
        {activeTab === 'log' && (
          <AppLogTab
            tokens={tokens}
            meals={meals}
            selectedDateStr={selectedDateStr}
            onSelectDate={setSelectedDateStr}
            dailyCalorieTarget={dailyCalorieTarget}
            onOpenMealDetail={(meal) => setSelectedMealForDetail(meal)}
            onDeleteMeal={handleDeleteMeal}
            onAddMealForCategory={(cat) => handleOpenActionSheet(cat)}
            getMealPhoto={getMealPhoto}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 3: INSIGHTS                                                   */}
        {/* ================================================================= */}
        {activeTab === 'insights' && (
          <AppInsightsTab
            tokens={tokens}
            meals={meals}
            dailyCalorieTarget={dailyCalorieTarget}
            currentWeight={currentWeight}
            targetWeight={profile.targetWeightKg || 65}
            unitSystem={unitSystem}
            onOpenWeightModal={() => setIsWeightModalOpen(true)}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 4: PROFILE                                                    */}
        {/* ================================================================= */}
        {activeTab === 'profile' && (
          <AppProfileTab
            tokens={tokens}
            profile={profile}
            themeMode={themeMode}
            onChangeThemeMode={setThemeMode}
            unitSystem={unitSystem}
            onToggleUnitSystem={handleToggleUnitSystem}
            onOpenNutritionReport={() => setIsNutritionReportOpen(true)}
            onUpdateProfile={onUpdateProfile}
            onSignOut={onSignOut}
          />
        )}
      </main>

      {/* =================================================================== */}
      {/* 4-TAB BOTTOM NAVIGATION + RAISED CENTER SCAN BUTTON (Pages 1, 4)    */}
      {/* =================================================================== */}
      <nav
        aria-label="App Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md"
        style={{
          backgroundColor: tokens.isDark ? 'rgba(22,32,27,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: tokens.border,
        }}
      >
        <div className="max-w-md mx-auto px-2 h-16 grid grid-cols-5 items-center relative">
          {/* Home */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
            style={{
              color:
                activeTab === 'home'
                  ? tokens.isDark
                    ? tokens.primaryBright
                    : tokens.primary
                  : tokens.muted,
            }}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Home</span>
          </button>

          {/* Log */}
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
            style={{
              color:
                activeTab === 'log'
                  ? tokens.isDark
                    ? tokens.primaryBright
                    : tokens.primary
                  : tokens.muted,
            }}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Log</span>
          </button>

          {/* Raised Center Scan Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleOpenActionSheet()}
              aria-label="Scan Meal"
              className="-mt-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg border-4 transition-transform active:scale-90"
              style={{
                backgroundColor: tokens.primary,
                borderColor: tokens.bg,
              }}
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          {/* Insights */}
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
            style={{
              color:
                activeTab === 'insights'
                  ? tokens.isDark
                    ? tokens.primaryBright
                    : tokens.primary
                  : tokens.muted,
            }}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Insights</span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
            style={{
              color:
                activeTab === 'profile'
                  ? tokens.isDark
                    ? tokens.primaryBright
                    : tokens.primary
                  : tokens.muted,
            }}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Profile</span>
          </button>
        </div>
      </nav>

      {/* =================================================================== */}
      {/* CAMERA / ALBUM ACTION SHEET (Bright, clean, Camera & Album only)     */}
      {/* =================================================================== */}
      {isActionSheetOpen && (
        <div
          onClick={() => setIsActionSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[28px] p-6 shadow-2xl border-t animate-in slide-in-from-bottom duration-200"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.ink,
            }}
          >
            <div
              className="w-10 h-1 rounded-full mx-auto mb-5"
              style={{ backgroundColor: tokens.border }}
            />

            {/* Meal Type Segmented Pills */}
            <div
              className="grid grid-cols-4 gap-1 p-1 rounded-full border mb-5"
              style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
            >
              {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className="py-2 rounded-full text-xs font-semibold transition-all min-h-[38px]"
                    style={{
                      backgroundColor: active ? tokens.primary : 'transparent',
                      color: active ? '#FFFFFF' : tokens.muted,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImagePicked}
            />
            <input
              ref={albumInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePicked}
            />

            <div className="divide-y" style={{ borderColor: tokens.border }}>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 flex items-center gap-4 text-left min-h-[64px]"
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center border"
                  style={{
                    backgroundColor: tokens.primarySoft,
                    borderColor: tokens.border,
                    color: tokens.isDark ? tokens.primaryBright : tokens.primary,
                  }}
                >
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Camera</p>
                  <p className="text-xs" style={{ color: tokens.muted }}>
                    Take a photo of your meal directly
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => albumInputRef.current?.click()}
                className="w-full py-4 flex items-center gap-4 text-left min-h-[64px]"
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center border"
                  style={{
                    backgroundColor: tokens.primarySoft,
                    borderColor: tokens.border,
                    color: tokens.isDark ? tokens.primaryBright : tokens.primary,
                  }}
                >
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Album</p>
                  <p className="text-xs" style={{ color: tokens.muted }}>
                    Choose meal picture from gallery
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsActionSheetOpen(false)}
              className="mt-4 w-full py-3.5 rounded-[14px] text-xs font-semibold min-h-[48px]"
              style={{ backgroundColor: tokens.surfaceMuted, color: tokens.ink }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SCANNER MODAL (Analyzing + Review + Edit Bottom Sheet)              */}
      {/* =================================================================== */}
      <MobileAppScannerModal
        isOpen={isScannerModalOpen && !!selectedImageForScan}
        onClose={() => {
          setIsScannerModalOpen(false);
          setSelectedImageForScan(null);
        }}
        initialImageBase64={selectedImageForScan}
        category={selectedCategory}
        targetDateStr={activeTab === 'log' ? selectedDateStr : todayStr}
        onMealSaved={() => {
          setMealsRefreshKey((k) => k + 1);
          setIsScannerModalOpen(false);
          setSelectedImageForScan(null);
        }}
        onRetakePhoto={() => {
          albumInputRef.current?.click();
        }}
        tokens={tokens}
      />

      {/* =================================================================== */}
      {/* MEAL DETAIL MODAL (Macros + AI Tips)                                */}
      {/* =================================================================== */}
      <MealDetailModal
        isOpen={selectedMealForDetail !== null}
        meal={selectedMealForDetail}
        onClose={() => setSelectedMealForDetail(null)}
        onDelete={(id) => {
          handleDeleteMeal(id);
          setSelectedMealForDetail(null);
        }}
        tokens={tokens}
      />

      {/* =================================================================== */}
      {/* NUTRITION REPORT MODAL                                              */}
      {/* =================================================================== */}
      {isNutritionReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div
            className="w-full max-w-md rounded-t-[28px] p-6 shadow-2xl space-y-4 border-t"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.ink,
            }}
          >
            <div
              className="w-10 h-1 rounded-full mx-auto"
              style={{ backgroundColor: tokens.border }}
            />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Nutrition Report</h3>
                <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                  Summary of calories, macros, weight, and meal diary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNutritionReportOpen(false)}
                className="p-2"
                style={{ color: tokens.muted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {[
                { title: 'Last 7 days', dates: 'Recent 7-day breakdown' },
                { title: 'Previous week', dates: 'Full week review' },
                { title: 'Last 2 weeks', dates: '14-day progress report' },
                { title: 'Last 30 days', dates: 'Monthly deep dive' },
              ].map((opt) => (
                <button
                  key={opt.title}
                  type="button"
                  onClick={() => {
                    alert(`Nutrition Report for "${opt.title}" generated!`);
                    setIsNutritionReportOpen(false);
                  }}
                  className="w-full p-4 rounded-[16px] border flex items-center justify-between text-left min-h-[56px]"
                  style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
                >
                  <div>
                    <p className="text-sm font-semibold">{opt.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: tokens.muted }}>
                      {opt.dates}
                    </p>
                  </div>
                  <Download className="w-4 h-4" style={{ color: tokens.muted }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsNutritionReportOpen(false)}
              className="w-full py-3.5 rounded-[14px] text-xs font-semibold min-h-[48px]"
              style={{ backgroundColor: tokens.surfaceMuted, color: tokens.ink }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LOG WEIGHT MODAL                                                    */}
      {/* =================================================================== */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 text-center space-y-4 shadow-2xl border"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.ink,
            }}
          >
            <h3 className="text-lg font-bold">Log your weight</h3>
            <p className="text-xs" style={{ color: tokens.muted }}>
              Track your daily progress towards your goal
            </p>

            <div className="flex items-center justify-center gap-2 py-4">
              <input
                type="number"
                step="0.1"
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                className="w-28 text-3xl font-bold text-center border-b-2 focus:outline-none bg-transparent tabular-nums"
                style={{ borderColor: tokens.primaryBright, color: tokens.ink }}
              />
              <span className="text-base font-semibold" style={{ color: tokens.muted }}>
                kg
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsWeightModalOpen(false)}
                className="flex-1 py-3.5 rounded-[14px] text-xs font-semibold min-h-[48px]"
                style={{ backgroundColor: tokens.surfaceMuted, color: tokens.ink }}
              >
                Cancel
              </button>
              <button
                type="button"
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
                className="flex-1 py-3.5 rounded-[14px] text-white text-xs font-semibold min-h-[48px]"
                style={{ backgroundColor: tokens.primary }}
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
