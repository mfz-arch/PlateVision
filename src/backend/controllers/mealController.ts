import { connectToDatabase } from '../config/mongodb';
import { uploadImageToCloudinary } from '../config/cloudinary';
import { analyzeFoodImageWithGemini } from '../services/aiVisionService';
import Meal from '../models/Meal';

const fallbackMeals: any[] = [];

async function safeConnectDB(): Promise<boolean> {
  try {
    if (!process.env.MONGODB_URI) return false;
    await connectToDatabase();
    return true;
  } catch (err) {
    console.warn('[Backend] MongoDB connection skipped/failed in mealController:', err);
    return false;
  }
}

export async function processAndSavePlateScan(imageBase64: string, mimeType = 'image/jpeg') {
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // 1. Upload photo to Cloudinary
  let uploadedImageUrl = '';
  try {
    uploadedImageUrl = await uploadImageToCloudinary(cleanBase64);
  } catch (err) {
    console.warn('[Backend] Cloudinary upload warning (using data URL fallback):', err);
    uploadedImageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanBase64}`;
  }

  // 2. Perform real-time multimodal image analysis with Gemini 3.5 Flash Lite
  const parsedDish = await analyzeFoodImageWithGemini(cleanBase64, mimeType);

  const mealData = {
    title: parsedDish.title || 'Scanned Meal',
    category: parsedDish.category || 'Live AI Scan',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateStr: new Date().toISOString().split('T')[0],
    imageUrl: uploadedImageUrl,
    totalCalories: parsedDish.totalCalories || 0,
    totalProtein: parsedDish.totalProtein || 0,
    totalCarbs: parsedDish.totalCarbs || 0,
    totalFats: parsedDish.totalFats || 0,
    detectedItems: parsedDish.detectedItems || [],
    aiAdvice: parsedDish.aiAdvice || 'Analyzed successfully by Gemini Vision AI.'
  };

  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      const savedMeal = await Meal.create(mealData);
      return savedMeal;
    } catch (err) {
      console.warn('[Backend] Meal.create failed, saving to fallback array:', err);
    }
  }

  const fallbackMeal = {
    id: 'meal-' + Date.now(),
    _id: 'meal-' + Date.now(),
    ...mealData,
    createdAt: new Date()
  };
  fallbackMeals.unshift(fallbackMeal);
  return fallbackMeal;
}

export async function getLoggedMeals(dateStr?: string) {
  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      const query = dateStr ? { dateStr } : {};
      return await Meal.find(query).sort({ createdAt: -1 }).limit(50);
    } catch (err) {
      console.warn('[Backend] Meal.find failed:', err);
    }
  }

  return fallbackMeals;
}

export async function deleteLoggedMeal(mealId: string) {
  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      await Meal.findByIdAndDelete(mealId);
    } catch (err) {
      console.warn('[Backend] Meal.findByIdAndDelete failed:', err);
    }
  }

  const index = fallbackMeals.findIndex((m) => m.id === mealId || m._id === mealId);
  if (index !== -1) {
    fallbackMeals.splice(index, 1);
  }

  return { success: true };
}
