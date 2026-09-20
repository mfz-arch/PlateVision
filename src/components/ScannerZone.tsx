'use client';

import React, { useState } from 'react';
import { 
  Camera, Upload, Sparkles, CheckCircle2, RefreshCw, X, Flame, 
  Dumbbell, Layers, Info, ArrowRight, Zap
} from 'lucide-react';
import { SAMPLE_DISHES } from '../data/mockPlateData';
import { SampleDish, ScannedMeal } from '../types/plateVision';

interface ScannerZoneProps {
  onMealScanned: (meal: ScannedMeal) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ScannerZone: React.FC<ScannerZoneProps> = ({
  onMealScanned,
  onClose,
  isModal = false
}) => {
  const [selectedDish, setSelectedDish] = useState<SampleDish>(SAMPLE_DISHES[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const handleSelectSample = (dish: SampleDish) => {
    setSelectedDish(dish);
    setCustomImage(null);
    triggerScanAnimation();
  };

  const triggerScanAnimation = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);

      // Create a custom scanned dish
      const customDish: SampleDish = {
        id: 'custom-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, "") || 'Assiette Personnalisée',
        category: 'Scan En Direct',
        imageUrl: url,
        totalCalories: 580,
        totalProtein: 36,
        totalCarbs: 48,
        totalFats: 16,
        detectedItems: [
          {
            id: 'c-1',
            name: 'Protéine Principale (Poulet / Poisson)',
            calories: 300,
            protein: 32,
            carbs: 0,
            fats: 10,
            weightGrams: 180,
            boundingBox: { x: 25, y: 20, width: 45, height: 40 }
          },
          {
            id: 'c-2',
            name: 'Portion de Glucides (Riz / Pâtes)',
            calories: 200,
            protein: 4,
            carbs: 42,
            fats: 2,
            weightGrams: 140,
            boundingBox: { x: 15, y: 55, width: 35, height: 35 }
          },
          {
            id: 'c-3',
            name: 'Légumes & Condiments',
            calories: 80,
            protein: 0,
            carbs: 6,
            fats: 4,
            weightGrams: 90,
            boundingBox: { x: 55, y: 48, width: 35, height: 38 }
          }
        ],
        aiAdvice: 'Assiette détectée avec succès ! Bon équilibre global entre protéines et glucides.'
      };

      setSelectedDish(customDish);
      triggerScanAnimation();
    }
  };

  const handleLogMeal = () => {
    const newMeal: ScannedMeal = {
      id: 'meal-' + Date.now(),
      title: selectedDish.title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: selectedDish.imageUrl,
      totalCalories: selectedDish.totalCalories,
      totalProtein: selectedDish.totalProtein,
      totalCarbs: selectedDish.totalCarbs,
      totalFats: selectedDish.totalFats,
      detectedItems: selectedDish.detectedItems,
      aiAdvice: selectedDish.aiAdvice
    };

    onMealScanned(newMeal);
    if (onClose) onClose();
  };

