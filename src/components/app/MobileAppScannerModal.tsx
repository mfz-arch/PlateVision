'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Check, Flame, Dumbbell, 
  Trash2, Edit3, Plus, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { ScannedMeal, DetectedItem } from '../../types/plateVision';
import { toLocalDateStr } from '../../lib/date';

interface MobileAppScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageBase64: string | null;
  category: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  targetDateStr: string;
  onMealSaved: (meal: ScannedMeal) => void;
  onRetakePhoto?: () => void;
}

export const MobileAppScannerModal: React.FC<MobileAppScannerModalProps> = ({
  isOpen,
  onClose,
  initialImageBase64,
  category: defaultCategory,
  targetDateStr,
  onMealSaved,
  onRetakePhoto
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'>(defaultCategory);
  const [imageBase64, setImageBase64] = useState<string | null>(initialImageBase64);
  const [isScanning, setIsScanning] = useState<boolean>(false);
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

  // Item editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState<string>('');
  const [editItemGrams, setEditItemGrams] = useState<number>(100);
  const [editItemCalories, setEditItemCalories] = useState<number>(100);

  // AI Correction states
  const [showAiFix, setShowAiFix] = useState<boolean>(false);
  const [aiFixPrompt, setAiFixPrompt] = useState<string>('');
  const [isAiFixing, setIsAiFixing] = useState<boolean>(false);
  const [aiFixError, setAiFixError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    if (initialImageBase64) {
      setImageBase64(initialImageBase64);
      setHasScanned(false);
      setApiError(null);
    }
  }, [initialImageBase64]);

  if (!isOpen || !imageBase64) return null;

  // Run Gemini Vision Analysis
  const handleStartScan = async () => {
    if (!imageBase64 || isScanning) return;
    setIsScanning(true);
    setApiError(null);

    try {
      const res = await fetch('/api/analyze-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg'
        })
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
      console.error('Scan plate error:', err);
      setApiError(err.message || 'Error scanning image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Recalculate totals from items list
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

  // Edit an item
  const handleStartEdit = (item: DetectedItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemGrams(item.weightGrams || 100);
    setEditItemCalories(item.calories || 100);
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    const updated = detectedItems.map((item) => {
      if (item.id === editingItemId) {
        const ratio = (item.weightGrams && item.weightGrams > 0) ? (editItemGrams / item.weightGrams) : 1;
        return {
          ...item,
          name: editItemName.trim() || item.name,
          weightGrams: editItemGrams,
          calories: editItemCalories,
          protein: Math.round((item.protein || 0) * ratio),
          carbs: Math.round((item.carbs || 0) * ratio),
          fats: Math.round((item.fats || 0) * ratio)
        };
      }
      return item;
    });
    setDetectedItems(updated);
    recalculateFromItems(updated);
    setEditingItemId(null);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    const updated = detectedItems.filter((i) => i.id !== id);
    setDetectedItems(updated);
    recalculateFromItems(updated);
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
      boundingBox: { x: 30, y: 30, width: 20, height: 20 }
    };
    const updated = [...detectedItems, newItem];
    setDetectedItems(updated);
    recalculateFromItems(updated);
    handleStartEdit(newItem);
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
              weightGrams: i.weightGrams
            }))
          },
          userCorrection: aiFixPrompt
        })
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
      aiAdvice
    };

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) throw new Error('Please sign in to log meals to your journal.');
        throw new Error(data.error || 'Failed to save meal.');
      }

      // Cache image in localStorage for instant offline/re-render display
      if (imageBase64 && data.meal) {
        const id = data.meal._id || data.meal.id;
        try {
          localStorage.setItem(`pv_photo_${id}`, imageBase64);
        } catch (e) {
          console.warn('Could not cache meal image locally:', e);
        }
      }

      onMealSaved(data.meal as ScannedMeal);
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to save meal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white text-[#0f172a] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden border-t sm:border-2 border-slate-200"
      >
        
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <span className="text-base font-black text-[#0f172a]">Scan Plate</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          
          {/* Meal Category Selector Pills */}
          <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#0f172a] text-[#b6ff2e] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Food Photo Viewport */}
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-200/90 shadow-sm">
            <img 
              src={imageBase64} 
              alt="Meal to scan" 
              className="w-full h-full object-cover"
            />

            {/* Scanning Laser Beam */}
            {isScanning && (
              <div className="scanner-beam" />
            )}

            {/* Scanning Overlay State */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#b6ff2e] animate-spin mb-3" />
                <p className="text-sm font-black text-white">Scanning ingredients...</p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">Calculating calories, protein & macros with Vision AI</p>
              </div>
            )}

            {/* Bounding Box Overlays when Scanned */}
            {hasScanned && detectedItems.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {detectedItems.map((item, idx) => {
                  if (!item.boundingBox) return null;
                  const { x, y, width, height } = item.boundingBox;
                  return (
                    <div
                      key={item.id || idx}
                      className="absolute border-2 border-[#b6ff2e] bg-[#b6ff2e]/15 rounded-lg shadow-sm"
                      style={{
                        left: `${Math.max(5, Math.min(85, x))}%`,
                        top: `${Math.max(5, Math.min(85, y))}%`,
                        width: `${Math.max(15, Math.min(50, width))}%`,
                        height: `${Math.max(15, Math.min(50, height))}%`
                      }}
                    >
                      <span className="absolute -top-6 left-0 px-2 py-0.5 rounded-md bg-[#0f172a] text-[#b6ff2e] text-[10px] font-black truncate max-w-[120px] shadow">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Retake / Change Button */}
            {onRetakePhoto && !isScanning && (
              <button
                type="button"
                onClick={onRetakePhoto}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#0f172a] font-black text-xs shadow-md border border-slate-200 hover:bg-white active:scale-95 transition-all"
              >
                Change photo
              </button>
            )}
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold leading-relaxed">
              {apiError}
            </div>
          )}

          {/* STATE 1: PRE-SCAN (User has selected image, clicks Scan) */}
          {!hasScanned && !isScanning && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleStartScan}
                className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-base shadow-[0_4px_20px_rgba(182,255,46,0.35)] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-[#0f172a]" />
                <span>Scan Meal</span>
              </button>
              <p className="text-center text-[11px] font-semibold text-slate-400">
                Detects portion sizes, calories and macronutrients automatically
              </p>
            </div>
          )}

          {/* STATE 2: POST-SCAN (Analysis Complete) */}
          {hasScanned && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Meal Title & Calorie Banner */}
              <div className="bg-[#0f172a] text-white rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#b6ff2e] bg-white/10 px-2 py-0.5 rounded-full">
                      {selectedCategory}
                    </span>
                    <h3 className="text-lg font-black text-white mt-1.5 leading-tight">{mealTitle}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-3xl font-black text-[#b6ff2e] tracking-tight">{totalCalories}</span>
                      <span className="text-xs font-bold text-slate-300">kcal</span>
                    </div>
                  </div>
                </div>

                {/* 3 Macro Badges */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Protein</p>
                    <p className="text-sm font-black text-[#b6ff2e] mt-0.5">{totalProtein}g</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Carbs</p>
                    <p className="text-sm font-black text-white mt-0.5">{totalCarbs}g</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Fats</p>
                    <p className="text-sm font-black text-white mt-0.5">{totalFats}g</p>
                  </div>
                </div>
              </div>

              {/* Detected Items List with Edit/Delete */}
              <div className="bg-slate-50 rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Detected Ingredients ({detectedItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="text-xs font-black text-[#0f172a] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {detectedItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    if (isEditing) {
                      return (
                        <div key={item.id} className="bg-white rounded-2xl p-3 border-2 border-[#0f172a] space-y-2">
                          <input
                            type="text"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            placeholder="Ingredient name"
                            className="w-full text-xs font-black p-2 rounded-xl bg-slate-100 border border-slate-200 outline-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Weight (g)</label>
                              <input
                                type="number"
                                value={editItemGrams}
                                onChange={(e) => setEditItemGrams(parseInt(e.target.value) || 0)}
                                className="w-full text-xs font-black p-2 rounded-xl bg-slate-100 border border-slate-200 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Calories (kcal)</label>
                              <input
                                type="number"
                                value={editItemCalories}
                                onChange={(e) => setEditItemCalories(parseInt(e.target.value) || 0)}
                                className="w-full text-xs font-black p-2 rounded-xl bg-slate-100 border border-slate-200 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="px-3 py-1.5 rounded-xl bg-[#0f172a] text-xs font-black text-[#b6ff2e]"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={item.id}
                        className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-black text-[#0f172a] truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {item.weightGrams}g • {item.calories} kcal • {item.protein}g P
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg active:scale-90 transition-all"
                            aria-label="Edit item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg active:scale-90 transition-all"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fix Result with AI Accordion */}
              <div className="bg-slate-50 rounded-3xl p-4 border-2 border-slate-200/90 shadow-sm space-y-2">
                <button
                  type="button"
                  onClick={() => setShowAiFix(!showAiFix)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#84cc16]" />
                    <span className="text-xs font-black text-[#0f172a]">Fix result with AI</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{showAiFix ? '▲' : '▼'}</span>
                </button>

                {showAiFix && (
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Did the AI miss an ingredient or overestimate? Tell it what to fix:
                    </p>
                    <textarea
                      value={aiFixPrompt}
                      onChange={(e) => setAiFixPrompt(e.target.value)}
                      placeholder="e.g. It was 2 scrambled eggs, and Greek yogurt instead of sour cream"
                      rows={2}
                      className="w-full text-xs font-bold p-3 rounded-2xl bg-white border border-slate-200 outline-none text-[#0f172a] focus:border-[#0f172a]"
                    />
                    {aiFixError && (
                      <p className="text-[11px] font-bold text-rose-600">{aiFixError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleAiFixSubmit}
                      disabled={isAiFixing || !aiFixPrompt.trim()}
                      className="w-full py-2.5 rounded-xl bg-[#0f172a] text-[#b6ff2e] font-black text-xs active:scale-95 transition-all disabled:opacity-40"
                    >
                      {isAiFixing ? 'AI is adjusting plate...' : 'Apply Correction with AI'}
                    </button>
                  </div>
                )}
              </div>

              {/* AI Nutritionist Advice Card */}
              {aiAdvice && (
                <div className="bg-emerald-50 rounded-3xl p-4 border-2 border-emerald-200 text-emerald-950 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🥗</span>
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                      AI Nutritionist Tips
                    </h4>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                    {aiAdvice}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Bottom Fixed Footer */}
        {hasScanned && (
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleSaveMeal}
              disabled={isSaving}
              className="w-full py-4 rounded-full bg-[#b6ff2e] hover:bg-[#a3f01b] text-[#0f172a] font-black text-sm shadow-[0_4px_20px_rgba(182,255,46,0.35)] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSaving ? 'Logging meal...' : `Save Meal to ${selectedCategory} →`}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

