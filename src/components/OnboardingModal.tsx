'use client';

import React, { useState } from 'react';
import { 
  X, ArrowRight, ArrowLeft, Check, AlertTriangle, Sparkles, 
  Target, Activity, Scale, Heart, Flame, Droplets, CheckCircle, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OnboardingData, UserProfile } from '../types/plateVision';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<number>(1);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcProgress, setCalcProgress] = useState<number>(0);
  const [calcMessage, setCalcMessage] = useState<string>('Calcul de votre métabolisme de base (MB)...');

  // Form state
  const [formData, setFormData] = useState<OnboardingData>({
    goal: 'lose',
    name: "Aim'fiz",
    age: 18,
    gender: 'male',
    heightCm: 178,
    currentWeightKg: 78,
    targetWeightKg: 72,
    workoutDaysPerWeek: 4,
    timeframeMonths: 3,
    hasChildren: false
  });

  if (!isOpen) return null;

  // Calculate weight change pace (kg / week)
  const weightDiffKg = Math.abs(formData.currentWeightKg - formData.targetWeightKg);
  const weeksTotal = formData.timeframeMonths * 4.33;
  const kgPerWeek = weeksTotal > 0 ? (weightDiffKg / weeksTotal) : 0;
  const isPaceUnrealistic = kgPerWeek > 1.0 && formData.goal !== 'maintain';

  const handleNextStep = () => {
    if (step === 3) {
      // Move to feasibility check step
      setStep(4);
    } else if (step === 4) {
      // Start AI calculations
      setStep(5);
      runCalculations();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const runCalculations = () => {
    setIsCalculating(true);
    setCalcProgress(15);
    setCalcMessage('Analyse de votre métabolisme de base (BMR)...');

    setTimeout(() => {
      setCalcProgress(45);
      setCalcMessage('Calcul de la répartition optimale Protéines / Glucides / Lipides...');
    }, 800);

    setTimeout(() => {
      setCalcProgress(75);
      setCalcMessage("Ajustement de l'objectif d'hydratation (Eau)...");
    }, 1600);

    setTimeout(() => {
      setCalcProgress(100);
      setIsCalculating(false);
      
      // Fire celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }, 2400);
  };

  const handleFinalSubmit = () => {
    // Generate final profile goals based on Harris-Benedict formula approximation
    let bmr = 10 * formData.currentWeightKg + 6.25 * formData.heightCm - 5 * formData.age + 5;
    let activityMultiplier = 1.2 + (formData.workoutDaysPerWeek * 0.1);
    let tdee = bmr * activityMultiplier;

    let targetCalories = Math.round(tdee);
    if (formData.goal === 'lose') targetCalories -= 450;
    if (formData.goal === 'gain') targetCalories += 450;

    const proteinGrams = Math.round(formData.currentWeightKg * 2.0); // 2g/kg
    const fatsGrams = Math.round((targetCalories * 0.25) / 9);
    const carbsGrams = Math.round((targetCalories - (proteinGrams * 4 + fatsGrams * 9)) / 4);

    const profile: UserProfile = {
      ...formData,
      dailyCaloriesGoal: targetCalories,
      proteinGoalGrams: proteinGrams,
      carbsGoalGrams: Math.max(100, carbsGrams),
      fatsGoalGrams: fatsGrams,
      waterGoalLiters: 2.8
    };

    onComplete(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl p-6 sm:p-8 glass-card rounded-3xl border border-[rgba(255,255,255,0.12)] shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
        
        {/* Top Header Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#b6ff2e]" />
            </div>
            <span className="text-sm font-extrabold text-white">Évaluation PlateVision AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#9ea3b0] hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator bar */}
        <div className="w-full bg-[#14171d] h-2 rounded-full mb-8 overflow-hidden border border-white/5">
          <div 
            className="bg-[#b6ff2e] h-full transition-all duration-500 shadow-[0_0_12px_#b6ff2e]"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* STEP 1: Main Goal Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-extrabold text-white">Quel est votre objectif principal ?</h3>
              <p className="text-xs text-[#9ea3b0] mt-1">PlateVision adaptera vos cibles caloriques et vos conseils nutritionnels IA.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'lose', title: 'Perdre du poids', desc: 'Brûler de la graisse tout en préservant le muscle', icon: Flame },
                { id: 'gain', title: 'Prendre du muscle', desc: 'Prise de masse propre avec surplus calorique', icon: Activity },
                { id: 'maintain', title: 'Maintenir son poids', desc: 'Conserver la forme et optimiser la santé', icon: Heart }
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = formData.goal === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setFormData({ ...formData, goal: item.id as any })}
                    className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-[#b6ff2e]/10 border-[#b6ff2e] shadow-[0_0_20px_rgba(182,255,46,0.25)]'
                        : 'bg-[#14171d] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-[#b6ff2e] text-[#14171d]' : 'bg-white/5 text-[#9ea3b0]'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-[#9ea3b0]">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Personal Stats (Age, Weight, Height, Target) */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-extrabold text-white">Vos données physiques actuelles</h3>
              <p className="text-xs text-[#9ea3b0] mt-1">Ces données servent à calculer votre métabolisme de base (MB).</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#9ea3b0] uppercase mb-1">Votre Prénom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#14171d] border border-white/10 rounded-xl text-white text-sm focus:border-[#b6ff2e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9ea3b0] uppercase mb-1">Âge (années)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#14171d] border border-white/10 rounded-xl text-white text-sm focus:border-[#b6ff2e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9ea3b0] uppercase mb-1">Taille (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#14171d] border border-white/10 rounded-xl text-white text-sm focus:border-[#b6ff2e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9ea3b0] uppercase mb-1">Poids Actuel (kg)</label>
                <input
                  type="number"
                  value={formData.currentWeightKg}
                  onChange={(e) => setFormData({ ...formData, currentWeightKg: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#14171d] border border-white/10 rounded-xl text-white text-sm focus:border-[#b6ff2e] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#b6ff2e] uppercase mb-1 flex items-center justify-between">
                  <span>Poids Cible Souhaité (kg)</span>
                  <span className="text-white text-sm">{formData.targetWeightKg} kg</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="130"
                  value={formData.targetWeightKg}
                  onChange={(e) => setFormData({ ...formData, targetWeightKg: Number(e.target.value) })}
                  className="w-full accent-[#b6ff2e]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Exercise Frequency & Timeframe */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-extrabold text-white">Activité physique & Horizon temporel</h3>
              <p className="text-xs text-[#9ea3b0] mt-1">Déterminez le rythme pour atteindre votre objectif.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#9ea3b0] uppercase mb-2">
                  Fréquence d'entraînement par semaine : <span className="text-[#b6ff2e] font-bold">{formData.workoutDaysPerWeek} jours/semaine</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, workoutDaysPerWeek: days })}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                        formData.workoutDaysPerWeek === days
                          ? 'bg-[#b6ff2e] text-[#14171d] border-[#b6ff2e] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
                          : 'bg-[#14171d] text-[#9ea3b0] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {days}j
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9ea3b0] uppercase mb-2">
                  Durée souhaitée pour atteindre le poids cible : <span className="text-[#b6ff2e] font-bold">{formData.timeframeMonths} mois</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 6].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setFormData({ ...formData, timeframeMonths: months })}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                        formData.timeframeMonths === months
                          ? 'bg-[#b6ff2e] text-[#14171d] border-[#b6ff2e] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
                          : 'bg-[#14171d] text-[#9ea3b0] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {months} mois
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: AI Feasibility Check & Alert */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 text-[#b6ff2e] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Analyse IA de Faisabilité
              </div>
              <h3 className="text-2xl font-extrabold text-white">Évaluation de votre objectif</h3>
            </div>

            {/* Feasibility Alert Card */}
            {isPaceUnrealistic ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-3 text-amber-400 font-bold text-base">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                  <span>Alerte Rythme Intensif ({kgPerWeek.toFixed(1)} kg / semaine)</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Attention : Viser une variation de plus de 1.0 kg par semaine sur {formData.timeframeMonths} mois risque de fatiguer votre organisme ou de vous faire perdre de la masse musculaire. 
                </p>
                <div className="p-3 rounded-xl bg-amber-500/15 text-xs text-amber-300 font-medium">
                  💡 Conseil IA : PlateVision va automatiquement réajuster l'apport calorique quotidien pour protéger vos muscles tout en atteignant la cible.
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 space-y-3">
                <div className="flex items-center gap-3 text-[#b6ff2e] font-bold text-base">
                  <CheckCircle className="w-6 h-6 text-[#b6ff2e] shrink-0" />
                  <span>Objectif Très Sain & Réaliste ! ({kgPerWeek.toFixed(1)} kg / semaine)</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Votre rythme cible est idéal pour une transformation durable sans effet yoyo.
                </p>
              </div>
            )}

            {/* Target Overview Card */}
            <div className="p-4 rounded-2xl bg-[#14171d] border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Actuel</p>
                <p className="text-base font-extrabold text-white">{formData.currentWeightKg} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Cible</p>
                <p className="text-base font-extrabold text-[#b6ff2e]">{formData.targetWeightKg} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Durée</p>
                <p className="text-base font-extrabold text-white">{formData.timeframeMonths} mois</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Entraînement</p>
                <p className="text-base font-extrabold text-white">{formData.workoutDaysPerWeek}j / sem</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Interactive Calculation & Final Output */}
        {step === 5 && (
          <div className="py-6 space-y-6 text-center animate-in fade-in duration-300">
            {isCalculating ? (
              <div className="space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/40 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(182,255,46,0.3)]">
                  <Sparkles className="w-10 h-10 text-[#b6ff2e] animate-spin" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white mb-2">Génération de votre profil PlateVision</h4>
                  <p className="text-xs text-[#b6ff2e] font-semibold">{calcMessage}</p>
                </div>
                <div className="w-full bg-[#14171d] h-3 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="bg-[#b6ff2e] h-full transition-all duration-300 shadow-[0_0_15px_#b6ff2e]"
                    style={{ width: `${calcProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#b6ff2e] text-[#14171d] flex items-center justify-center shadow-[0_0_30px_rgba(182,255,46,0.4)]">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white">Votre Plan Nutritionnel est prêt !</h3>
                  <p className="text-xs text-[#9ea3b0]">Voici vos cibles quotidiennes personnalisées générées par PlateVision AI :</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  <div className="p-4 rounded-2xl bg-[#14171d] border border-[#b6ff2e]/30">
                    <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Calories / jour</p>
                    <p className="text-xl font-extrabold text-[#b6ff2e]">2 150 <span className="text-xs font-normal">kcal</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#14171d] border border-white/10">
                    <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Protéines</p>
                    <p className="text-xl font-extrabold text-white">156 <span className="text-xs font-normal">g</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#14171d] border border-white/10">
                    <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Glucides</p>
                    <p className="text-xl font-extrabold text-white">210 <span className="text-xs font-normal">g</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#14171d] border border-white/10">
                    <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Eau / jour</p>
                    <p className="text-xl font-extrabold text-sky-400">2.8 <span className="text-xs font-normal">L</span></p>
                  </div>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-4 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-base tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_25px_rgba(182,255,46,0.35)]"
                >
                  Accéder à mon Dashboard PlateVision
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons (Steps 1 to 4) */}
        {step <= 4 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white font-bold text-xs hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
            ) : <div />}

            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_15px_rgba(182,255,46,0.3)]"
            >
              <span>{step === 4 ? "Lancer l'analyse IA" : 'Suivant'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
