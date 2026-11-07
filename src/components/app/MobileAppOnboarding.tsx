'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Check, Star, Shield, Flame, 
  Sparkles, Award, Lock, User, Eye, EyeOff, Dumbbell, Heart
} from 'lucide-react';
import { OnboardingData, UserProfile } from '../../types/plateVision';

interface MobileAppOnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onOpenSignIn: () => void;
}

export const MobileAppOnboarding: React.FC<MobileAppOnboardingProps> = ({
  onComplete,
  onOpenSignIn
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 18;

  // Onboarding Form Data - starts completely clean without preselection
  const [formData, setFormData] = useState<OnboardingData>({
    goal: '' as any,
    name: 'Athlete',
    email: '',
    password: '',
    age: 22,
    gender: '' as any,
    heightCm: 175,
    currentWeightKg: 60,
    targetWeightKg: 64,
    workoutDaysPerWeek: 0,
    timeframeMonths: 3,
    acceptedTerms: true
  });

  // Secondary selections - initialized EMPTY so the user makes their own choices
  const [selectedGoalKey, setSelectedGoalKey] = useState<string>('');
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [currentProgressState, setCurrentProgressState] = useState<string>('');
  const [secondaryMotivations, setSecondaryMotivations] = useState<string[]>([]);
  const [specialOccasion, setSpecialOccasion] = useState<string>('');
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [selectedActivityDays, setSelectedActivityDays] = useState<number | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | ''>('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [feetInput, setFeetInput] = useState<number>(5);
  const [inchesInput, setInchesInput] = useState<number>(9);
  const [streakCommitment, setStreakCommitment] = useState<number>(30);

  // String input states to allow smooth typing & backspacing without snapping
  const [ageInput, setAgeInput] = useState<string>('22');
  const [heightInput, setHeightInput] = useState<string>('175');
  const [currentWeightInput, setCurrentWeightInput] = useState<string>('60');

  const adjustAge = (delta: number) => {
    setFormData((prev) => {
      const next = Math.max(14, Math.min(100, prev.age + delta));
      setAgeInput(next.toString());
      return { ...prev, age: next };
    });
  };

  const adjustHeight = (delta: number) => {
    setFormData((prev) => {
      const next = Math.max(100, Math.min(230, prev.heightCm + delta));
      setHeightInput(next.toString());
      return { ...prev, heightCm: next };
    });
  };

  const adjustCurrentWeight = (delta: number) => {
    setFormData((prev) => {
      const next = Math.max(30, Math.min(250, Math.round((prev.currentWeightKg + delta) * 10) / 10));
      setCurrentWeightInput(next.toString());
      return { ...prev, currentWeightKg: next };
    });
  };

  const adjustTargetWeight = (delta: number) => {
    setFormData((prev) => {
      const next = Math.max(30, Math.min(250, Math.round((prev.targetWeightKg + delta) * 10) / 10));
      return { ...prev, targetWeightKg: next };
    });
  };

  // AI Calculation loader animation
  const [calcPercent, setCalcPercent] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Progress Bar Width
  const progressPercent = Math.min(100, Math.round((step / totalSteps) * 100));

  // Dynamic calculations
  const weightDiff = Math.abs(formData.targetWeightKg - formData.currentWeightKg);
  const weightDiffPercent = Math.round((weightDiff / (formData.currentWeightKg || 1)) * 100);
  const goalBadge = weightDiffPercent > 18 ? 'Challenging' : weightDiffPercent > 6 ? 'Ambitious' : 'Realistic';

  // BMI Calculation
  const heightM = formData.heightCm / 100;
  const bmi = heightM > 0 ? (formData.currentWeightKg / (heightM * heightM)).toFixed(1) : '21.0';

  // Target Date projection
  const estimatedWeeks = Math.max(4, Math.round(weightDiff / 0.8));
  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + estimatedWeeks * 7);
  const targetDateFormatted = targetDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Handle next / prev step
  const handleNext = () => {
    setAuthError(null);
    if (step === 14) {
      // Run AI calculation loader
      setStep(15);
      runLoader();
    } else {
      setStep((prev) => Math.min(totalSteps, prev + 1));
    }
  };

  const handleBack = () => {
    setAuthError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const runLoader = () => {
    setCalcPercent(10);
    const interval = setInterval(() => {
      setCalcPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(16), 600);
          return 100;
        }
        return prev + 15;
      });
    }, 280);
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    if (!formData.email || !formData.password) {
      setAuthError('Please enter your email and password to access your dashboard.');
      return;
    }
    if (formData.password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    // Mifflin-St Jeor formula
    const isMale = formData.gender === 'male';
    const bmr = 10 * formData.currentWeightKg + 6.25 * formData.heightCm - 5 * formData.age + (isMale ? 5 : -161);
    const activityMultiplier = 1.2 + (formData.workoutDaysPerWeek * 0.1);
    let tdee = Math.round(bmr * activityMultiplier);

    if (formData.goal === 'lose') tdee -= 400;
    if (formData.goal === 'gain') tdee += 450;

    const protein = Math.round(formData.currentWeightKg * 2.0);
    const fats = Math.round((tdee * 0.25) / 9);
    const carbs = Math.max(100, Math.round((tdee - (protein * 4 + fats * 9)) / 4));

    const finalProfile: UserProfile = {
      ...formData,
      dailyCaloriesGoal: tdee,
      proteinGoalGrams: protein,
      fatsGoalGrams: fats,
      carbsGoalGrams: carbs,
      waterGoalLiters: 2.0
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || 'PlateVision Athlete',
          email: formData.email,
          password: formData.password,
          acceptedTerms: true,
          termsAccepted: true,
          onboarding: {
            ...finalProfile,
            acceptedTerms: true
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      onComplete(data.user || finalProfile);
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#14171d] font-sans flex flex-col justify-between selection:bg-[#b6ff2e] selection:text-[#14171d]">
      
      {/* Top Header / Progress Bar */}
      {step > 1 && (
        <div className="w-full max-w-md mx-auto px-4 pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              aria-label="Previous step"
              className="p-2 -ml-2 text-gray-500 hover:text-black active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#84cc16] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="w-5" />
          </div>
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="flex-1 w-full max-w-md mx-auto px-5 py-6 flex flex-col justify-center">

        {/* ============================================================== */}
        {/* STEP 1: WELCOME HERO (Screenshot 1)                           */}
        {/* ============================================================== */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-in fade-in duration-300">
            {/* Food Bowl with Visual AI Brackets and Floating Tags */}
            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden shadow-2xl border-4 border-white p-1 bg-gray-50">
              <img 
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80" 
                alt="Nutritious Food Bowl" 
                className="w-full h-full object-cover rounded-full"
              />
              
              {/* Floating Macro Tags */}
              <div className="absolute top-4 left-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-gray-100 text-left">
                <p className="text-[9px] font-bold text-gray-400">Protein</p>
                <p className="text-xs font-black text-gray-900">37 g</p>
              </div>

              <div className="absolute top-8 right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-gray-100 text-left">
                <p className="text-[9px] font-bold text-gray-400">Carbs</p>
                <p className="text-xs font-black text-gray-900">32 g</p>
              </div>

              <div className="absolute bottom-12 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-gray-100 text-left">
                <p className="text-[9px] font-bold text-gray-400">Fats</p>
                <p className="text-xs font-black text-gray-900">23 g</p>
              </div>

              <div className="absolute bottom-6 right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-gray-100 text-left">
                <p className="text-[9px] font-bold text-gray-400">Calories</p>
                <p className="text-xs font-black text-[#65a30d]">490 kcal</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#14171d] leading-tight tracking-tight">
                Health starts with a personal plan
              </h1>
              <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                Build yours — around your goal and your life
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#14171d] font-black text-base shadow-[0_4px_20px_rgba(182,255,46,0.35)] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Build my plan</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                onClick={onOpenSignIn}
                className="text-xs font-bold text-gray-500 hover:text-black underline underline-offset-4 py-1"
              >
                Already have an account?
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: SOCIAL PROOF (Screenshot 2)                           */}
        {/* ============================================================== */}
        {step === 2 && (
          <div className="text-center space-y-6 animate-in fade-in duration-300">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trusted by</p>
            
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-[#14171d]">3 million+</h2>
              <p className="text-sm font-semibold text-gray-500 mt-1">users worldwide</p>
            </div>

            <div className="flex flex-col items-center gap-1.5 py-4">
              <span className="text-3xl font-black text-gray-900">4.8</span>
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs font-bold text-gray-400">190K+ ratings</p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-left space-y-2">
              <p className="text-sm italic font-medium text-gray-800 leading-relaxed">
                &ldquo;PlateVision AI showed me I was eating 700 calories more than I thought. That one visual insight changed everything.&rdquo;
              </p>
              <p className="text-xs font-bold text-gray-400">— Anna K. • @anna_fitlife</p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[#b6ff2e] text-[#14171d] font-black text-sm shadow-md active:scale-98 transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* STEP 3: MAIN GOAL (Screenshot 3)                              */}
        {/* ============================================================== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">What is your main goal?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">This helps us create a plan that fits your lifestyle and keeps you on track.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'lose', label: 'Lose weight' },
                { key: 'maintain', label: 'Maintain weight' },
                { key: 'gain', label: 'Gain weight' },
                { key: 'muscle', label: 'Build muscle' }
              ].map((opt) => {
                const isSelected = selectedGoalKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedGoalKey(opt.key);
                      setFormData((prev) => ({ ...prev, goal: (opt.key === 'muscle' ? 'gain' : opt.key) as any }));
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left font-black text-sm transition-all border-2 ${
                      isSelected
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#0f172a] bg-[#0f172a] text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedGoalKey}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm shadow-[0_4px_16px_rgba(182,255,46,0.3)] active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: OBSTACLES (Screenshot 4)                              */}
        {/* ============================================================== */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">What gets in the way?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Pick everything that applies. We&apos;ll factor it into your plan.</p>
            </div>

            <div className="space-y-2.5">
              {[
                'Forgetting to eat',
                'Low appetite',
                'Not enough protein',
                'No time to cook',
                'Starting and quitting',
                'Not sure how much I eat'
              ].map((item) => {
                const isChecked = obstacles.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setObstacles((prev) => 
                        isChecked ? prev.filter((x) => x !== item) : [...prev, item]
                      );
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left font-black text-xs transition-all border-2 ${
                      isChecked
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{item}</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={obstacles.length === 0}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 5: HOW'S IT GOING? (Screenshot 5)                        */}
        {/* ============================================================== */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">How is your progress going?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Where are you starting from right now?</p>
            </div>

            <div className="space-y-3">
              {[
                'Barely moving',
                'Up and down',
                'Just getting started',
                'Not tracking it'
              ].map((opt) => {
                const isSelected = currentProgressState === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCurrentProgressState(opt)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left font-black text-sm transition-all border-2 ${
                      isSelected
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{opt}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#0f172a] bg-[#0f172a] text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!currentProgressState}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 6: WHAT ELSE MATTERS? (Screenshot 7)                     */}
        {/* ============================================================== */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">What else matters to you?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Check everything that sounds like you.</p>
            </div>

            <div className="space-y-2.5">
              {[
                'Have more energy every day',
                "Know what I'm actually eating",
                'Keep my blood sugar and cholesterol in check',
                'Sleep better and wake up rested',
                'Stop eating when I am stressed',
                'Fit into the clothes I love'
              ].map((item) => {
                const isChecked = secondaryMotivations.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSecondaryMotivations((prev) =>
                        isChecked ? prev.filter((x) => x !== item) : [...prev, item]
                      );
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left font-black text-xs transition-all border-2 ${
                      isChecked
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{item}</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={secondaryMotivations.length === 0}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 7: SPECIAL OCCASION (Screenshot 11)                      */}
        {/* ============================================================== */}
        {step === 7 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Getting ready for something?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">We&apos;ll help you look and feel your best by the big day.</p>
            </div>

            <div className="space-y-2.5">
              {[
                { icon: '✨', label: 'No specific event' },
                { icon: '🏝️', label: 'Vacation' },
                { icon: '💍', label: 'Wedding' },
                { icon: '⚽', label: 'Sports competition' },
                { icon: '☀️', label: 'Summer' },
                { icon: '🎂', label: 'Birthday' }
              ].map((item) => {
                const isSelected = specialOccasion === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSpecialOccasion(item.label)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left font-black text-xs transition-all border-2 ${
                      isSelected
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#0f172a] bg-[#0f172a] text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!specialOccasion}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 8: DO YOU HAVE CHILDREN? (Screenshot 2)                   */}
        {/* ============================================================== */}
        {step === 8 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Do you have children?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Studies show parents often put their own nutrition last</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={() => setHasChildren(true)}
                className={`py-8 rounded-3xl text-center font-black text-base transition-all border-2 shadow-sm ${
                  hasChildren === true
                    ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() => setHasChildren(false)}
                className={`py-8 rounded-3xl text-center font-black text-base transition-all border-2 shadow-sm ${
                  hasChildren === false
                    ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                No
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={hasChildren === null}
              className="w-full mt-4 py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 9: THANK YOU FOR TRUSTING US (Screenshot 3)               */}
        {/* ============================================================== */}
        {step === 9 && (
          <div className="space-y-6 text-center animate-in fade-in duration-300 pt-4">
            <div className="w-16 h-16 rounded-full bg-[#b6ff2e]/20 mx-auto flex items-center justify-center border-2 border-[#b6ff2e]/40">
              <Heart className="w-8 h-8 fill-[#84cc16] text-[#84cc16]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Thank you for trusting us</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">Now let&apos;s personalize PlateVision for you</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/90 shadow-sm space-y-2 text-center max-w-sm mx-auto">
              <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-800 mb-2 border border-slate-200">
                <Lock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-black text-[#0f172a]">Your privacy and security matter to us</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We promise to always keep your personal information private and secure
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 10: ACTIVITY LEVEL (Screenshot 12)                        */}
        {/* ============================================================== */}
        {step === 10 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">How active are you?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Your daily activity level helps us calculate your calorie needs accurately.</p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Sedentary', sub: 'Little to no exercise', days: 1 },
                { title: 'Lightly active', sub: 'Light exercise 1-2 times a week', days: 2 },
                { title: 'Moderately active', sub: 'Exercise 3-4 times a week', days: 4 },
                { title: 'Very active', sub: 'Intense exercise 5+ times a week', days: 6 }
              ].map((item) => {
                const isSelected = selectedActivityDays === item.days;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setSelectedActivityDays(item.days);
                      setFormData((prev) => ({ ...prev, workoutDaysPerWeek: item.days }));
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left border-2 transition-all ${
                      isSelected
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black text-[#0f172a]">{item.title}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.sub}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#0f172a] bg-[#0f172a] text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedActivityDays === null}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 11: GENDER (Screenshot 16)                                */}
        {/* ============================================================== */}
        {step === 11 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Choose your gender</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Men and women burn calories differently — we&apos;ll adjust for that.</p>
            </div>

            <div className="space-y-3">
              {(['male', 'female'] as const).map((g) => {
                const isSelected = selectedGender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setSelectedGender(g);
                      setFormData((prev) => ({ ...prev, gender: g }));
                    }}
                    className={`w-full py-5 px-6 rounded-2xl flex items-center justify-between font-black text-sm capitalize transition-all border-2 ${
                      isSelected
                        ? 'border-[#0f172a] bg-slate-50 text-[#0f172a] ring-2 ring-[#b6ff2e]/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{g === 'male' ? 'Male' : 'Female'}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#0f172a] bg-[#0f172a] text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedGender}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 12: AGE, HEIGHT, WEIGHT (Screenshots 15, 17, 18)          */}
        {/* ============================================================== */}
        {step === 12 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Your body measurements</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Used to compute your baseline metabolism (BMR).</p>
            </div>

            {/* Age Card with Steppers & Free Text Input */}
            <div className="bg-slate-50 rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm focus-within:border-[#0f172a] transition-all">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Age</label>
                <span className="text-xs font-bold text-slate-400">years old</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  type="number"
                  inputMode="numeric"
                  value={ageInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAgeInput(val);
                    const n = parseInt(val, 10);
                    if (!isNaN(n) && n > 0 && n < 120) {
                      setFormData((prev) => ({ ...prev, age: n }));
                    }
                  }}
                  className="w-full text-3xl font-black text-[#0f172a] bg-transparent outline-none"
                  placeholder="22"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustAge(-1)}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center active:scale-90 shadow-sm transition-all"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAge(+1)}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center active:scale-90 shadow-sm transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Height Card with cm / ft toggle, Steppers & Free Text Input */}
            <div className="bg-slate-50 rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm focus-within:border-[#0f172a] transition-all">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Height</label>
                <div className="flex bg-slate-200 p-0.5 rounded-lg text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={`px-2.5 py-1 rounded-md transition-all ${heightUnit === 'cm' ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm' : 'text-slate-600'}`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft')}
                    className={`px-2.5 py-1 rounded-md transition-all ${heightUnit === 'ft' ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm' : 'text-slate-600'}`}
                  >
                    ft/in
                  </button>
                </div>
              </div>

              {heightUnit === 'cm' ? (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-baseline gap-1.5 w-full">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={heightInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHeightInput(val);
                        const n = parseInt(val, 10);
                        if (!isNaN(n) && n > 0 && n < 300) {
                          setFormData((prev) => ({ ...prev, heightCm: n }));
                        }
                      }}
                      className="w-full text-3xl font-black text-[#0f172a] bg-transparent outline-none"
                      placeholder="175"
                    />
                    <span className="text-sm font-black text-slate-400">cm</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => adjustHeight(-1)}
                      className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center active:scale-90 shadow-sm transition-all"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustHeight(+1)}
                      className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center active:scale-90 shadow-sm transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={feetInput}
                      onChange={(e) => {
                        const ft = parseInt(e.target.value) || 0;
                        setFeetInput(ft);
                        setFormData((prev) => ({ ...prev, heightCm: Math.round(ft * 30.48 + inchesInput * 2.54) }));
                        setHeightInput(Math.round(ft * 30.48 + inchesInput * 2.54).toString());
                      }}
                      className="w-16 text-3xl font-black text-[#0f172a] bg-transparent outline-none"
                    />
                    <span className="text-sm font-black text-slate-400">ft</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={inchesInput}
                      onChange={(e) => {
                        const inc = parseInt(e.target.value) || 0;
                        setInchesInput(inc);
                        setFormData((prev) => ({ ...prev, heightCm: Math.round(feetInput * 30.48 + inc * 2.54) }));
                        setHeightInput(Math.round(feetInput * 30.48 + inc * 2.54).toString());
                      }}
                      className="w-16 text-3xl font-black text-[#0f172a] bg-transparent outline-none"
                    />
                    <span className="text-sm font-black text-slate-400">in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Weight Card with Steppers & Free Text Input */}
            <div className="bg-slate-50 rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm focus-within:border-[#0f172a] transition-all">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Current weight</label>
                <span className="text-xs font-bold text-slate-400">kg</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-baseline gap-1.5 w-full">
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={currentWeightInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentWeightInput(val);
                      const n = parseFloat(val);
                      if (!isNaN(n) && n > 0 && n < 400) {
                        setFormData((prev) => ({ ...prev, currentWeightKg: n }));
                      }
                    }}
                    className="w-full text-3xl font-black text-[#0f172a] bg-transparent outline-none"
                    placeholder="60"
                  />
                  <span className="text-sm font-black text-slate-400">kg</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustCurrentWeight(-0.5)}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center active:scale-90 shadow-sm transition-all"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustCurrentWeight(+0.5)}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center active:scale-90 shadow-sm transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)]"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 13: SET YOUR GOAL WEIGHT (Interactive Wheel & Stepper)   */}
        {/* ============================================================== */}
        {step === 13 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Set your goal weight</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">This will help us customize your plan to reach it.</p>
            </div>

            {/* Interactive Hero Weight Selector */}
            <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-200/90 shadow-sm space-y-5">
              
              {/* Stepper + Big Center Number */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => adjustTargetWeight(-1)}
                  aria-label="Decrease target weight"
                  className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 text-3xl font-black flex items-center justify-center active:scale-90 shadow-sm transition-all"
                >
                  -
                </button>
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-5xl font-black text-[#0f172a] tracking-tight">
                      {formData.targetWeightKg}
                    </span>
                    <span className="text-lg font-black text-slate-400">kg</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">Target Weight</p>
                </div>
                <button
                  type="button"
                  onClick={() => adjustTargetWeight(+1)}
                  aria-label="Increase target weight"
                  className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 text-3xl font-black flex items-center justify-center active:scale-90 shadow-sm transition-all"
                >
                  +
                </button>
              </div>

              {/* Smooth interactive range slider */}
              <div className="space-y-1.5 pt-2">
                <input
                  type="range"
                  min={35}
                  max={160}
                  step={0.5}
                  value={formData.targetWeightKg}
                  onChange={(e) => setFormData({ ...formData, targetWeightKg: parseFloat(e.target.value) })}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0f172a]"
                />
                <div className="flex justify-between text-[11px] font-extrabold text-slate-400 px-1">
                  <span>35 kg</span>
                  <span>Current: {formData.currentWeightKg} kg</span>
                  <span>160 kg</span>
                </div>
              </div>

              {/* Quick weight offsets roller chips */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                  const val = Math.round(formData.targetWeightKg + offset);
                  const isCenter = offset === 0;
                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetWeightKg: val })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isCenter
                          ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm scale-105 border-2 border-[#0f172a]'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {val} kg
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Weight difference & Badge card */}
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-[#0f172a]">
                  {formData.targetWeightKg >= formData.currentWeightKg ? 'Weight gain' : 'Weight loss'}:{' '}
                  <span className="text-[#fe7258]">{weightDiffPercent}%</span>
                </p>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  goalBadge === 'Realistic' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : goalBadge === 'Ambitious' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-[#ffefe8] text-[#fe7258] border border-[#ffded4]'
                }`}>
                  {goalBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {goalBadge === 'Challenging' 
                  ? 'A demanding goal recommended with steady pacing and proper hydration.' 
                  : goalBadge === 'Ambitious' 
                  ? 'Requires consistent effort and works best with guided macro tracking.' 
                  : 'A safe and achievable goal with high probability of lasting success.'}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm active:scale-98 transition-all shadow-[0_4px_16px_rgba(182,255,46,0.3)]"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 14: BASELINE BMI GAUGE (Screenshot 20)                    */}
        {/* ============================================================== */}
        {step === 14 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-black text-[#14171d]">Here is your baseline</h2>
              <p className="text-xs text-gray-500 mt-1">Based on standard scientific reference data.</p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-gray-800">Body Mass Index (BMI)</span>
                <span className="px-3 py-1 rounded-full bg-[#b6ff2e] text-black font-black text-sm">
                  {bmi}
                </span>
              </div>

              {/* Colored Slider Track */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-sky-400 via-[#b6ff2e] via-amber-400 to-rose-500 relative">
                  <div 
                    className="w-4 h-4 rounded-full bg-white border-2 border-gray-900 shadow absolute -top-0.5 -translate-x-1/2 transition-all"
                    style={{ left: `${Math.min(95, Math.max(5, ((parseFloat(bmi) - 15) / 25) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40</span>
                </div>
              </div>

              {/* Baseline advice summary */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-xs font-semibold text-gray-600 leading-relaxed">
                {parseFloat(bmi) < 18.5 && 'Your baseline BMI suggests a light weight. A calorie surplus with ample protein will fuel healthy muscle growth.'}
                {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 && 'Your baseline BMI is within the healthy zone. Focus on balanced macros to fine-tune your body composition.'}
                {parseFloat(bmi) >= 25 && 'Your baseline indicates an opportunity for progressive fat loss with sustained daily calorie management.'}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[#b6ff2e] text-[#14171d] font-black text-sm active:scale-98 transition-all shadow-md"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 15: ANIMATED AI PLAN LOADER (Screenshots 37 & 38)         */}
        {/* ============================================================== */}
        {step === 15 && (
          <div className="text-center space-y-6 animate-in fade-in duration-300">
            {/* Animated Circular Progress (Concentric Smooth SVG Gauge) */}
            <div className="w-40 h-40 mx-auto relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Complete background track */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Animated progress stroke */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke="#b6ff2e"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - calcPercent / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-[#0f172a] tracking-tight">{calcPercent}%</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Building plan</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Creating your plan...</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Your profile • {formData.heightCm} cm, {formData.currentWeightKg} kg, {formData.age} years
              </p>
            </div>

            {/* Live review ticker */}
            <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200/80 text-left max-w-xs mx-auto shadow-sm">
              <div className="flex text-amber-400 gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
              </div>
              <p className="text-xs italic text-slate-700 font-medium">
                &ldquo;Finally a tracker I actually use. Photo scan, done. Down 8 kg in 2 months.&rdquo;
              </p>
              <p className="text-[10px] font-black text-slate-400 mt-1">— Marc D. • Verified athlete</p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 16: NOT ALL MASS IS EQUAL & TARGETS (Screenshot 4)         */}
        {/* ============================================================== */}
        {step === 16 && (
          <div className="space-y-5 animate-in fade-in duration-300 pb-4">
            
            {/* Top insight card (Screenshot 4) */}
            <div className="bg-[#f4f7f4] rounded-3xl p-5 border border-gray-200/70 space-y-3">
              <h3 className="text-base font-black text-[#14171d]">Not all mass is equal</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                On a surplus, you can just pack on fat. Or you can get those same calories from protein and complex carbs and build muscle, not belly fat.
              </p>
              <div className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3">
                <span className="text-2xl font-black text-[#65a30d]">2×</span>
                <span className="text-xs font-bold text-gray-700">
                  more muscle instead of fat with enough protein and strength training
                </span>
              </div>
            </div>

            {/* Target numbers heading (Screenshot 4) */}
            <div>
              <h3 className="text-base font-black text-[#14171d]">What else we calculated</h3>
              <p className="text-xs text-gray-500 mt-0.5">Six more numbers, tuned to your body and goals.</p>
            </div>

            {/* Target Cards */}
            <div className="space-y-2.5">
              {[
                {
                  title: 'Protein target',
                  sub: 'Builds muscle and speeds recovery',
                  val: `${Math.round(formData.currentWeightKg * 1.6)} g`,
                  icon: '🍴'
                },
                {
                  title: 'Fat target',
                  sub: 'Supports hormones and vitamin absorption.',
                  val: `${Math.round(formData.currentWeightKg * 0.9)} g`,
                  icon: '💧'
                },
                {
                  title: 'Carbs target',
                  sub: 'Fuel for growth and training',
                  val: `${Math.round(formData.currentWeightKg * 4.2)} g`,
                  icon: '🌾'
                },
                {
                  title: 'Fiber target',
                  sub: 'Digestion and appetite',
                  val: '47 g',
                  icon: '🥗'
                },
                {
                  title: 'Water target',
                  sub: 'Tuned to your weight and training',
                  val: `${(formData.currentWeightKg * 0.035).toFixed(1)} L`,
                  icon: '🥤'
                }
              ].map((t) => (
                <div 
                  key={t.title}
                  className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-50 flex items-center justify-center text-lg">
                      {t.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#14171d]">{t.title}</p>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{t.sub}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#65a30d]">{t.val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[#b6ff2e] text-[#14171d] font-black text-sm active:scale-98 transition-all shadow-md mt-4"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 17: ROADMAP TIMELINE (Screenshot 39)                      */}
        {/* ============================================================== */}
        {step === 17 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-black text-[#14171d]">Your personal plan</h2>
              <p className="text-xs text-gray-500 mt-1">
                Timed and calculated for your goal by {targetDateFormatted}.
              </p>
            </div>

            {/* Projection Star Card */}
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  ★ Target Goal
                </span>
                <div className="text-3xl font-black text-[#14171d] mt-1.5">
                  {formData.currentWeightKg} → {formData.targetWeightKg} kg
                </div>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">by {targetDateFormatted}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl font-bold">
                ⭐
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-2 text-xs font-bold text-gray-700">
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#b6ff2e] text-black flex items-center justify-center text-xs font-black">
                  ✓
                </div>
                <div>
                  <p className="text-gray-900 font-black">Today • Start {formData.currentWeightKg} kg</p>
                  <p className="text-[10px] text-gray-400">The first step is taken.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <div>
                  <p className="text-gray-900 font-black">In 4 weeks</p>
                  <p className="text-[10px] text-gray-400">Visible transformation in body composition.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[#b6ff2e] text-[#14171d] font-black text-sm active:scale-98 transition-all shadow-md"
            >
              Continue
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 18: CREATE ACCOUNT / REGISTER (Final Step)                */}
        {/* ============================================================== */}
        {step === 18 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-black text-[#14171d]">Save your plan</h2>
              <p className="text-xs text-gray-500 mt-1">Create your account to unlock your personalized Dashboard.</p>
            </div>

            {authError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                {authError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#84cc16]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Email address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#84cc16]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#84cc16]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Legal Terms of Service & Privacy Notice */}
            <div className="pt-1 text-center">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                By tapping Access My Dashboard, you agree to PlateVision&apos;s{' '}
                <a href="/terms" target="_blank" className="underline font-bold text-[#0f172a] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="underline font-bold text-[#0f172a] hover:underline">
                  Privacy Policy
                </a>.
              </p>
            </div>

            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm shadow-[0_4px_20px_rgba(182,255,46,0.35)] active:scale-98 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating your account...' : 'Access My Dashboard →'}
            </button>

            <div className="text-center">
              <button
                onClick={onOpenSignIn}
                className="text-xs font-bold text-gray-500 hover:text-black underline underline-offset-4"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

