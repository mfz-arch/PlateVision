'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  Plus,
  Minus,
  RefreshCw,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ScannedMeal, DetectedItem } from '../../types/plateVision';
import { toLocalDateStr } from '../../lib/date';
import { AppThemeTokens, LIGHT_TOKENS } from '../../lib/appTheme';

interface MobileAppScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageBase64: string | null;
  category: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  targetDateStr: string;
  onMealSaved: (meal: ScannedMeal) => void;
  onRetakePhoto?: () => void;
  tokens?: AppThemeTokens;
}

const QUICK_SWAPS = [
  'Grilled chicken breast',
  'White rice',
  'Brown rice',
  'Salmon fillet',
  'Avocado',
  'Steamed broccoli',
  'Scrambled eggs',
  'Oatmeal',
];

export const MobileAppScannerModal: React.FC<MobileAppScannerModalProps> = ({
  isOpen,
  onClose,
  initialImageBase64,
  category: defaultCategory,
  targetDateStr,
  onMealSaved,
  onRetakePhoto,
  tokens = LIGHT_TOKENS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'
  >(defaultCategory);
  const [imageBase64, setImageBase64] = useState<string | null>(initialImageBase64);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [isTakingLong, setIsTakingLong] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Analysis result states
  const [mealTitle, setMealTitle] = useState<string>('Scanned Meal');
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalFats, setTotalFats] = useState<number>(0);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Edit Bottom Sheet states
  const [editingItem, setEditingItem] = useState<DetectedItem | null>(null);
  const [editItemName, setEditItemName] = useState<string>('');
  const [editItemGrams, setEditItemGrams] = useState<number>(100);
  const [editBaseGrams, setEditBaseGrams] = useState<number>(100);
  const [editBaseCalories, setEditBaseCalories] = useState<number>(100);
  const [editBaseProtein, setEditBaseProtein] = useState<number>(0);
  const [editBaseCarbs, setEditBaseCarbs] = useState<number>(0);
  const [editBaseFats, setEditBaseFats] = useState<number>(0);
  const [showSwapList, setShowSwapList] = useState<boolean>(false);

  // AI Correction states ("Fix Result")
  const [showAiFix, setShowAiFix] = useState<boolean>(false);
  const [aiFixPrompt, setAiFixPrompt] = useState<string>('');
  const [isAiFixing, setIsAiFixing] = useState<boolean>(false);
  const [aiFixError, setAiFixError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSelectedCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    if (initialImageBase64) {
      setImageBase64(initialImageBase64);
      setHasScanned(false);
      setApiError(null);
      setEditingItem(null);
    }
  }, [initialImageBase64]);

  // Animate 3-step checklist & 8s slow-network message while scanning
  useEffect(() => {
    if (!isScanning) {
      setScanStep(0);
      setIsTakingLong(false);
      return;
    }
    setScanStep(1);
    const t1 = setTimeout(() => setScanStep(2), 1100);
    const t2 = setTimeout(() => setScanStep(3), 2300);
    const t3 = setTimeout(() => setIsTakingLong(true), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isScanning]);

  if (!isOpen || !imageBase64) return null;

  const recalculateFromItems = (items: DetectedItem[]) => {
    const cals = items.reduce((sum, i) => sum + (i.calories || 0), 0);
    const prot = items.reduce((sum, i) => sum + (i.protein || 0), 0);
    const carbs = items.reduce((sum, i) => sum + (i.carbs || 0), 0);
    const fats = items.reduce((sum, i) => sum + (i.fats || 0), 0);
    setTotalCalories(cals);
    setTotalProtein(prot);
    setTotalCarbs(carbs);
    setTotalFats(fats);
  };

  // Run Vision Analysis
  const handleStartScan = async () => {
    if (!imageBase64 || isScanning) return;
    setIsScanning(true);
    setApiError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/analyze-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired. Please sign in again.');
        throw new Error(data.error || 'Failed to analyze plate. Please try another angle.');
      }

      if (data.dish) {
        const dish = data.dish;
        setMealTitle(dish.title || 'Scanned Meal');
        setTotalCalories(dish.totalCalories || 0);
        setTotalProtein(dish.totalProtein || 0);
        setTotalCarbs(dish.totalCarbs || 0);
        setTotalFats(dish.totalFats || 0);
        setDetectedItems(dish.detectedItems || []);
        setAiAdvice(dish.aiAdvice || 'Balanced meal aligned with your daily nutrition plan.');
        if (typeof dish.imageUrl === 'string' && dish.imageUrl.startsWith('https://')) {
          setUploadedImageUrl(dish.imageUrl);
        }
        setHasScanned(true);
      } else {
        throw new Error('No food detected in this image. Please take a clearer photo.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Scan plate error:', err);
      setApiError(err.message || 'Error scanning image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelScan = () => {
    abortControllerRef.current?.abort();
    setIsScanning(false);
    onClose();
  };

  // Inline one-tap portion stepper (-/+ 25g)
  const handleStepItem = (id: string, deltaGrams: number) => {
    const updated = detectedItems.map((item) => {
      if (item.id !== id) return item;
      const oldGrams = Math.max(10, item.weightGrams || 100);
      const nextGrams = Math.max(10, oldGrams + deltaGrams);
      const ratio = nextGrams / oldGrams;
      return {
        ...item,
        weightGrams: nextGrams,
        calories: Math.max(0, Math.round((item.calories || 0) * ratio)),
        protein: Math.max(0, Math.round((item.protein || 0) * ratio)),
        carbs: Math.max(0, Math.round((item.carbs || 0) * ratio)),
        fats: Math.max(0, Math.round((item.fats || 0) * ratio)),
      };
    });
    setDetectedItems(updated);
    recalculateFromItems(updated);
  };

  // Open Edit Bottom Sheet for an item
  const handleOpenEditSheet = (item: DetectedItem) => {
    const baseG = Math.max(10, item.weightGrams || 100);
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemGrams(baseG);
    setEditBaseGrams(baseG);
    setEditBaseCalories(item.calories || 0);
    setEditBaseProtein(item.protein || 0);
    setEditBaseCarbs(item.carbs || 0);
    setEditBaseFats(item.fats || 0);
    setShowSwapList(false);
  };

  const editRatio = editBaseGrams > 0 ? editItemGrams / editBaseGrams : 1;
  const previewKcal = Math.round(editBaseCalories * editRatio);
  const previewP = Math.round(editBaseProtein * editRatio);
  const previewC = Math.round(editBaseCarbs * editRatio);
  const previewF = Math.round(editBaseFats * editRatio);

  const handleSaveEditSheet = () => {
    if (!editingItem) return;
    const updated = detectedItems.map((item) => {
      if (item.id !== editingItem.id) return item;
      return {
        ...item,
        name: editItemName.trim() || item.name,
        weightGrams: editItemGrams,
        calories: previewKcal,
        protein: previewP,
        carbs: previewC,
        fats: previewF,
      };
    });
    setDetectedItems(updated);
    recalculateFromItems(updated);
    setEditingItem(null);
  };

  const handleRemoveFromSheet = () => {
    if (!editingItem) return;
    const updated = detectedItems.filter((i) => i.id !== editingItem.id);
    setDetectedItems(updated);
    recalculateFromItems(updated);
    setEditingItem(null);
  };

  // Add manual item
  const handleAddManualItem = () => {
    const newItem: DetectedItem = {
      id: `manual-${Date.now()}`,
      name: 'Custom Ingredient',
      weightGrams: 100,
      calories: 120,
      protein: 8,
      carbs: 12,
      fats: 4,
      boundingBox: { x: 40, y: 40, width: 20, height: 20 },
    };
    const updated = [...detectedItems, newItem];
    setDetectedItems(updated);
    recalculateFromItems(updated);
    handleOpenEditSheet(newItem);
  };

  // AI Fix Result
  const handleAiFixSubmit = async () => {
    if (!aiFixPrompt.trim() || !imageBase64) return;
    setIsAiFixing(true);
    setAiFixError(null);

    try {
      const res = await fetch('/api/fix-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          previousResult: {
            title: mealTitle,
            detectedItems: detectedItems.map((i) => ({
              name: i.name,
              calories: i.calories,
              protein: i.protein,
              carbs: i.carbs,
              fats: i.fats,
              weightGrams: i.weightGrams,
            })),
          },
          userCorrection: aiFixPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI adjustment failed. Try rephrasing.');

      if (data.dish) {
        setMealTitle(data.dish.title || mealTitle);
        setTotalCalories(data.dish.totalCalories || totalCalories);
        setTotalProtein(data.dish.totalProtein || totalProtein);
        setTotalCarbs(data.dish.totalCarbs || totalCarbs);
        setTotalFats(data.dish.totalFats || totalFats);
        setDetectedItems(data.dish.detectedItems || detectedItems);
        setAiAdvice(data.dish.aiAdvice || aiAdvice);
        setAiFixPrompt('');
        setShowAiFix(false);
      }
    } catch (err: any) {
      setAiFixError(err.message || 'Failed to adjust meal.');
    } finally {
      setIsAiFixing(false);
    }
  };

  // Save meal to database
  const handleSaveMeal = async () => {
    if (isSaving || isScanning || !hasScanned) return;
    setIsSaving(true);
    setApiError(null);

    const finalImage = uploadedImageUrl || imageBase64;
    const payload = {
      title: mealTitle,
      category: selectedCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: targetDateStr || toLocalDateStr(),
      imageUrl: finalImage,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      detectedItems,
      aiAdvice,
    };

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) throw new Error('Please sign in to log meals to your journal.');
        throw new Error(data.error || 'Failed to save meal.');
      }

      if (imageBase64 && data.meal) {
        const id = data.meal._id || data.meal.id;
        try {
          localStorage.setItem(`pv_photo_${id}`, imageBase64);
        } catch {}
      }

      onMealSaved(data.meal as ScannedMeal);
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to save meal.');
    } finally {
      setIsSaving(false);
    }
  };

  // Low-confidence check helper (honest about uncertainty per Page 6)
  const isLowConfidence = (item: DetectedItem) =>
    !item.weightGrams ||
    item.weightGrams <= 0 ||
    item.name.toLowerCase().includes('sauce') ||
    item.name.toLowerCase().includes('mixed') ||
    item.name.toLowerCase().includes('oil');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-h-[94vh] flex flex-col overflow-hidden border relative"
        style={{
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          color: tokens.ink,
        }}
      >
        {/* Top Modal Header */}
        <div
          className="px-4 py-3.5 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <button
            type="button"
            onClick={isScanning ? handleCancelScan : onClose}
            aria-label="Back"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ backgroundColor: tokens.surfaceMuted, color: tokens.ink }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold">
            {isScanning ? 'Analyzing your meal' : hasScanned ? 'Review meal' : 'Confirm photo'}
          </span>
          <button
            type="button"
            onClick={isScanning ? handleCancelScan : onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ backgroundColor: tokens.surfaceMuted, color: tokens.ink }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* Food Photo Header + Numbered Pins */}
          <div
            className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden border"
            style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
          >
            <img src={imageBase64} alt="Meal preview" className="w-full h-full object-cover" />

            {/* Animated Scan Line while analyzing */}
            {isScanning && <div className="scanner-beam" />}

            {/* Numbered Detection Pins matching rows below */}
            {hasScanned &&
              detectedItems.map((item, idx) => {
                if (!item.boundingBox) return null;
                const cx = Math.max(10, Math.min(90, item.boundingBox.x + item.boundingBox.width / 2));
                const cy = Math.max(12, Math.min(88, item.boundingBox.y + item.boundingBox.height / 2));
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleOpenEditSheet(item)}
                    style={{
                      left: `${cx}%`,
                      top: `${cy}%`,
                      backgroundColor: tokens.primary,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-md transition-transform active:scale-90"
                  >
                    {idx + 1}
                  </button>
                );
              })}

            {/* Retake / Change photo chip */}
            {onRetakePhoto && !isScanning && (
              <button
                type="button"
                onClick={onRetakePhoto}
                className="absolute bottom-3 right-3 px-3.5 py-2 rounded-full text-xs font-semibold shadow-md border transition-transform active:scale-95"
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.ink,
                }}
              >
                Change photo
              </button>
            )}
          </div>

          {/* Error Message */}
          {apiError && (
            <div
              className="p-3.5 rounded-[14px] border text-xs font-semibold flex items-start gap-2.5"
              style={{
                backgroundColor: tokens.isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2',
                borderColor: tokens.error,
                color: tokens.error,
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{apiError}</p>
                <button
                  type="button"
                  onClick={handleStartScan}
                  className="mt-1.5 underline font-bold"
                >
                  Retry scan
                </button>
              </div>
            </div>
          )}

          {/* STATE 1: PRE-SCAN */}
          {!hasScanned && !isScanning && (
            <div className="space-y-3 pt-1">
              {/* Meal Type Segmented Control */}
              <div
                className="grid grid-cols-4 gap-1 p-1 rounded-full border"
                style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
              >
                {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="py-2 text-xs font-semibold rounded-full transition-all min-h-[38px]"
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

              <button
                type="button"
                onClick={handleStartScan}
                className="w-full py-3.5 rounded-[14px] text-white font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.99] min-h-[52px]"
                style={{ backgroundColor: tokens.primary }}
              >
                <Sparkles className="w-5 h-5" />
                <span>Scan meal</span>
              </button>
              <p className="text-center text-xs" style={{ color: tokens.muted }}>
                Detects ingredients, portion sizes, and P / C / F macros
              </p>
            </div>
          )}

          {/* STATE 2: ANALYZING (3-Step Checklist + Progress Bar + Always Cancelable) */}
          {isScanning && (
            <div
              className="rounded-[20px] p-5 border space-y-4"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {isTakingLong ? 'Still working...' : 'Identifying foods...'}
                </span>
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: tokens.primaryBright }}
                />
              </div>

              {/* Progress Bar */}
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: tokens.surfaceMuted }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    backgroundColor: tokens.primaryBright,
                    width: `${scanStep === 1 ? 35 : scanStep === 2 ? 70 : 92}%`,
                  }}
                />
              </div>

              {/* 3-Step Checklist */}
              <div className="space-y-2.5 text-xs font-medium">
                {[
                  { step: 1, label: 'Detecting items' },
                  { step: 2, label: 'Estimating portions' },
                  { step: 3, label: 'Calculating macros' },
                ].map((item) => {
                  const done = scanStep > item.step;
                  const active = scanStep === item.step;
                  return (
                    <div key={item.step} className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px]"
                        style={{
                          backgroundColor: done
                            ? tokens.primaryBright
                            : active
                            ? tokens.primarySoft
                            : 'transparent',
                          borderColor: done || active ? tokens.primaryBright : tokens.border,
                          color: done ? '#FFFFFF' : tokens.primaryBright,
                        }}
                      >
                        {done ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                      </div>
                      <span
                        style={{
                          color: done || active ? tokens.ink : tokens.muted,
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCancelScan}
                className="w-full py-2.5 text-xs font-semibold min-h-[44px]"
                style={{ color: tokens.muted }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* STATE 3: RESULT & REVIEW (Page 6) */}
          {hasScanned && (
            <div className="space-y-4">
              {/* Meal-Type Segmented Control */}
              <div
                className="grid grid-cols-4 gap-1 p-1 rounded-full border"
                style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
              >
                {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="py-2 text-xs font-semibold rounded-full transition-all min-h-[38px]"
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

              {/* Brand-Green Total Card */}
              <div
                className="rounded-[20px] p-5 text-white space-y-3"
                style={{ backgroundColor: tokens.primary }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-white/80">Total · {mealTitle}</p>
                    <p className="text-[32px] leading-[38px] font-bold tabular-nums mt-0.5">
                      {totalCalories.toLocaleString()} kcal
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                    P {totalProtein}g
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                    C {totalCarbs}g
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                    F {totalFats}g
                  </span>
                </div>
              </div>

              {/* Detected Items Header */}
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-sm font-semibold">
                  Detected items ({detectedItems.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddManualItem}
                  className="text-xs font-semibold flex items-center gap-1 min-h-[36px] px-2"
                  style={{ color: tokens.primaryBright }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add item</span>
                </button>
              </div>

              {/* Item Rows with -/+ Stepper & Low-Confidence Flag */}
              <div className="space-y-2.5">
                {detectedItems.map((item, idx) => {
                  const lowConf = isLowConfidence(item);
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => handleOpenEditSheet(item)}
                      className="rounded-[20px] p-3.5 border flex items-center gap-3 cursor-pointer transition-all active:scale-[0.99]"
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: lowConf ? tokens.warning : tokens.border,
                        borderWidth: lowConf ? '1.5px' : '1px',
                      }}
                    >
                      {/* Numbered Pin Badge */}
                      <div
                        className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: tokens.primarySoft,
                          color: tokens.isDark ? tokens.primaryBright : tokens.primary,
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Name + Portion / Low-Confidence Tag */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        {lowConf ? (
                          <span
                            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: tokens.isDark
                                ? 'rgba(245,158,11,0.2)'
                                : '#FEF3C7',
                              color: tokens.warning,
                            }}
                          >
                            Check portion
                          </span>
                        ) : (
                          <p className="text-xs tabular-nums mt-0.5" style={{ color: tokens.muted }}>
                            {item.weightGrams || 100} g
                          </p>
                        )}
                      </div>

                      {/* Quick - / + Stepper */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleStepItem(item.id, -25)}
                          aria-label={`Decrease ${item.name} portion`}
                          className="w-8 h-8 rounded-full border flex items-center justify-center active:scale-90"
                          style={{
                            borderColor: tokens.border,
                            backgroundColor: tokens.surfaceMuted,
                          }}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepItem(item.id, 25)}
                          aria-label={`Increase ${item.name} portion`}
                          className="w-8 h-8 rounded-full border flex items-center justify-center active:scale-90"
                          style={{
                            borderColor: tokens.border,
                            backgroundColor: tokens.surfaceMuted,
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Calories */}
                      <div className="text-right shrink-0 min-w-[44px]">
                        <p className="text-sm font-bold tabular-nums">{item.calories}</p>
                        <p className="text-[10px]" style={{ color: tokens.muted }}>
                          kcal
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Tip + "Fix Result" AI Correction (Preserved!) */}
              {aiAdvice && (
                <div
                  className="rounded-[20px] p-4 border space-y-1"
                  style={{
                    backgroundColor: tokens.primarySoft,
                    borderColor: tokens.border,
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: tokens.isDark ? tokens.primaryBright : tokens.primary }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nutrition Tip</span>
                  </p>
                  <p className="text-xs leading-relaxed">{aiAdvice}</p>
                </div>
              )}

              <div className="pt-1">
                {!showAiFix ? (
                  <button
                    type="button"
                    onClick={() => setShowAiFix(true)}
                    className="w-full py-3 rounded-[14px] border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px]"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.ink,
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" style={{ color: tokens.primaryBright }} />
                    <span>Fix Result with AI</span>
                  </button>
                ) : (
                  <div
                    className="rounded-[20px] p-4 border space-y-2.5"
                    style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Describe correction</span>
                      <button
                        type="button"
                        onClick={() => setShowAiFix(false)}
                        className="text-xs"
                        style={{ color: tokens.muted }}
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      value={aiFixPrompt}
                      onChange={(e) => setAiFixPrompt(e.target.value)}
                      placeholder="e.g., Cooked with 1 tbsp olive oil, swap rice for quinoa"
                      className="w-full px-3.5 py-2.5 rounded-[14px] border text-xs outline-none"
                      style={{
                        backgroundColor: tokens.surfaceMuted,
                        borderColor: tokens.border,
                        color: tokens.ink,
                      }}
                    />
                    {aiFixError && (
                      <p className="text-[11px] font-medium" style={{ color: tokens.error }}>
                        {aiFixError}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={isAiFixing || !aiFixPrompt.trim()}
                      onClick={handleAiFixSubmit}
                      className="w-full py-3 rounded-[14px] text-white text-xs font-semibold disabled:opacity-50 min-h-[44px]"
                      style={{ backgroundColor: tokens.primary }}
                    >
                      {isAiFixing ? 'Recalculating...' : 'Apply AI Fix'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Save Button (Always visible when scanned, per Page 6) */}
        {hasScanned && !editingItem && (
          <div
            className="p-4 border-t shrink-0"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
          >
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveMeal}
              className="w-full py-3.5 rounded-[14px] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60 min-h-[50px]"
              style={{ backgroundColor: tokens.primary }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save to {selectedCategory}</span>
              )}
            </button>
          </div>
        )}

        {/* EDIT BOTTOM SHEET (Opens over the photo when tapping a row, per Page 6) */}
        {editingItem && (
          <div className="fixed inset-0 z-[60] bg-black/45 flex items-end justify-center">
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-[28px] p-6 space-y-4 border-t shadow-2xl animate-in slide-in-from-bottom duration-200"
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
                <h3 className="text-lg font-bold">Edit item</h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tokens.surfaceMuted }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Food Name + Swap button */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-[14px] border text-sm font-medium outline-none"
                    style={{
                      backgroundColor: tokens.surfaceMuted,
                      borderColor: tokens.border,
                      color: tokens.ink,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwapList((s) => !s)}
                    className="px-3.5 py-2.5 rounded-[14px] text-xs font-semibold border min-h-[42px]"
                    style={{
                      backgroundColor: tokens.primarySoft,
                      borderColor: tokens.border,
                      color: tokens.isDark ? tokens.primaryBright : tokens.primary,
                    }}
                  >
                    Swap
                  </button>
                </div>

                {showSwapList && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_SWAPS.map((food) => (
                      <button
                        key={food}
                        type="button"
                        onClick={() => {
                          setEditItemName(food);
                          setShowSwapList(false);
                        }}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                        style={{
                          backgroundColor: tokens.surfaceMuted,
                          borderColor: tokens.border,
                        }}
                      >
                        {food}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Portion Slider + Quick Multiplier Chips */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: tokens.muted }}
                  >
                    Portion
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums">{editItemGrams} g</span>
                    <span className="text-xs font-medium tabular-nums" style={{ color: tokens.muted }}>
                      = {previewKcal} kcal
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={10}
                  max={Math.max(400, editBaseGrams * 3)}
                  step={5}
                  value={editItemGrams}
                  onChange={(e) => setEditItemGrams(Number(e.target.value))}
                  className="w-full h-2 rounded-lg cursor-pointer"
                  style={{ accentColor: tokens.primaryBright }}
                />

                {/* x1/2, x1, x1 1/2, x2 chips */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '½×', mult: 0.5 },
                    { label: '1×', mult: 1 },
                    { label: '1½×', mult: 1.5 },
                    { label: '2×', mult: 2 },
                  ].map((m) => {
                    const targetG = Math.max(10, Math.round(editBaseGrams * m.mult));
                    const active = Math.abs(editItemGrams - targetG) <= 3;
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setEditItemGrams(targetG)}
                        className="py-2 rounded-full text-xs font-semibold border transition-all min-h-[38px]"
                        style={{
                          backgroundColor: active ? tokens.primarySoft : tokens.surfaceMuted,
                          borderColor: active ? tokens.primaryBright : tokens.border,
                          color: active
                            ? tokens.isDark
                              ? tokens.primaryBright
                              : tokens.primary
                            : tokens.ink,
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Macro Preview */}
              <div
                className="grid grid-cols-3 gap-2 p-3 rounded-[16px] border text-center"
                style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }}
              >
                <div>
                  <p className="text-[11px] font-medium" style={{ color: tokens.protein }}>
                    ● Protein (P)
                  </p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{previewP} g</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium" style={{ color: tokens.carbs }}>
                    ● Carbs (C)
                  </p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{previewC} g</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium" style={{ color: tokens.fat }}>
                    ● Fat (F)
                  </p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{previewF} g</p>
                </div>
              </div>

              {/* Remove & Update Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRemoveFromSheet}
                  className="flex-1 py-3.5 rounded-[14px] border text-sm font-semibold min-h-[48px]"
                  style={{
                    borderColor: tokens.error,
                    color: tokens.error,
                    backgroundColor: 'transparent',
                  }}
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditSheet}
                  className="flex-1 py-3.5 rounded-[14px] text-white text-sm font-semibold min-h-[48px]"
                  style={{ backgroundColor: tokens.primary }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
