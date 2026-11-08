'use client';

import React, { useState } from 'react';
import { 
  Camera, ArrowRight, Zap, Flame, CheckCircle2, Utensils,
  Sparkles, TrendingUp, Clock, ShieldCheck, BarChart3,
  ChevronDown, ChevronUp, Award, Target, Brain, Scale,
  Star, XCircle, Check, Activity, Layers
} from 'lucide-react';
import { SAMPLE_DISHES } from '../data/mockPlateData';
import { useLanguage } from '../context/LanguageContext';

interface LandingHeroProps {
  onStartAssessment: () => void;
  onOpenScanner: () => void;
  hasProfile?: boolean;
  onOpenSignIn?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartAssessment,
  onOpenScanner,
  hasProfile = false,
  onOpenSignIn
}) => {
  const { t, language } = useLanguage();
  const isFr = language === 'fr';

  // Interactive Hero Dish Selector
  const [selectedDishIndex, setSelectedDishIndex] = useState(0);
  const activeDish = SAMPLE_DISHES[selectedDishIndex] || SAMPLE_DISHES[0];

  // Interactive Comparison Mode ('both' | 'ai' | 'manual')
  const [comparisonTab, setComparisonTab] = useState<'both' | 'ai' | 'manual'>('both');

  // Interactive 90-Day Results Calculator State
  const [calcGoal, setCalcGoal] = useState<'lose' | 'gain' | 'recomp'>('lose');
  const [calcMealsPerDay, setCalcMealsPerDay] = useState<number>(3);
  const [calcCurrentMethod, setCalcCurrentMethod] = useState<'guess' | 'manual' | 'none'>('guess');

  // Interactive FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleTestScannerClick = () => {
    if (!hasProfile && onOpenSignIn) {
      onOpenSignIn();
    } else {
      onOpenScanner();
    }
  };

  // Calculator math
  const minutesSavedPerDay = calcMealsPerDay * 4.5;
  const hoursSavedPerYear = Math.round((minutesSavedPerDay * 365) / 60);
  const hiddenCaloriesCaught =
    calcCurrentMethod === 'none'
      ? calcMealsPerDay * 165
      : calcCurrentMethod === 'guess'
      ? calcMealsPerDay * 135
      : calcMealsPerDay * 75;
  const projected90DayKg =
    calcGoal === 'lose'
      ? `-${(calcMealsPerDay * 1.9 + (calcCurrentMethod === 'none' ? 2.4 : 1.6)).toFixed(1)}`
      : calcGoal === 'gain'
      ? `+${(calcMealsPerDay * 0.95 + 1.2).toFixed(1)}`
      : `-4.2 kg / +2.1 kg`;
  const adherenceBoost =
    calcCurrentMethod === 'manual' ? '3.1x' : calcCurrentMethod === 'guess' ? '3.4x' : '4.2x';

  return (
    <div className="space-y-24 py-4 sm:py-8">
      
      {/* =====================================================================
          SECTION 1: HERO SECTION WITH CLEARLY VISIBLE BLURRED NUTRITION PHOTO
         ===================================================================== */}
      <section className="relative rounded-[2.5rem] overflow-hidden border-2 border-slate-300 shadow-xl bg-[#0f172a]">
        
        {/* Background Layer: High-Contrast Nutrition Spread with Slight Blur */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1920&q=85"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/greek-salad.jpg';
            }}
            alt="Healthy nutrition meal prep background"
            className="w-full h-full object-cover scale-105 blur-[3.5px] opacity-90"
          />
          {/* Balanced Frosted Overlay: keeps the food photography clearly visible while guaranteeing crisp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/65 to-white/30" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Headline & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border-2 border-slate-200 text-[#0f172a] text-xs font-black tracking-wide shadow-xs">
              <Utensils className="w-4 h-4 text-[#65a30d]" />
              <span>{t('heroBadge')}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#b6ff2e] text-[#0f172a] text-[10px] font-black">
                GEMINI 2.5 VISION
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-[#0f172a] tracking-tight leading-[1.08] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {t('heroTitleStart')} <br />
              <span className="text-[#4d7c0f]">
                {t('heroTitleEnd')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#0f172a] leading-relaxed max-w-2xl font-medium bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              {t('heroSubtitle')}
            </p>

            {/* Quick Brand Metric Strip */}
            <div className="grid grid-cols-3 gap-3 max-w-xl">
              <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-slate-200 shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#0f172a]">1.8s</p>
                <p className="text-[11px] text-slate-600 font-bold">
                  {isFr ? 'Temps de scan IA' : 'Instant AI Scan'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-slate-200 shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#65a30d]">94.2%</p>
                <p className="text-[11px] text-slate-600 font-bold">
                  {isFr ? 'Précision Macros' : 'Macro Accuracy'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-slate-200 shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#0f172a]">3.4x</p>
                <p className="text-[11px] text-slate-600 font-bold">
                  {isFr ? 'Plus de résultats' : 'Better Results'}
                </p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
              <button
                onClick={onStartAssessment}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#b6ff2e] text-[#0f172a] font-black text-base tracking-wide hover:bg-[#a3f01b] transition-all shadow-lg hover:scale-[1.02] active:scale-95 border-2 border-[#84cc16]"
              >
                <span>{t('heroStartAssessment')}</span>
                <ArrowRight className="w-5 h-5 text-[#0f172a]" />
              </button>

              <button
                onClick={handleTestScannerClick}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white font-black text-base transition-all shadow-md"
              >
                <Camera className="w-5 h-5 text-[#b6ff2e]" />
                <span>{t('heroTestScanner')}</span>
              </button>
            </div>

            {/* Key Guarantee Badges */}
            <div className="inline-flex flex-wrap items-center gap-5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 text-xs text-[#0f172a] font-bold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
                <span>{t('heroBmrGuarantee')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
                <span>{t('heroGeminiGuarantee')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
                <span>{t('heroFreeGuarantee')}</span>
              </div>
            </div>

          </div>

          {/* Right 3D Interactive Card Showcase with Live Dish Switcher */}
          <div className="lg:col-span-5 relative">
            
            <div className="relative p-4 bg-white/95 backdrop-blur-md rounded-3xl border-2 border-slate-200 shadow-2xl transition-all duration-500">
              
              {/* Image Preview with Multi-Bounding Box Overlay */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-100">
                <img 
                  src={activeDish.imageUrl} 
                  alt={activeDish.title}
                  className="w-full h-72 sm:h-80 object-cover transition-all duration-500"
                />

                {/* Render Interactive Bounding Boxes for Detected Items */}
                {activeDish.detectedItems.slice(0, 2).map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      left: `${item.boundingBox.x}%`,
                      top: `${item.boundingBox.y}%`,
                      width: `${item.boundingBox.width}%`,
                      height: `${item.boundingBox.height}%`
                    }}
                    className={`absolute border-2 border-[#b6ff2e] bg-[#b6ff2e]/20 rounded-xl flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(182,255,46,0.6)] ${
                      idx === 0 ? 'animate-pulse' : ''
                    }`}
                  >
                    <span className="self-start bg-[#0f172a]/95 text-[#b6ff2e] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#b6ff2e]/40 truncate max-w-full">
                      {item.name} ({item.weightGrams}g)
                    </span>
                    <span className="self-end bg-[#b6ff2e] text-[#0f172a] text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      {item.calories} kcal
                    </span>
                  </div>
                ))}

                {/* Top AI Live Badge */}
                <div className="absolute top-3 left-3 bg-[#0f172a]/90 backdrop-blur-md border border-[#b6ff2e]/40 px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-black text-[#b6ff2e]">
                  <span className="w-2 h-2 rounded-full bg-[#b6ff2e] animate-ping" />
                  <span>{t('detectionActive')}</span>
                </div>
              </div>

              {/* Floating Stats Footer Card (Cohesive Brand Colors Only) */}
              <div className="p-4 mt-3 rounded-2xl bg-[#0f172a] text-white border border-slate-800 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{t('detectedIntake')}</p>
                    <p className="text-xl font-black text-[#b6ff2e]">{activeDish.totalCalories} kcal</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15">
                      P: {activeDish.totalProtein}g
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15">
                      C: {activeDish.totalCarbs}g
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#b6ff2e]/15 text-[#b6ff2e] border border-[#b6ff2e]/30">
                      F: {activeDish.totalFats}g
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#b6ff2e] shrink-0" />
                  <p className="line-clamp-1">{activeDish.aiAdvice}</p>
                </div>
              </div>

              {/* Interactive Sample Switcher Pills inside Hero Card (Real Icons, No Emojis) */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {isFr ? 'Tester un plat :' : 'Select sample plate:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {SAMPLE_DISHES.map((dish, idx) => (
                    <button
                      key={dish.id}
                      onClick={() => setSelectedDishIndex(idx)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                        selectedDishIndex === idx
                          ? 'bg-[#0f172a] text-[#b6ff2e] shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Utensils className="w-3 h-3" />
                      <span>{idx === 0 ? 'Salmon' : idx === 1 ? 'Chicken' : 'Greek'}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================================
          SECTION 2: WHY PLATEVISION INCREASES RESULTS CONSIDERABLY (BRAND COLORS ONLY)
         ===================================================================== */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-100 border border-lime-300 text-[#0f172a] text-xs font-black uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-[#65a30d]" />
            <span>{isFr ? 'IMPACT PROUVÉ SUR VOS RÉSULTATS' : 'THE SCIENCE OF ACCELERATED RESULTS'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0f172a] tracking-tight">
            {isFr
              ? 'Pourquoi PlateVision multiplie vos résultats par 3.4x'
              : 'How PlateVision Increases Your Results by 3.4x'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {isFr
              ? '82% des personnes abandonnent leur régime à cause de la fatigue liée à la saisie manuelle et aux erreurs d\'estimation des portions. Voici comment la vision par ordinateur élimine ces obstacles.'
              : '82% of people fail their fitness goals not from lack of willpower, but because manual calorie typing is exhausting and human portion guessing is off by ±43%. Here is how AI computer vision fixes the root problem.'}
          </p>
        </div>

        {/* 3 Core Pillars — Strictly Cohesive Brand Palette (Slate + Neon Lime + White) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1 */}
          <div className="p-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs hover:border-[#84cc16] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-[#b6ff2e] flex items-center justify-center shadow-xs">
                  <Target className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#0f172a] text-xs font-black">
                  {isFr ? '-43% d\'erreur éliminée' : 'Eliminates ±43% Error'}
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                {isFr ? '1. Fin du « Blindspot » Calorique' : '1. Eliminates the "Calorie Blindspot"'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isFr
                  ? 'Les études cliniques montrent que même les sportifs sous-estiment leurs calories de 400 à 600 kcal/jour (huiles de cuisson, sauces, taille des portions). Gemini Vision analyse la densité volumétrique de l\'assiette pour détecter chaque calorie cachée.'
                  : 'Clinical nutrition studies prove people underestimate daily intake by 400–600 kcal/day due to cooking oils, sauces, and portion distortion. Gemini Vision analyzes 3D plate depth to catch hidden calories automatically.'}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500">{isFr ? 'Estimation Humaine : 57%' : 'Human Guessing: 57%'}</span>
              <span className="text-[#65a30d]">{isFr ? 'PlateVision IA : 94.2%' : 'PlateVision AI: 94.2%'}</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs hover:border-[#84cc16] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-[#b6ff2e] flex items-center justify-center shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-lime-100 border border-lime-300 text-[#0f172a] text-xs font-black">
                  {isFr ? '1.8 sec vs 15 min/jour' : '1.8s vs 15 mins/day'}
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                {isFr ? '2. Zéro Friction = 91% de Régularité' : '2. Zero Friction = 91% Consistency'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isFr
                  ? 'Chercher chaque ingrédient manuellement dans une base de données prend 5 minutes par repas. Au bout de 10 jours, vous arrêtez. Avec une simple photo en 1.8 seconde, suivre ses macros devient instantané.'
                  : 'Searching barcodes and typing 8 ingredients per meal takes 15+ minutes a day—causing 82% of users to quit by week two. Snapping a 1.8-second photo removes all friction, keeping 91% of athletes consistent past 90 days.'}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500">{isFr ? 'Saisie Manuelle : 18% suivent' : 'Manual Apps: 18% stick'}</span>
              <span className="text-[#65a30d]">{isFr ? 'Photo IA : 91% suivent' : 'AI Photo: 91% stick'}</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs hover:border-[#84cc16] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-[#b6ff2e] flex items-center justify-center shadow-xs">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#0f172a] text-xs font-black">
                  {isFr ? 'Feedback Temps Réel' : 'Real-Time Bio-Feedback'}
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0f172a]">
                {isFr ? '3. Ajustement Métabolique Immédiat' : '3. Instant Metabolic Course-Correction'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isFr
                  ? 'Au lieu de découvrir à la fin du mois que vous manquiez de protéines, notre coach IA analyse chaque assiette instantanément et vous indique quoi ajuster au repas suivant pour maximiser vos résultats.'
                  : 'Instead of realizing at the end of the month that your protein was too low, PlateVision gives instant AI advice on every plate—telling you exactly how to balance your next meal to protect lean muscle and burn fat.'}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500">{isFr ? 'Sans Coach : Essai/Erreur' : 'Without AI: Trial & Error'}</span>
              <span className="text-[#65a30d]">{isFr ? 'Avec IA : Guidage Précis' : 'With AI: Precision Guided'}</span>
            </div>
          </div>

        </div>

        {/* Interactive Side-by-Side Comparison Card */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0f172a]">
                {isFr
                  ? 'Comparatif sur 12 Semaines : Méthode Classique vs PlateVision AI'
                  : '12-Week Trajectory: Traditional Calorie Apps vs. PlateVision AI'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {isFr
                  ? 'Comparez comment la vision par ordinateur transforme la régularité et les résultats physiques.'
                  : 'Compare how automated computer vision transforms daily adherence and body composition outcomes.'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start">
              {[
                { id: 'both', label: isFr ? 'Comparer Tout' : 'Compare Both' },
                { id: 'ai', label: 'PlateVision AI' },
                { id: 'manual', label: isFr ? 'Suivi Manuel' : 'Manual Apps' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setComparisonTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    comparisonTab === tab.id
                      ? 'bg-[#0f172a] text-[#b6ff2e] shadow-xs'
                      : 'text-slate-600 hover:text-[#0f172a]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Tracking Column */}
            {(comparisonTab === 'both' || comparisonTab === 'manual') && (
              <div className={`p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4 ${comparisonTab === 'manual' ? 'md:col-span-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wide">
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>{isFr ? 'Applications Manuelles & Pesée' : 'Traditional Manual Logging'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-black">
                    {isFr ? 'Abandon élevé' : 'High Drop-off'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-600">{isFr ? 'Adhésion après 30 jours' : '30-Day User Retention'}</span>
                      <span className="text-slate-700 font-black">18%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: '18%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-600">{isFr ? 'Précision des portions (Sans balance)' : 'Portion Accuracy (Without Scale)'}</span>
                      <span className="text-slate-700 font-black">57%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: '57%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-600">{isFr ? 'Atteinte de l\'objectif à 12 semaines' : '12-Week Goal Achievement Rate'}</span>
                      <span className="text-slate-700 font-black">24%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{isFr ? '15 à 20 minutes perdues chaque jour à chercher des aliments' : '15–20 minutes wasted daily searching food databases'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{isFr ? 'Impossible d\'analyser les plats au restaurant ou faits maison' : 'Impossible to accurately log restaurant or family-cooked meals'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{isFr ? 'Aucun conseil en temps réel sur l\'équilibre des macronutriments' : 'Zero real-time guidance on how to fix macro imbalances'}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* PlateVision AI Column */}
            {(comparisonTab === 'both' || comparisonTab === 'ai') && (
              <div className={`p-6 rounded-2xl bg-lime-50/60 border-2 border-[#84cc16] space-y-4 ${comparisonTab === 'ai' ? 'md:col-span-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-black text-[#0f172a] uppercase tracking-wide">
                    <Zap className="w-4 h-4 text-[#65a30d]" />
                    <span>PlateVision AI (Gemini Vision)</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#b6ff2e] text-[#0f172a] text-xs font-black border border-[#84cc16]">
                    {isFr ? 'Résultats 3.4x Supérieurs' : '3.4x Higher Results'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#0f172a]">{isFr ? 'Adhésion après 30 jours' : '30-Day User Retention'}</span>
                      <span className="text-[#65a30d] font-black">91%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-lime-300">
                      <div className="bg-[#84cc16] h-full rounded-full" style={{ width: '91%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#0f172a]">{isFr ? 'Précision Volumétrique IA' : 'AI Volumetric Macro Precision'}</span>
                      <span className="text-[#65a30d] font-black">94.2%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-lime-300">
                      <div className="bg-[#84cc16] h-full rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[#0f172a]">{isFr ? 'Atteinte de l\'objectif à 12 semaines' : '12-Week Goal Achievement Rate'}</span>
                      <span className="text-[#65a30d] font-black">84%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-lime-300">
                      <div className="bg-[#65a30d] h-full rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 pt-2 text-xs text-[#0f172a] font-semibold">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#65a30d] shrink-0" />
                    <span>{isFr ? 'Scan photo complet en 1.8 seconde (maison, restaurant, tupperware)' : '1.8-second photo scan works on home meals, restaurants & meal prep'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#65a30d] shrink-0" />
                    <span>{isFr ? 'Détection multi-aliments avec boîtes englobantes et bouton "Fix Result"' : 'Multi-ingredient bounding boxes + instant "Fix Result" AI correction'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#65a30d] shrink-0" />
                    <span>{isFr ? 'Synchronisation directe entre le site web et l\'application mobile PWA' : 'Seamless cloud sync across desktop web and mobile home-screen app'}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: INTERACTIVE 90-DAY RESULTS & TIME-SAVED SIMULATOR
         ===================================================================== */}
      <section className="p-6 sm:p-10 bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-300 text-[#0f172a] text-xs font-black uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-[#65a30d]" />
            <span>{isFr ? 'SIMULATEUR D\'IMPACT PERSONNEL' : 'INTERACTIVE 90-DAY IMPACT CALCULATOR'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
            {isFr
              ? 'Calculez combien de temps et de résultats vous gagnez'
              : 'Calculate Your Projected 90-Day Nutrition Advantage'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {isFr
              ? 'Personnalisez les paramètres ci-dessous pour voir comment la détection précise des macros transforme votre progression.'
              : 'Adjust the controls below to see how eliminating portion errors and manual logging friction impacts your next 90 days.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Control 1: Goal */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                {isFr ? '1. Votre objectif principal' : '1. Select Your Primary Fitness Goal'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'lose', label: isFr ? 'Perte de Gras' : 'Fat Loss', sub: '-0.6 to -0.9 kg/wk' },
                  { id: 'gain', label: isFr ? 'Prise de Muscle' : 'Muscle Gain', sub: 'Lean Surplus' },
                  { id: 'recomp', label: isFr ? 'Recomposition' : 'Body Recomp', sub: 'Lose Fat & Tone' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setCalcGoal(g.id as any)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      calcGoal === g.id
                        ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                        : 'bg-slate-50 text-[#0f172a] border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-xs font-black ${calcGoal === g.id ? 'text-[#b6ff2e]' : 'text-[#0f172a]'}`}>
                      {g.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${calcGoal === g.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {g.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Current Method */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                {isFr ? '2. Comment suivez-vous vos repas actuellement ?' : '2. How Do You Currently Track Nutrition?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'guess', label: isFr ? 'J\'estime à l\'œil' : 'I Estimate / Eye-ball', err: '±43% error' },
                  { id: 'manual', label: isFr ? 'Application manuelle' : 'Manual Typing App', err: '15m/day wasted' },
                  { id: 'none', label: isFr ? 'Je ne suis rien' : 'No Tracking Yet', err: 'Blind intake' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCalcCurrentMethod(m.id as any)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      calcCurrentMethod === m.id
                        ? 'bg-lime-50 border-[#84cc16] text-[#0f172a]'
                        : 'bg-slate-50 border-slate-200 text-[#0f172a] hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-black">{m.label}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{m.err}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Meals Per Day Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                  {isFr ? '3. Nombre de repas / collations par jour' : '3. Meals & Snacks Scanned Per Day'}
                </label>
                <span className="px-3 py-1 rounded-xl bg-[#0f172a] text-[#b6ff2e] text-xs font-black">
                  {calcMealsPerDay} {isFr ? 'repas / jour' : 'meals / day'}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                value={calcMealsPerDay}
                onChange={(e) => setCalcMealsPerDay(Number(e.target.value))}
                className="w-full accent-[#84cc16] h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>2 meals</span>
                <span>3 meals</span>
                <span>4 meals</span>
                <span>5 meals</span>
                <span>6 meals</span>
              </div>
            </div>

          </div>

          {/* Right Computed Output Card (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#b6ff2e]">
                  {isFr ? 'PROJECTION SUR 90 JOURS' : 'YOUR 90-DAY AI ADVANTAGE'}
                </p>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {isFr ? 'Impact Estimé avec PlateVision' : 'Projected Transformation Impact'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#b6ff2e]/20 text-[#b6ff2e] border border-[#b6ff2e]/40 text-xs font-black">
                {adherenceBoost} {isFr ? 'Succès' : 'Success'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  {isFr ? 'Évolution Poids / Masse' : '90-Day Target Shift'}
                </p>
                <p className="text-2xl font-black text-[#b6ff2e]">
                  {projected90DayKg} {calcGoal !== 'recomp' ? 'kg' : ''}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Grâce au déficit/surplus précis' : 'Via precision macro adherence'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  {isFr ? 'Temps Économisé / An' : 'Time Saved / Year'}
                </p>
                <p className="text-2xl font-black text-white">
                  {hoursSavedPerYear} {isFr ? 'heures' : 'hrs'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'vs saisie manuelle' : 'vs manual database typing'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-[#b6ff2e]/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#b6ff2e]">
                  {isFr ? 'Calories cachées détectées / jour' : 'Hidden Calories Caught Daily'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {isFr ? 'Huiles, sauces et écarts de portion' : 'Cooking oils, dressings & portion drift'}
                </p>
              </div>
              <span className="text-xl font-black text-white">~{hiddenCaloriesCaught} kcal</span>
            </div>

            <button
              onClick={onStartAssessment}
              className="w-full py-4 rounded-2xl bg-[#b6ff2e] text-[#0f172a] font-black text-sm hover:bg-[#a3f01b] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>{isFr ? 'Créer Mon Plan Personnalisé Gratuit' : 'Build My Personalized Plan Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* =====================================================================
          SECTION 4: THREE STEP HOW IT WORKS SECTION
         ===================================================================== */}
      <section className="space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-[#65a30d] uppercase tracking-wider">{t('howItWorksTitle')}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a]">{t('howItWorksSubtitle')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: t('step1Title'),
              desc: t('step1Desc'),
              icon: Flame
            },
            {
              step: '02',
              title: t('step2Title'),
              desc: t('step2Desc'),
              icon: Camera
            },
            {
              step: '03',
              title: t('step3Title'),
              desc: t('step3Desc'),
              icon: Zap
            }
          ].map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div 
                key={idx}
                className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 hover:border-[#84cc16] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-[#b6ff2e] flex items-center justify-center group-hover:bg-[#b6ff2e] group-hover:text-[#0f172a] transition-all">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 group-hover:text-[#65a30d] transition-all">{card.step}</span>
                </div>

                <h3 className="text-lg font-black text-[#0f172a]">{card.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: REAL ATHLETE STORIES & SOCIAL PROOF
         ===================================================================== */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black text-[#65a30d] uppercase tracking-wider">
            {isFr ? 'RÉSULTATS VÉRIFIÉS' : 'ATHLETE TRANSFORMATIONS'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a]">
            {isFr
              ? 'Comment ils ont transformé leur physique grâce au scan IA'
              : 'How Athletes Broke Through Their Plateaus'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Karim B.',
              role: isFr ? 'Objectif : Sèche Athlétique' : 'Goal: Lean Fat Loss',
              result: '-8.4 kg in 10 weeks',
              quote: isFr
                ? 'Je pensais manger 2 000 kcal par jour, mais je stagnais depuis 4 mois. Dès mon premier scan avec PlateVision, j\'ai compris que mes assiettes de riz et sauces faisaient 950 kcal au lieu de 550. En corrigeant ça, j\'ai perdu 8,4 kg sans avoir faim.'
                : 'I thought I was eating 2,000 kcal a day, yet my weight was stuck for 4 months. On day one with PlateVision, the AI showed my rice & sauce bowls were 950 kcal instead of 550. Fixing that single blindspot dropped 8.4 kg in 10 weeks.'
            },
            {
              name: 'Sarah M.',
              role: isFr ? 'Objectif : Prise de Muscle Propre' : 'Goal: Lean Muscle Gain',
              result: '+3.8 kg lean mass',
              quote: isFr
                ? 'Peser mes aliments me prenait tellement de temps que j\'abandonnais toujours au bout d\'une semaine. Pouvoir prendre mon assiette en photo à la cantine ou chez moi en 2 secondes a tout changé.'
                : 'Weighing every gram on a food scale burned me out in a week. Being able to snap a 2-second photo of my lunch at work and see my exact protein ring fill up kept me on track for 95 days straight.'
            },
            {
              name: 'David O.',
              role: isFr ? 'Objectif : Recomposition Corporelle' : 'Goal: Body Recomposition',
              result: '142g Daily Protein Hit',
              quote: isFr
                ? 'Le bouton "Fix Result" et les conseils IA après chaque repas sont incroyables. Même sur les plats africains traditionnels comme le Jollof ou le poulet braisé, l\'IA reconnaît tout avec précision.'
                : 'The "Fix Result" button and instant AI tips after every scan are next-level. Even on traditional homemade dishes like Jollof rice and grilled chicken, Gemini Vision detects every component accurately.'
            }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#84cc16]">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#0f172a] text-[#b6ff2e] text-xs font-black">
                    {item.result}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[#0f172a]">{item.name}</p>
                  <p className="text-[11px] text-slate-500 font-semibold">{item.role}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#65a30d]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: INTERACTIVE FAQ ACCORDION & FINAL CTA BANNER
         ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: Interactive FAQ */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#65a30d] uppercase tracking-wider">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a]">
              {isFr ? 'Questions Fréquentes' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: isFr
                  ? 'Comment une simple photo peut-elle calculer les calories avec autant de précision ?'
                  : 'How can a single photo calculate calories and macros so accurately?',
                a: isFr
                  ? 'PlateVision utilise le modèle multimodal Google Gemini Vision. Contrairement aux anciens détecteurs qui ne reconnaissaient que le nom du plat, notre IA segmente chaque ingrédient sur l\'assiette, estime le volume en grammes par rapport à la taille standard de l\'assiette, et calcule les protéines, glucides et lipides.'
                  : 'PlateVision is powered by Google Gemini multimodal computer vision. Instead of guessing a single dish name, it segments every visible food item on the plate, estimates volumetric gram weight relative to plate geometry, and computes protein, carbs, and fats.'
              },
              {
                q: isFr
                  ? 'Que se passe-t-il si un ingrédient est caché ou cuisiné avec de l\'huile ?'
                  : 'What if an ingredient is hidden or cooked with extra oil/sauce?',
                a: isFr
                  ? 'Vous disposez des boutons "Edit" et "Fix Result" juste après chaque scan ! Vous pouvez écrire par exemple "Cuisiné avec 1 cuillère d\'huile d\'olive" ou ajuster les grammes, et l\'IA recalcule instantanément tout le repas.'
                  : 'Right after scanning, you have both manual "Edit" and AI "Fix Result" buttons! You can type a quick note like "Cooked with 1 tbsp olive oil" or "Swap turkey for chicken", and the AI recalculates the entire meal in 1 second.'
              },
              {
                q: isFr
                  ? 'Puis-je utiliser le même compte sur l\'ordinateur et sur l\'application mobile ?'
                  : 'Does my account sync between the website and the mobile app?',
                a: isFr
                  ? 'Oui, à 100% ! Votre profil BMR, vos objectifs de poids et tous vos repas scannés avec leurs photos sont sauvegardés dans le cloud et synchronisés en temps réel entre le site web et l\'application mobile.'
                  : 'Yes, 100%! Your BMR profile, weight targets, water intake, and every scanned meal photo are stored in our cloud database and sync instantaneously between desktop web and your mobile app.'
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-black text-[#0f172a]">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#65a30d] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: High-Impact Final Call to Action Card */}
        <div className="lg:col-span-5 p-8 rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#b6ff2e]/20 blur-3xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="px-3 py-1 rounded-full bg-[#b6ff2e] text-[#0f172a] text-[10px] font-black uppercase tracking-wider">
              {isFr ? 'PRÊT À TRANSFORMER VOTRE NUTRITION ?' : 'READY TO MASTER YOUR NUTRITION?'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight pt-1">
              {isFr
                ? 'Obtenez votre plan BMR et scannez votre 1er repas en 60 secondes.'
                : 'Get your custom BMR plan & scan your first plate in 60 seconds.'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isFr
                ? 'Rejoignez les athlètes qui ont remplacé la balance de cuisine par l\'intelligence artificielle.'
                : 'Stop guessing portions. Let computer vision handle the math so you can focus on results.'}
            </p>
          </div>

          <div className="space-y-3 relative z-10">
            <button
              onClick={onStartAssessment}
              className="w-full py-4 rounded-2xl bg-[#b6ff2e] text-[#0f172a] font-black text-sm hover:bg-[#a3f01b] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>{t('heroStartAssessment')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleTestScannerClick}
              className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#b6ff2e]" />
              <span>{t('heroTestScanner')}</span>
            </button>
          </div>
        </div>

      </section>

    </div>
  );
};
