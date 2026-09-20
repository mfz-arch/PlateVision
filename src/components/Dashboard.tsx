'use client';

import React, { useState } from 'react';
import { 
  Flame, Dumbbell, Wheat, Droplets, Plus, Sparkles, 
  Clock, TrendingUp, Award, Calendar, ChevronRight
} from 'lucide-react';
import { UserProfile, ScannedMeal } from '../types/plateVision';
import { INITIAL_LOGGED_MEALS } from '../data/mockPlateData';
import { ScannerZone } from './ScannerZone';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  profile: UserProfile;
  onOpenScannerModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  onOpenScannerModal
}) => {
  const { t } = useLanguage();
  const [loggedMeals, setLoggedMeals] = useState<ScannedMeal[]>(INITIAL_LOGGED_MEALS);
  const [waterDrankLiters, setWaterDrankLiters] = useState<number>(1.8);

  const totalCaloriesConsumed = loggedMeals.reduce((acc, m) => acc + m.totalCalories, 0);
  const totalProteinConsumed = loggedMeals.reduce((acc, m) => acc + m.totalProtein, 0);
  const totalCarbsConsumed = loggedMeals.reduce((acc, m) => acc + m.totalCarbs, 0);
  const totalFatsConsumed = loggedMeals.reduce((acc, m) => acc + m.totalFats, 0);

  const calPercentage = Math.min(100, Math.round((totalCaloriesConsumed / profile.dailyCaloriesGoal) * 100));
  const proteinPercentage = Math.min(100, Math.round((totalProteinConsumed / profile.proteinGoalGrams) * 100));
  const carbsPercentage = Math.min(100, Math.round((totalCarbsConsumed / profile.carbsGoalGrams) * 100));

  const handleMealScanned = (newMeal: ScannedMeal) => {
    setLoggedMeals([newMeal, ...loggedMeals]);
  };

  const handleAddWater = () => {
    setWaterDrankLiters((prev) => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  };

  const goalText = profile.goal === 'lose' ? t('dashGoalLoss') : profile.goal === 'gain' ? t('dashGoalGain') : t('dashGoalMaintain');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)]">
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

        <button
          onClick={onOpenScannerModal}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_25px_rgba(182,255,46,0.35)] hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-5 h-5 text-[#14171d]" />
          <span>{t('scanPlateButton')}</span>
        </button>
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
        <ScannerZone onMealScanned={handleMealScanned} />
      </div>

      {/* Logged Meals History Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#b6ff2e]" />
            <span>{t('loggedMealsTitle')}</span>
          </h3>
          <span className="text-xs text-[#9ea3b0] font-semibold">{t('loggedMealsCount', { count: loggedMeals.length })}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loggedMeals.map((meal) => (
            <div 
              key={meal.id}
              className="p-4 glass-card rounded-2xl border border-[rgba(255,255,255,0.08)] flex items-center gap-4 hover:border-[#b6ff2e]/40 transition-all group"
            >
              <img 
                src={meal.imageUrl} 
                alt={meal.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-all"
              />

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#9ea3b0] font-semibold">{meal.timestamp}</span>
                  <span className="text-xs font-extrabold text-[#b6ff2e]">{meal.totalCalories} kcal</span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{meal.title}</h4>
                
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9ea3b0]">
                  <span>{t('proteinsLabel')}: <strong className="text-white">{meal.totalProtein}g</strong></span>
                  <span>{t('carbsLabel')}: <strong className="text-white">{meal.totalCarbs}g</strong></span>
                  <span>{t('fatsLabel')}: <strong className="text-white">{meal.totalFats}g</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
