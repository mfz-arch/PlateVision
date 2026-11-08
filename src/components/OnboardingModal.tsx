import React, { useState } from 'react';
import { 
  X, ArrowRight, ArrowLeft, Check, AlertTriangle, Sparkles, 
  Target, Activity, Scale, Heart, Flame, Droplets, CheckCircle, User, Eye, EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OnboardingData, UserProfile } from '../types/plateVision';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const [step, setStep] = useState<number>(1);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcProgress, setCalcProgress] = useState<number>(0);

  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formData, setFormData] = useState<OnboardingData>({
    goal: 'lose',
    name: "Athlete",
    email: "",
    password: "",
    age: 25,
    gender: 'male',
    heightCm: 175,
    currentWeightKg: 75,
    targetWeightKg: 70,
    workoutDaysPerWeek: 4,
    timeframeMonths: 3,
    hasChildren: false,
    acceptedTerms: false
  });
  const [authError, setAuthError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const weightDiffKg = Math.abs(formData.currentWeightKg - formData.targetWeightKg);
  const weeksTotal = formData.timeframeMonths * 4.33;
  const kgPerWeek = weeksTotal > 0 ? (weightDiffKg / weeksTotal) : 0;
  const isPaceUnrealistic = kgPerWeek > 1.0 && formData.goal !== 'maintain';

  const handleNextStep = () => {
    if (step === 2) {
      if (!formData.email || !formData.password) {
        setAuthError('Please provide both email and password to create your account.');
        return;
      }
      if (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        setAuthError('Password must be at least 8 characters long and include both letters and numbers.');
        return;
      }
      if (!formData.acceptedTerms) {
        setAuthError('You must accept the Terms of Service and Privacy Policy to proceed.');
        return;
      }
      setAuthError(null);
    }
    if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
      runCalculations();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setAuthError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const runCalculations = () => {
    setIsCalculating(true);
    setCalcProgress(15);

    setTimeout(() => {
      setCalcProgress(45);
    }, 800);

    setTimeout(() => {
      setCalcProgress(75);
    }, 1600);

    setTimeout(() => {
      setCalcProgress(100);
      setIsCalculating(false);
      
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }, 2400);
  };

  const handleFinalSubmit = async () => {
    let bmr = 10 * formData.currentWeightKg + 6.25 * formData.heightCm - 5 * formData.age + 5;
    let activityMultiplier = 1.2 + (formData.workoutDaysPerWeek * 0.1);
    let tdee = bmr * activityMultiplier;

    let targetCalories = Math.round(tdee);
    if (formData.goal === 'lose') targetCalories -= 450;
    if (formData.goal === 'gain') targetCalories += 450;

    const proteinGrams = Math.round(formData.currentWeightKg * 2.0);
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

    try {
      if (formData.email && formData.password) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profile,
            acceptedTerms: true,
            website: honeypot
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setAuthError(data.error || 'Failed to register user account');
          setStep(2);
          return;
        }
        if (data.user) {
          onComplete(data.user);
          onClose();
          return;
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
    }

    onComplete(profile);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="relative w-full max-w-2xl p-6 sm:p-8 bg-white text-[#0f172a] rounded-3xl border-2 border-slate-200 shadow-2xl">
        
        {/* Top Header Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-lime-100 border border-lime-200 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#84cc16]" aria-hidden="true" />
            </div>
            <h2 id="onboarding-modal-title" className="text-sm font-black text-[#0f172a]">
              {t('onboardingTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close onboarding wizard"
            className="p-2 rounded-full text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 transition-all focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Step indicator bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden border border-slate-200">
          <div 
            className="bg-[#84cc16] h-full transition-all duration-500 shadow-xs"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* STEP 1: Main Goal Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black text-[#0f172a]">{t('step1Question')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'lose', title: t('goalLose'), desc: t('goalLoseDesc'), icon: Flame },
                { id: 'gain', title: t('goalGain'), desc: t('goalGainDesc'), icon: Activity },
                { id: 'maintain', title: t('goalMaintain'), desc: t('goalMaintainDesc'), icon: Heart }
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = formData.goal === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setFormData({ ...formData, goal: item.id as any })}
                    className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'bg-lime-50 border-[#84cc16] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-[#b6ff2e] text-[#0f172a]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-black text-[#0f172a] mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Personal Stats */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black text-[#0f172a]">{t('wizardStep2Title')}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">{t('wizardStep2Desc')}</p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center">
                {authError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">{t('emailLabel')}</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:border-[#84cc16] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">{t('passwordLabel')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:border-[#84cc16] focus:bg-white focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-[#0f172a] transition-all"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">{t('nameLabel')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:border-[#84cc16] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">{t('ageLabel')}</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:border-[#84cc16] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">{t('heightLabel')}</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:border-[#84cc16] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">{t('currentWeightLabel')}</label>
                <input
                  type="number"
                  value={formData.currentWeightKg}
                  onChange={(e) => setFormData({ ...formData, currentWeightKg: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0f172a] text-sm focus:border-[#84cc16] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-[#65a30d] uppercase mb-1 flex items-center justify-between">
                  <span>{t('targetWeightLabel')}</span>
                  <span className="text-[#0f172a] text-sm font-black">{formData.targetWeightKg} kg</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="130"
                  value={formData.targetWeightKg}
                  onChange={(e) => setFormData({ ...formData, targetWeightKg: Number(e.target.value) })}
                  className="w-full accent-[#84cc16]"
                />
              </div>

              {/* Honeypot field for anti-bot spam protection */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="sr-only"
                aria-hidden="true"
              />

              {/* Legal Consent & Terms Acceptance Checkbox (GDPR / CCPA / ADA compliance) */}
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    required
                    checked={!!formData.acceptedTerms}
                    onChange={(e) => {
                      setFormData({ ...formData, acceptedTerms: e.target.checked });
                      if (authError) setAuthError(null);
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-300 bg-slate-50 text-[#84cc16] focus:ring-2 focus:ring-[#84cc16] accent-[#84cc16] shrink-0"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed font-medium">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#65a30d] underline underline-offset-2 hover:text-[#84cc16] font-bold"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#65a30d] underline underline-offset-2 hover:text-[#84cc16] font-bold"
                    >
                      Privacy Policy
                    </a>
                    , and I consent to the processing of my nutrition and fitness journal data.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Exercise Frequency & Timeframe */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black text-[#0f172a]">{t('wizardStep3Title')}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">{t('wizardStep3Desc')}</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-2">
                  {t('workoutDaysLabel')} : <span className="text-[#65a30d] font-black">{formData.workoutDaysPerWeek} {t('workoutDaysUnit')}</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, workoutDaysPerWeek: days })}
                      className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${
                        formData.workoutDaysPerWeek === days
                          ? 'bg-[#b6ff2e] text-[#0f172a] border-[#84cc16] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-2">
                  {t('timeframeLabel')} : <span className="text-[#65a30d] font-black">{formData.timeframeMonths} {t('timeframeUnit')}</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 6].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setFormData({ ...formData, timeframeMonths: months })}
                      className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${
                        formData.timeframeMonths === months
                          ? 'bg-[#b6ff2e] text-[#0f172a] border-[#84cc16] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {months} {t('timeframeUnit')}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-200 text-[#0f172a] text-xs font-black mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#84cc16]" />
                {t('step4Badge')}
              </div>
              <h3 className="text-2xl font-black text-[#0f172a]">{t('step4Title')}</h3>
            </div>

            {isPaceUnrealistic ? (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 space-y-3">
                <div className="flex items-center gap-3 text-amber-800 font-black text-base">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <span>{t('alertIntensiveTitle')} ({kgPerWeek.toFixed(1)} kg / wk)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {t('alertIntensiveDesc', { months: formData.timeframeMonths })}
                </p>
                <div className="p-3 rounded-xl bg-amber-100 text-xs text-amber-900 font-semibold">
                  {t('alertIntensiveAdvice')}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-lime-50 border-2 border-lime-200 space-y-3">
                <div className="flex items-center gap-3 text-emerald-800 font-black text-base">
                  <CheckCircle className="w-6 h-6 text-[#84cc16] shrink-0" />
                  <span>{t('alertRealisticTitle')} ({kgPerWeek.toFixed(1)} kg / wk)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {t('alertRealisticDesc')}
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{t('currentStat')}</p>
                <p className="text-base font-black text-[#0f172a]">{formData.currentWeightKg} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{t('targetStat')}</p>
                <p className="text-base font-black text-[#65a30d]">{formData.targetWeightKg} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{t('durationStat')}</p>
                <p className="text-base font-black text-[#0f172a]">{formData.timeframeMonths} mo</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{t('workoutStat')}</p>
                <p className="text-base font-black text-[#0f172a]">{formData.workoutDaysPerWeek}d / wk</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Interactive Calculation & Final Output */}
        {step === 5 && (
          <div className="py-6 space-y-6 text-center animate-in fade-in duration-300">
            {isCalculating ? (
              <div className="space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-lime-100 border border-lime-200 flex items-center justify-center animate-pulse shadow-sm">
                  <Sparkles className="w-10 h-10 text-[#84cc16] animate-spin" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#0f172a] mb-2">{t('step5CalculatingTitle')}</h4>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="bg-[#84cc16] h-full transition-all duration-300 shadow-xs"
                    style={{ width: `${calcProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#b6ff2e] text-[#0f172a] flex items-center justify-center shadow-xs">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0f172a]">{t('step5SuccessTitle')}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{t('step5SuccessDesc')}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  <div className="p-4 rounded-2xl bg-lime-50/80 border-2 border-[#84cc16]">
                    <p className="text-[10px] text-slate-600 uppercase font-black">{t('caloriesPerDay')}</p>
                    <p className="text-xl font-black text-[#0f172a]">2 150 <span className="text-xs font-normal text-slate-500">kcal</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t('proteinsLabel')}</p>
                    <p className="text-xl font-black text-[#0f172a]">156 <span className="text-xs font-normal text-slate-500">g</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t('carbsLabel')}</p>
                    <p className="text-xl font-black text-[#0f172a]">210 <span className="text-xs font-normal text-slate-500">g</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t('waterPerDay')}</p>
                    <p className="text-xl font-black text-sky-600">2.8 <span className="text-xs font-normal text-slate-500">L</span></p>
                  </div>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-4 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-base tracking-wide hover:bg-[#a3f01b] transition-all shadow-xs"
                >
                  {t('accessDashboardCTA')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        {step <= 4 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t-2 border-slate-200">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('prevButton')}
              </button>
            ) : <div />}

            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs tracking-wide hover:bg-[#a3f01b] transition-all shadow-xs"
            >
              <span>{step === 4 ? t('launchAnalysisCTA') : t('nextButton')}</span>
              <ArrowRight className="w-4 h-4 text-[#0f172a]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
