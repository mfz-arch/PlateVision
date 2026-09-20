'use client';

import React from 'react';
import { 
  Sparkles, Camera, ArrowRight, ShieldCheck, Zap, 
  Flame, Dumbbell, Award, ChevronRight, CheckCircle2
} from 'lucide-react';
import { SAMPLE_DISHES } from '../data/mockPlateData';

interface LandingHeroProps {
  onStartAssessment: () => void;
  onOpenScanner: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartAssessment,
  onOpenScanner
}) => {
  const sampleDish = SAMPLE_DISHES[0];

  return (
    <div className="space-y-20 py-8 sm:py-12">
      
      {/* HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Headline & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 text-[#b6ff2e] text-xs font-extrabold tracking-wide">
            <Sparkles className="w-4 h-4 text-[#b6ff2e]" />
            <span>La nouvelle ère de la nutrition intelligente</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Scanne ton assiette. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b6ff2e] via-[#a3f01b] to-emerald-400">
              Maîtrise tes macros.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#9ea3b0] leading-relaxed max-w-2xl font-normal">
            Prends simplement une photo de ton repas. L'intelligence artificielle **PlateVision** détecte automatiquement chaque aliment et calcule tes calories, protéines et glucides en moins de 2 secondes.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={onStartAssessment}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-base tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_30px_rgba(182,255,46,0.4)] hover:scale-105 active:scale-95"
            >
              <span>Lancer mon Bilan Gratuit</span>
              <ArrowRight className="w-5 h-5 text-[#14171d]" />
            </button>

            <button
              onClick={onOpenScanner}
              className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[#23262f] border border-[rgba(255,255,255,0.12)] hover:border-[#b6ff2e]/40 text-white font-bold text-base transition-all hover:bg-[#2a2e39]"
            >
              <Camera className="w-5 h-5 text-[#b6ff2e]" />
              <span>Tester le Scanner IA</span>
            </button>
          </div>

          {/* Key Guarantee Badges */}
          <div className="flex items-center gap-6 pt-4 text-xs text-[#9ea3b0] font-semibold border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#b6ff2e]" />
              <span>Calcul BMR Précis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#b6ff2e]" />
              <span>Gemini Vision API Integration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#b6ff2e]" />
              <span>100% Gratuit pour tester</span>
            </div>
          </div>

        </div>

        {/* Right 3D Interactive Card Showcase */}
        <div className="lg:col-span-5 relative">
          
          <div className="relative p-4 glass-card rounded-3xl border border-[rgba(255,255,255,0.15)] shadow-[0_30px_70px_rgba(0,0,0,0.8)] transform hover:rotate-1 transition-all duration-500 group">
            
            {/* Image Preview with Bounding Box Overlay */}
            <div className="relative rounded-2xl overflow-hidden">
              <img 
                src={sampleDish.imageUrl} 
                alt="PlateVision Preview"
                className="w-full h-80 object-cover"
              />

              {/* Glowing Live Bounding Box */}
              <div 
                style={{ left: '22%', top: '20%', width: '50%', height: '40%' }}
                className="absolute border-2 border-[#b6ff2e] bg-[#b6ff2e]/20 rounded-xl flex items-center justify-between p-2 shadow-[0_0_20px_#b6ff2e] animate-pulse"
              >
                <span className="bg-[#14171d] text-[#b6ff2e] text-[10px] font-black px-1.5 py-0.5 rounded border border-[#b6ff2e]/40">
                  Saumon Grillé (180g)
                </span>
                <span className="bg-[#b6ff2e] text-[#14171d] text-[10px] font-black px-1.5 py-0.5 rounded">
                  320 kcal
                </span>
              </div>

              {/* Top AI Live Badge */}
              <div className="absolute top-3 left-3 bg-[#14171d]/90 backdrop-blur-md border border-[#b6ff2e]/40 px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-extrabold text-[#b6ff2e]">
                <span className="w-2 h-2 rounded-full bg-[#b6ff2e] animate-ping" />
                <span>Détection Vision IA Active</span>
              </div>
            </div>

            {/* Floating Stats Footer Card */}
            <div className="p-4 mt-3 rounded-2xl bg-[#14171d] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Apport Détecté</p>
                <p className="text-xl font-extrabold text-[#b6ff2e]">{sampleDish.totalCalories} kcal</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Prot: {sampleDish.totalProtein}g
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gluc: {sampleDish.totalCarbs}g
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* THREE STEP HOW IT WORKS SECTION */}
      <div className="space-y-10 pt-10 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-[#b6ff2e] uppercase tracking-wider">Comment ça marche</span>
          <h2 className="text-3xl font-extrabold text-white">3 étapes simples pour piloter sa nutrition</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Définis tes objectifs',
              desc: "Réponds au questionnaire intelligent pour calculer tes besoins exacts en calories et macronutriments.",
              icon: Flame
            },
            {
              step: '02',
              title: 'Scanne ton assiette',
              desc: "Prends une photo de ton plat. L'IA de PlateVision analyse automatiquement les aliments présents.",
              icon: Camera
            },
            {
              step: '03',
              title: 'Reçois tes conseils IA',
              desc: "Consulte le bilan nutritionnel instantané et suis ton avancement sur ton tableau de bord personnalisé.",
              icon: Zap
            }
          ].map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div 
                key={idx}
                className="p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.08)] space-y-4 hover:border-[#b6ff2e]/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e] group-hover:bg-[#b6ff2e] group-hover:text-[#14171d] transition-all">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-white/20 group-hover:text-[#b6ff2e]/40 transition-all">{card.step}</span>
                </div>

                <h3 className="text-lg font-extrabold text-white">{card.title}</h3>
                <p className="text-xs text-[#9ea3b0] leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
