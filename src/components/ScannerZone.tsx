import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, CheckCircle2, RefreshCw, X, Flame, 
  Dumbbell, Layers, Info, ArrowRight, Zap, Image as ImageIcon,
  Edit3, MessageSquare, Save, Trash2, PlusCircle
} from 'lucide-react';
import { SAMPLE_DISHES } from '../data/mockPlateData';
import { SampleDish, ScannedMeal, DetectedItem } from '../types/plateVision';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const [selectedDish, setSelectedDish] = useState<SampleDish | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSourceChoiceModal, setShowSourceChoiceModal] = useState<boolean>(false);

  // Fix Result states
  const [showFixPanel, setShowFixPanel] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<DetectedItem>>({});
  const [aiFixText, setAiFixText] = useState<string>('');
  const [isAiFixing, setIsAiFixing] = useState<boolean>(false);
  const [aiFixError, setAiFixError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (dish: SampleDish) => {
    setSelectedDish(dish);
    setCustomImage(null);
    setApiError(null);
    triggerScanAnimation();
  };

  const triggerScanAnimation = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    return interval;
  };

  const compressImage = (file: File, maxWidth = 800): Promise<string> => {
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
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setApiError(null);

    try {
      // 1. Client-side compress high-res photo (max 800px) for ultra-fast mobile upload
      const compressedBase64 = await compressImage(file, 800);
      if (!compressedBase64) {
        throw new Error('Could not read image file from device.');
      }

      // Set custom image and temporary placeholder dish so the viewport renders IMMEDIATELY with loading state!
      setCustomImage(compressedBase64);
      setSelectedDish({
        id: 'scanning-temp',
        title: 'Analyzing Plate...',
        category: 'Vision AI Analysis',
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        imageUrl: compressedBase64,
        detectedItems: [],
        aiAdvice: 'Analyzing meal contents...'
      });

      // Start scanning animation
      const interval = triggerScanAnimation();

      // 2. Call Next.js Gemini API Route
      const res = await fetch('/api/analyze-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedBase64,
          mimeType: 'image/jpeg'
        })
      });

      const data = await res.json();

      clearInterval(interval);
      setScanProgress(100);
      setIsScanning(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze plate with Gemini Vision AI.');
      }

      if (data.dish) {
        const customDish: SampleDish = {
          ...data.dish,
          imageUrl: compressedBase64
        };
        setSelectedDish(customDish);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setIsScanning(false);
      setScanProgress(100);
      setApiError(err?.message || 'Error scanning image. Please try again.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // --- Fix Result Handlers ---
  const startEditItem = (item: DetectedItem) => {
    setEditingItemId(item.id);
    setEditValues({ ...item });
  };

  const saveEditItem = () => {
    if (!selectedDish || !editingItemId || !editValues) return;
    const updatedItems = selectedDish.detectedItems.map((item) =>
      item.id === editingItemId
        ? { ...item, ...editValues, id: item.id, boundingBox: item.boundingBox }
        : item
    );
    const totalCal = updatedItems.reduce((s, i) => s + (i.calories || 0), 0);
    const totalProt = updatedItems.reduce((s, i) => s + (i.protein || 0), 0);
    const totalCarb = updatedItems.reduce((s, i) => s + (i.carbs || 0), 0);
    const totalFat = updatedItems.reduce((s, i) => s + (i.fats || 0), 0);
    setSelectedDish({
      ...selectedDish,
      detectedItems: updatedItems,
      totalCalories: totalCal,
      totalProtein: totalProt,
      totalCarbs: totalCarb,
      totalFats: totalFat
    });
    setEditingItemId(null);
    setEditValues({});
  };

  const deleteItem = (itemId: string) => {
    if (!selectedDish) return;
    const updatedItems = selectedDish.detectedItems.filter((i) => i.id !== itemId);
    const totalCal = updatedItems.reduce((s, i) => s + (i.calories || 0), 0);
    const totalProt = updatedItems.reduce((s, i) => s + (i.protein || 0), 0);
    const totalCarb = updatedItems.reduce((s, i) => s + (i.carbs || 0), 0);
    const totalFat = updatedItems.reduce((s, i) => s + (i.fats || 0), 0);
    setSelectedDish({
      ...selectedDish,
      detectedItems: updatedItems,
      totalCalories: totalCal,
      totalProtein: totalProt,
      totalCarbs: totalCarb,
      totalFats: totalFat
    });
  };

  const addManualItem = () => {
    if (!selectedDish) return;
    const newItem: DetectedItem = {
      id: `manual-${Date.now()}`,
      name: 'New Food Item',
      calories: 100,
      protein: 5,
      carbs: 15,
      fats: 3,
      weightGrams: 100,
      boundingBox: { x: 30, y: 30, width: 25, height: 25 }
    };
    const updatedItems = [...selectedDish.detectedItems, newItem];
    setSelectedDish({
      ...selectedDish,
      detectedItems: updatedItems,
      totalCalories: selectedDish.totalCalories + 100,
      totalProtein: selectedDish.totalProtein + 5,
      totalCarbs: selectedDish.totalCarbs + 15,
      totalFats: selectedDish.totalFats + 3
    });
    startEditItem(newItem);
  };

  const handleAiFix = async () => {
    if (!selectedDish || !aiFixText.trim() || !customImage) return;
    setIsAiFixing(true);
    setAiFixError(null);
    try {
      const res = await fetch('/api/fix-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: customImage,
          mimeType: 'image/jpeg',
          previousResult: {
            title: selectedDish.title,
            detectedItems: selectedDish.detectedItems.map((i) => ({
              name: i.name,
              calories: i.calories,
              protein: i.protein,
              carbs: i.carbs,
              fats: i.fats,
              weightGrams: i.weightGrams
            }))
          },
          userCorrection: aiFixText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI fix failed');
      if (data.dish) {
        setSelectedDish({ ...data.dish, imageUrl: selectedDish.imageUrl });
        setAiFixText('');
        setShowFixPanel(false);
      }
    } catch (err: any) {
      setAiFixError(err?.message || 'Failed to fix result with AI');
    } finally {
      setIsAiFixing(false);
    }
  };

  const handleLogMeal = () => {
    if (!selectedDish) return;
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
              <span>{t('scannerTitle')}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#b6ff2e]/20 text-[#b6ff2e] border border-[#b6ff2e]/40">
                Gemini Vision API
              </span>
            </h3>
            <p className="text-xs text-[#9ea3b0]">{t('scannerSubtitle')}</p>
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

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3 text-red-400 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Scan Error</p>
              <p className="mt-0.5 leading-relaxed text-red-300">{apiError}</p>
            </div>
          </div>
          <button 
            onClick={() => setApiError(null)} 
            className="p-1 rounded-lg hover:bg-white/10 text-red-400 hover:text-white transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Dish Selector & Upload Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {SAMPLE_DISHES.map((dish) => (
          <button
            key={dish.id}
            onClick={() => handleSelectSample(dish)}
            className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              selectedDish?.id === dish.id && !customImage
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

        {/* Hidden Inputs for Gallery vs Camera */}
        <input 
          ref={galleryInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* Upload Custom File Trigger */}
        <button 
          onClick={() => setShowSourceChoiceModal(true)}
          className="p-2.5 rounded-2xl bg-[#14171d] border border-dashed border-[#b6ff2e]/50 hover:border-[#b6ff2e] cursor-pointer flex items-center justify-center gap-2 text-[#b6ff2e] font-bold text-xs transition-all hover:bg-[#b6ff2e]/5"
        >
          <Camera className="w-4 h-4 text-[#b6ff2e]" />
          <span>{t('uploadPhoto')}</span>
        </button>
      </div>

      {/* Choice Modal for Upload Source (Gallery vs Camera) */}
      {showSourceChoiceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-6 glass-card rounded-3xl border border-white/10 text-center space-y-5 animate-in zoom-in duration-200">
            <h4 className="text-lg font-extrabold text-white">Choose Photo Source</h4>
            <p className="text-xs text-[#9ea3b0]">Select how you want to upload your meal photo</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSourceChoiceModal(false);
                  galleryInputRef.current?.click();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#14171d] border border-white/10 hover:border-[#b6ff2e] hover:bg-[#b6ff2e]/10 text-white text-sm font-bold flex items-center justify-center gap-3 transition-all"
              >
                <ImageIcon className="w-5 h-5 text-[#b6ff2e]" />
                <span>Upload from Galerie</span>
              </button>

              <button
                onClick={() => {
                  setShowSourceChoiceModal(false);
                  cameraInputRef.current?.click();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#14171d] border border-white/10 hover:border-[#b6ff2e] hover:bg-[#b6ff2e]/10 text-white text-sm font-bold flex items-center justify-center gap-3 transition-all"
              >
                <Camera className="w-5 h-5 text-[#b6ff2e]" />
                <span>Take Picture Directly</span>
              </button>
            </div>

            <button
              onClick={() => setShowSourceChoiceModal(false)}
              className="text-xs font-semibold text-[#9ea3b0] hover:text-white pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Image Viewport with Bounding Boxes OR Empty State Upload Dropzone */}
      {!selectedDish ? (
        <div 
          onClick={() => setShowSourceChoiceModal(true)}
          className="p-10 sm:p-14 text-center border-2 border-dashed border-[#b6ff2e]/40 hover:border-[#b6ff2e] bg-[#14171d]/80 glass-card rounded-3xl cursor-pointer space-y-4 hover:bg-[#b6ff2e]/5 transition-all group"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e] group-hover:scale-110 transition-all shadow-[0_0_25px_rgba(182,255,46,0.2)]">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-extrabold text-white">Scan Your Meal with Gemini Vision AI</h4>
            <p className="text-xs text-[#9ea3b0] mt-1 max-w-md mx-auto leading-relaxed">
              Upload a meal photo from your Galerie or take a picture directly to calculate calories, protein, carbs & fats with automatic green box overlays.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(182,255,46,0.3)]">
            <Upload className="w-4 h-4" />
            <span>Upload Photo / Open Camera</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-[#14171d] border border-[rgba(255,255,255,0.1)] group">
            
            <img 
              src={selectedDish.imageUrl} 
              alt={selectedDish.title}
              className="w-full h-[360px] object-cover transition-all duration-500"
            />

            {isScanning && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]">
                <div className="scanner-beam" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#14171d]/90 border border-[#b6ff2e]/40 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#b6ff2e]">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#b6ff2e]" />
                    <span>{t('scanningInProgress')} ({scanProgress}%)...</span>
                  </div>
                </div>
              </div>
            )}

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
              {t('hoverBoxInstruction')}
            </div>
          </div>

          {/* Right Column: Nutrient Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 glass-card rounded-3xl border border-[rgba(255,255,255,0.1)] space-y-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-[#b6ff2e]/15 text-[#b6ff2e] border border-[#b6ff2e]/30">
                  {selectedDish.category}
                </span>
                <h4 className="text-lg font-extrabold text-white mt-2 leading-snug">{selectedDish.title}</h4>
              </div>

              <div className="p-4 rounded-2xl bg-[#14171d] border border-[#b6ff2e]/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">{t('scannerTitle')}</p>
                  <p className="text-3xl font-extrabold text-[#b6ff2e]">{selectedDish.totalCalories} <span className="text-sm font-normal">kcal</span></p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e]">
                  <Flame className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#14171d] border border-white/5">
                  <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">{t('proteinsLabel')}</p>
                  <p className="text-base font-extrabold text-white">{selectedDish.totalProtein}g</p>
                </div>
                <div className="p-3 rounded-xl bg-[#14171d] border border-white/5">
                  <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">{t('carbsLabel')}</p>
                  <p className="text-base font-extrabold text-white">{selectedDish.totalCarbs}g</p>
                </div>
                <div className="p-3 rounded-xl bg-[#14171d] border border-white/5">
                  <p className="text-[10px] text-[#9ea3b0] uppercase font-bold">{t('fatsLabel')}</p>
                  <p className="text-base font-extrabold text-white">{selectedDish.totalFats}g</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#b6ff2e]">
                  <Zap className="w-4 h-4 text-[#b6ff2e]" />
                  <span>{t('aiAdviceTitle')} :</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed italic">
                  "{selectedDish.aiAdvice}"
                </p>
              </div>

              {/* Fix Result Toggle Button */}
              <button
                onClick={() => setShowFixPanel(!showFixPanel)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                  showFixPanel
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-[#14171d] border-white/10 text-[#9ea3b0] hover:border-amber-500/40 hover:text-amber-400'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showFixPanel ? 'Close Fix Panel' : 'Fix / Edit Result'}</span>
              </button>

              {/* Fix Result Panel */}
              {showFixPanel && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#14171d] border border-amber-500/30 animate-in slide-in-from-top duration-200">
                  <p className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Edit Detected Items</p>

                  {/* Editable Items List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedDish.detectedItems.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-[#1a1d24] border border-white/5 space-y-2">
                        {editingItemId === item.id ? (
                          /* Editing Mode */
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editValues.name || ''}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-[#14171d] border border-amber-500/40 text-white text-xs font-bold focus:outline-none focus:border-[#b6ff2e]"
                              placeholder="Food name"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['calories', 'protein', 'carbs', 'fats', 'weightGrams'] as const).map((field) => (
                                <div key={field} className="flex items-center gap-1">
                                  <label className="text-[9px] text-[#9ea3b0] uppercase font-bold w-12 shrink-0">
                                    {field === 'weightGrams' ? 'Weight' : field}
                                  </label>
                                  <input
                                    type="number"
                                    value={editValues[field] || 0}
                                    onChange={(e) => setEditValues({ ...editValues, [field]: Number(e.target.value) })}
                                    className="w-full px-2 py-1 rounded-md bg-[#14171d] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#b6ff2e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditItem}
                                className="flex-1 py-1.5 rounded-lg bg-[#b6ff2e] text-[#14171d] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={() => { setEditingItemId(null); setEditValues({}); }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-[#9ea3b0] text-[10px] font-bold transition-all hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display Mode */
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">{item.name}</p>
                              <p className="text-[10px] text-[#9ea3b0]">
                                {item.calories}kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fats}g · {item.weightGrams}g
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditItem(item)}
                                className="p-1.5 rounded-lg hover:bg-amber-500/15 text-[#9ea3b0] hover:text-amber-400 transition-all"
                                title="Edit item"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/15 text-[#9ea3b0] hover:text-red-400 transition-all"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Manual Item Button */}
                  <button
                    onClick={addManualItem}
                    className="w-full py-2 rounded-xl border border-dashed border-[#b6ff2e]/40 text-[#b6ff2e] text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#b6ff2e]/5 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Food Item Manually
                  </button>

                  {/* AI Re-fix Section */}
                  {customImage && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-[10px] uppercase font-extrabold text-[#b6ff2e] tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> Ask AI to Fix
                      </p>
                      <textarea
                        value={aiFixText}
                        onChange={(e) => setAiFixText(e.target.value)}
                        placeholder={"E.g., \"That's fufu not mashed potatoes\" or \"The rice portion is about 300g not 150g\""}
                        className="w-full px-3 py-2 rounded-xl bg-[#14171d] border border-white/10 text-white text-xs placeholder:text-[#9ea3b0]/50 focus:outline-none focus:border-[#b6ff2e] resize-none h-16"
                      />
                      {aiFixError && (
                        <p className="text-[10px] text-red-400 font-semibold">{aiFixError}</p>
                      )}
                      <button
                        onClick={handleAiFix}
                        disabled={isAiFixing || !aiFixText.trim()}
                        className="w-full py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] text-xs font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_15px_rgba(182,255,46,0.25)]"
                      >
                        {isAiFixing ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> AI is Re-analyzing...</>
                        ) : (
                          <><Zap className="w-3.5 h-3.5" /> Fix with AI</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleLogMeal}
                className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-[0_0_20px_rgba(182,255,46,0.3)] flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('logMealCTA')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