  const content = (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center">
            <Camera className="w-5 h-5 text-[#b6ff2e]" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Scanner Visuel IA</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#b6ff2e]/20 text-[#b6ff2e] border border-[#b6ff2e]/40">
                Gemini Vision API
              </span>
            </h3>
            <p className="text-xs text-[#9ea3b0]">Déposez une photo ou choisissez un modèle d'assiette à analyser</p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#9ea3b0] hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preset Dish Selector & Upload Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {SAMPLE_DISHES.map((dish) => (
          <button
            key={dish.id}
            onClick={() => handleSelectSample(dish)}
            className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              selectedDish.id === dish.id && !customImage
                ? 'bg-[#b6ff2e]/10 border-[#b6ff2e] shadow-[0_0_15px_rgba(182,255,46,0.2)]'
                : 'bg-[#14171d] border-white/10 hover:border-white/20'
            }`}
          >
            <img 
              src={dish.imageUrl} 
              alt={dish.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{dish.title}</p>
              <p className="text-[10px] text-[#b6ff2e] font-semibold">{dish.totalCalories} kcal</p>
            </div>
          </button>
        ))}

        {/* Upload Custom File */}
        <label className="p-2.5 rounded-2xl bg-[#14171d] border border-dashed border-[#b6ff2e]/50 hover:border-[#b6ff2e] cursor-pointer flex items-center justify-center gap-2 text-[#b6ff2e] font-bold text-xs transition-all hover:bg-[#b6ff2e]/5">
          <Upload className="w-4 h-4" />
          <span>Uploader Photo</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </label>
      </div>

      {/* Main Image Viewport with Bounding Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Image Canvas & Scanning Overlay */}
        <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-[#14171d] border border-[rgba(255,255,255,0.1)] group">
          
          <img 
            src={selectedDish.imageUrl} 
            alt={selectedDish.title}
            className="w-full h-[360px] object-cover transition-all duration-500"
          />

          {/* Scanner Beam Animation when scanning */}
          {isScanning && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]">
              <div className="scanner-beam" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#14171d]/90 border border-[#b6ff2e]/40 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#b6ff2e]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#b6ff2e]" />
                  <span>Analyse par la Vision IA en cours ({scanProgress}%)...</span>
                </div>
              </div>
            </div>
          )}

          {/* Computer Vision Bounding Boxes Overlay */}
          {!isScanning && selectedDish.detectedItems.map((item) => {
            const isActive = activeBoxId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveBoxId(item.id)}
                onMouseLeave={() => setActiveBoxId(null)}
                style={{
                  left: `${item.boundingBox.x}%`,
                  top: `${item.boundingBox.y}%`,
                  width: `${item.boundingBox.width}%`,
                  height: `${item.boundingBox.height}%`
                }}
                className={`absolute rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between p-2 ${
                  isActive
                    ? 'border-[#b6ff2e] bg-[#b6ff2e]/20 shadow-[0_0_20px_#b6ff2e]'
                    : 'border-[#b6ff2e]/70 bg-[#b6ff2e]/10 hover:border-[#b6ff2e]'
                }`}
              >
                {/* Bounding Box Corner Badges */}
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded bg-[#14171d]/90 text-[10px] font-extrabold text-[#b6ff2e] border border-[#b6ff2e]/40">
                    {item.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#b6ff2e] text-[10px] font-extrabold text-[#14171d]">
                    {item.calories} kcal
                  </span>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-3 left-3 bg-[#14171d]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-[#9ea3b0] font-semibold">
            Survolez les cadres verts pour inspecter les aliments détectés
          </div>
        </div>

        {/* Right Column: Nutrient Breakdown & AI Co-pilot */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Dish Summary Card */}
          <div className="p-5 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)] space-y-4">
            <div>
              <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-[#b6ff2e]/15 text-[#b6ff2e] border border-[#b6ff2e]/30">
                {selectedDish.category}
              </span>
              <h4 className="text-lg font-extrabold text-white mt-2 leading-snug">{selectedDish.title}</h4>
            </div>

            {/* Total Calories Indicator */}
            <div className="p-4 rounded-2xl bg-[#14171d] border border-[#b6ff2e]/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Apport Total Détecté</p>
                <p className="text-3xl font-extrabold text-[#b6ff2e]">{selectedDish.totalCalories} <span className="text-sm font-normal">kcal</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e]">
                <Flame className="w-6 h-6" />
              </div>
            </div>

            {/* Macro Stats Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[#14171d] border border-white/5">
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Protéines</p>
                <p className="text-base font-extrabold text-white">{selectedDish.totalProtein}g</p>
              </div>
              <div className="p-3 rounded-xl bg-[#14171d] border border-white/5">
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Glucides</p>
                <p className="text-base font-extrabold text-white">{selectedDish.totalCarbs}g</p>
              </div>
              <div className="p-3 rounded-xl bg-[#14171d] border border-white/5">
                <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">Lipides</p>
                <p className="text-base font-extrabold text-white">{selectedDish.totalFats}g</p>
              </div>
            </div>

            {/* AI Co-Pilot Advice Box */}
            <div className="p-4 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#b6ff2e]">
                <Zap className="w-4 h-4 text-[#b6ff2e]" />
                <span>Conseil AI Co-Pilot :</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed italic">
                "{selectedDish.aiAdvice}"
              </p>
            </div>

            {/* Confirm & Log Button */}
            <button
              onClick={handleLogMeal}
              className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enregistrer ce repas dans mon Journal</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-5xl p-6 sm:p-8 glass-card rounded-3xl border border-[rgba(255,255,255,0.12)] shadow-[0_25px_60px_rgba(0,0,0,0.9)] my-8">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
