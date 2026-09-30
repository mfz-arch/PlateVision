import { connectToDatabase } from '../config/mongodb';
import { uploadImageToCloudinary } from '../config/cloudinary';
import { analyzeFoodImageWithGemini } from '../services/aiVisionService';
import Meal from '../models/Meal';

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

  // 2. Connect to MongoDB Atlas
  await connectToDatabase();

  // 3. Perform real-time multimodal image analysis with Gemini 3.5 Flash Lite
  const parsedDish = await analyzeFoodImageWithGemini(cleanBase64, mimeType);

  // 4. Save analyzed meal directly into MongoDB Atlas
  const savedMeal = await Meal.create({
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
  });

  return savedMeal;
}

export async function getLoggedMeals(dateStr?: string) {
  await connectToDatabase();
  const query = dateStr ? { dateStr } : {};
  return await Meal.find(query).sort({ createdAt: -1 }).limit(50);
}

export async function deleteLoggedMeal(mealId: string) {
  await connectToDatabase();
  return await Meal.findByIdAndDelete(mealId);
}
