import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, CheckCircle2, RefreshCw, X, Flame, 
  Dumbbell, Layers, Info, ArrowRight, Zap, Image as ImageIcon,
  Edit3, MessageSquare, Save, Trash2, PlusCircle
} from 'lucide-react';
import { SAMPLE_DISHES } from '../data/mockPlateData';
import { SampleDish, ScannedMeal, DetectedItem } from '../types/plateVision';
import { useLanguage } from '../context/LanguageContext';
import { toLocalDateStr } from '../lib/date';

interface ScannerZoneProps {
  onMealScanned: (meal: ScannedMeal) => void;
  onClose?: () => void;
  isModal?: boolean;
  /** Calendar day (YYYY-MM-DD, local) the meal should be logged to. Defaults to today. */
  targetDateStr?: string;
  defaultCategory?: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' | string;
}

export const ScannerZone: React.FC<ScannerZoneProps> = ({
  onMealScanned,
  onClose,
  isModal = false,
  targetDateStr,
  defaultCategory
}) => {
  const { t } = useLanguage();
  const [selectedDish, setSelectedDish] = useState<SampleDish | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSourceChoiceModal, setShowSourceChoiceModal] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fix Result states
  const [showFixPanel, setShowFixPanel] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<DetectedItem>>({});
  const [aiFixText, setAiFixText] = useState<string>('');
  const [isAiFixing, setIsAiFixing] = useState<boolean>(false);
  const [aiFixError, setAiFixError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onClose]);

  const handleSelectSample = (dish: SampleDish) => {
    setSelectedDish(dish);
    setCustomImage(null);
    setUploadedImageUrl(null);
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
        if (res.status === 401) throw new Error('Your session has expired. Please sign in again.');
        throw new Error(data.error || 'Failed to analyze plate with Gemini Vision AI.');
      }

      if (data.dish) {
        // Keep the hosted (Cloudinary) URL for saving, show the local preview for speed
        setUploadedImageUrl(typeof data.dish.imageUrl === 'string' && data.dish.imageUrl.startsWith('https://') ? data.dish.imageUrl : null);
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

  const handleLogMeal = async () => {
    if (!selectedDish || isSaving || isScanning || selectedDish.id === 'scanning-temp') return;
    setIsSaving(true);
    setApiError(null);

    const finalCategory = defaultCategory || selectedDish.category || 'Lunch';
    const finalImage = uploadedImageUrl || customImage || selectedDish.imageUrl;

    const payload = {
      title: selectedDish.title,
      category: finalCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: targetDateStr || toLocalDateStr(),
      imageUrl: finalImage,
      totalCalories: selectedDish.totalCalories,
      totalProtein: selectedDish.totalProtein,
      totalCarbs: selectedDish.totalCarbs,
      totalFats: selectedDish.totalFats,
      detectedItems: selectedDish.detectedItems,
      aiAdvice: selectedDish.aiAdvice
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

      // Cache the captured photo locally on this device so it NEVER disappears
      if (customImage && data.meal) {
        const id = data.meal._id || data.meal.id;
        try {
          localStorage.setItem(`pv_photo_${id}`, customImage);
        } catch (e) {
          console.warn('Could not cache meal image locally:', e);
        }
      }

      onMealScanned(data.meal as ScannedMeal);
      if (onClose) onClose();
    } catch (err: any) {
      setApiError(err?.message || 'Failed to save meal.');
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#84cc16]">
            <Camera className="w-5 h-5 text-[#84cc16]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#0f172a] flex items-center gap-2">
              <span>{t('scannerTitle')}</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-lime-100 text-[#0f172a] border border-lime-200">
                Gemini Vision API
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold">{t('scannerSubtitle')}</p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="p-2 rounded-full text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-start justify-between gap-3 text-red-600 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0f172a] text-sm">Scan Error</p>
              <p className="mt-0.5 leading-relaxed text-red-600">{apiError}</p>
            </div>
          </div>
          <button 
            onClick={() => setApiError(null)} 
            className="p-1 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-700 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Dish Selector & Upload Trigger */}
      <div className={`grid grid-cols-1 gap-3 ${selectedDish ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {SAMPLE_DISHES.map((dish) => (
          <button
            key={dish.id}
            onClick={() => handleSelectSample(dish)}
            className={`p-2.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
              selectedDish?.id === dish.id && !customImage
                ? 'bg-lime-50 border-[#84cc16] shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <img 
              src={dish.imageUrl} 
              alt={dish.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/icons/icon-192x192.png';
                e.currentTarget.className = 'w-12 h-12 rounded-xl object-contain p-1 shrink-0 bg-slate-100 border border-slate-200';
              }}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-black text-[#0f172a] truncate">{dish.title}</p>
              <p className="text-[10px] text-[#65a30d] font-bold">{dish.totalCalories} kcal</p>
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
        {selectedDish && (
          <button 
            onClick={() => setShowSourceChoiceModal(true)}
            className="p-2.5 rounded-2xl bg-white border-2 border-dashed border-[#84cc16] hover:bg-lime-50 cursor-pointer flex items-center justify-center gap-2 text-[#0f172a] font-black text-xs transition-all shadow-xs"
          >
            <Camera className="w-4 h-4 text-[#84cc16]" />
            <span>{t('uploadPhoto')}</span>
          </button>
        )}
      </div>

      {/* Choice Modal for Upload Source (Gallery vs Camera) */}
      {showSourceChoiceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 bg-white rounded-3xl border-2 border-slate-200 text-center space-y-5 animate-in zoom-in duration-200 shadow-2xl">
            <h4 className="text-lg font-black text-[#0f172a]">Choose Photo Source</h4>
            <p className="text-xs text-slate-500 font-semibold">Select how you want to upload your meal photo</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSourceChoiceModal(false);
                  galleryInputRef.current?.click();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-[#84cc16] hover:bg-lime-50 text-[#0f172a] text-sm font-black flex items-center justify-center gap-3 transition-all"
              >
                <ImageIcon className="w-5 h-5 text-[#84cc16]" />
                <span>Upload from Gallery</span>
              </button>

              <button
                onClick={() => {
                  setShowSourceChoiceModal(false);
                  cameraInputRef.current?.click();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-[#84cc16] hover:bg-lime-50 text-[#0f172a] text-sm font-black flex items-center justify-center gap-3 transition-all"
              >
                <Camera className="w-5 h-5 text-[#84cc16]" />
                <span>Take Picture Directly</span>
              </button>
            </div>

            <button
              onClick={() => setShowSourceChoiceModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-[#0f172a] pt-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Image Viewport with Bounding Boxes OR Empty State Upload Dropzone */}
      {!selectedDish ? (
        <div 
          role="button"
          tabIndex={0}
          aria-label="Upload a meal photo or open the camera"
          onClick={() => setShowSourceChoiceModal(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowSourceChoiceModal(true); } }}
          className="p-10 sm:p-14 text-center border-2 border-dashed border-[#84cc16]/60 hover:border-[#84cc16] bg-white rounded-3xl cursor-pointer space-y-4 hover:bg-lime-50/40 transition-all group shadow-xs"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#84cc16] group-hover:scale-110 transition-all shadow-xs">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-black text-[#0f172a]">Scan Your Meal with Gemini Vision AI</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed font-normal">
              Upload a meal photo from your gallery or take a picture directly to calculate calories, protein, carbs & fats with automatic green box overlays.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-xs tracking-wide shadow-xs hover:bg-[#a3f01b] transition-all">
            <Upload className="w-4 h-4" />
            <span>Upload Photo / Open Camera</span>
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200 group shadow-xs">
            
            <img 
              src={selectedDish.imageUrl} 
              alt={selectedDish.title}
              className="w-full h-[360px] object-cover transition-all duration-500"
            />

            {isScanning && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]">
                <div className="scanner-beam" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#0f172a]/95 border border-[#b6ff2e]/50 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-[#b6ff2e]">
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
                    <span className="px-1.5 py-0.5 rounded bg-[#0f172a]/90 text-[10px] font-black text-[#b6ff2e] border border-[#b6ff2e]/40">
                      {item.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#b6ff2e] text-[10px] font-black text-[#0f172a]">
                      {item.calories} kcal
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-3 left-3 bg-[#0f172a]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-slate-200 font-semibold">
              {t('hoverBoxInstruction')}
            </div>
          </div>

          {/* Right Column: Nutrient Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-lime-100 text-[#0f172a] border border-lime-200">
                  {selectedDish.category}
                </span>
                <h4 className="text-lg font-black text-[#0f172a] mt-2 leading-snug">{selectedDish.title}</h4>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{t('scannerTitle')}</p>
                  <p className="text-3xl font-black text-[#65a30d]">{selectedDish.totalCalories} <span className="text-sm font-normal text-slate-500">kcal</span></p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#84cc16]">
                  <Flame className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{t('proteinsLabel')}</p>
                  <p className="text-base font-black text-[#0f172a]">{selectedDish.totalProtein}g</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{t('carbsLabel')}</p>
                  <p className="text-base font-black text-[#0f172a]">{selectedDish.totalCarbs}g</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{t('fatsLabel')}</p>
                  <p className="text-base font-black text-[#0f172a]">{selectedDish.totalFats}g</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-lime-50 border-2 border-lime-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#65a30d]">
                  <Zap className="w-4 h-4 text-[#84cc16]" />
                  <span>{t('aiAdviceTitle')} :</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
                  "{selectedDish.aiAdvice}"
                </p>
              </div>

              {/* Fix Result Toggle Button */}
              <button
                onClick={() => setShowFixPanel(!showFixPanel)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                  showFixPanel
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showFixPanel ? 'Close Fix Panel' : 'Fix / Edit Result'}</span>
              </button>

              {/* Fix Result Panel */}
              {showFixPanel && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border-2 border-amber-200 animate-in slide-in-from-top duration-200">
                  <p className="text-[10px] uppercase font-black text-amber-800 tracking-wider">Edit Detected Items</p>

                  {/* Editable Items List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedDish.detectedItems.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                        {editingItemId === item.id ? (
                          /* Editing Mode */
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editValues.name || ''}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-amber-400 text-[#0f172a] text-xs font-bold focus:outline-none focus:border-[#84cc16]"
                              placeholder="Food name"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['calories', 'protein', 'carbs', 'fats', 'weightGrams'] as const).map((field) => (
                                <div key={field} className="flex items-center gap-1">
                                  <label className="text-[9px] text-slate-500 uppercase font-bold w-12 shrink-0">
                                    {field === 'weightGrams' ? 'Weight' : field}
                                  </label>
                                  <input
                                    type="number"
                                    value={editValues[field] || 0}
                                    onChange={(e) => setEditValues({ ...editValues, [field]: Number(e.target.value) })}
                                    className="w-full px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[#0f172a] text-xs font-semibold focus:outline-none focus:border-[#84cc16] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditItem}
                                className="flex-1 py-1.5 rounded-lg bg-[#b6ff2e] text-[#0f172a] text-[10px] font-black flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={() => { setEditingItemId(null); setEditValues({}); }}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold transition-all hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display Mode */
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black text-[#0f172a]">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                {item.calories}kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fats}g · {item.weightGrams}g
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditItem(item)}
                                className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-700 transition-all"
                                title="Edit item"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-all"
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
                    className="w-full py-2 rounded-xl border-2 border-dashed border-[#84cc16] text-[#0f172a] text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-lime-50 transition-all bg-white"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#84cc16]" /> Add Food Item Manually
                  </button>

                  {/* AI Re-fix Section */}
                  {customImage && (
                    <div className="pt-2 border-t border-amber-200 space-y-2">
                      <p className="text-[10px] uppercase font-black text-[#65a30d] tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#84cc16]" /> Ask AI to Fix
                      </p>
                      <textarea
                        value={aiFixText}
                        onChange={(e) => setAiFixText(e.target.value)}
                        placeholder={"E.g., \"That's fufu not mashed potatoes\" or \"The rice portion is about 300g not 150g\""}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#0f172a] text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#84cc16] resize-none h-16"
                      />
                      {aiFixError && (
                        <p className="text-[10px] text-red-600 font-semibold">{aiFixError}</p>
                      )}
                      <button
                        onClick={handleAiFix}
                        disabled={isAiFixing || !aiFixText.trim()}
                        className="w-full py-2.5 rounded-xl bg-[#b6ff2e] text-[#0f172a] text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-xs hover:bg-[#a3f01b]"
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
                disabled={isSaving || isScanning || selectedDish.id === 'scanning-temp'}
                className="w-full py-3.5 rounded-xl bg-[#b6ff2e] text-[#0f172a] font-black text-sm tracking-wide hover:bg-[#a3f01b] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSaving ? 'Saving...' : t('logMealCTA')}</span>
              </button>

              <p className="text-[10px] leading-relaxed text-slate-400 text-center">
                AI nutrition values are estimates and may be inaccurate. They are not medical or dietary advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Plate scanner dialog"
      >
        <div className="relative w-full max-w-5xl p-6 sm:p-8 bg-white rounded-3xl border-2 border-slate-200 shadow-2xl my-8">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
