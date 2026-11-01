import { connectToDatabase } from '../config/mongodb';
import { uploadImageToCloudinary } from '../config/cloudinary';
import { analyzeFoodImageWithGemini } from '../services/aiVisionService';
import Meal from '../models/Meal';
import { DATE_STR_REGEX } from '@/lib/date';

// In-memory fallback (only used when MongoDB is unreachable). Still scoped per user.
const fallbackMeals: any[] = [];

async function safeConnectDB(): Promise<boolean> {
  try {
    await connectToDatabase();
    return true;
  } catch (err) {
    console.warn('[Backend] MongoDB connection failed in mealController:', err);
    return false;
  }
}

/**
 * Step 1 — analyze only. Uploads the photo to Cloudinary and asks Gemini for the
 * nutrition breakdown. Nothing is saved to the user's log here: the meal is only
 * persisted when the user confirms it (after optionally fixing the result).
 */
export async function analyzePlateImage(imageBase64: string, mimeType = 'image/jpeg', userId = 'guest') {
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  let uploadedImageUrl = '';
  try {
    uploadedImageUrl = await uploadImageToCloudinary(cleanBase64);
  } catch (err) {
    console.warn('[Backend] Cloudinary upload warning (using data URL fallback):', err);
    uploadedImageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanBase64}`;
  }

  const parsedDish = await analyzeFoodImageWithGemini(cleanBase64, mimeType, userId);

  return {
    id: 'scan-' + Date.now(),
    title: parsedDish.title || 'Scanned Meal',
    category: parsedDish.category || 'Live AI Scan',
    imageUrl: uploadedImageUrl,
    totalCalories: parsedDish.totalCalories || 0,
    totalProtein: parsedDish.totalProtein || 0,
    totalCarbs: parsedDish.totalCarbs || 0,
    totalFats: parsedDish.totalFats || 0,
    detectedItems: parsedDish.detectedItems || [],
    aiAdvice: parsedDish.aiAdvice || 'Analyzed successfully by Gemini Vision AI.'
  };
}

// ---------- Input sanitizing helpers (never trust the client payload) ----------

function num(v: unknown, max = 100000): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 10) / 10, max);
}

function str(v: unknown, maxLen: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.trim().slice(0, maxLen) || fallback;
}

function sanitizeItems(items: unknown): any[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 30).map((raw: any, idx: number) => {
    const box = raw?.boundingBox || {};
    return {
      id: str(raw?.id, 64, `item-${idx}`),
      name: str(raw?.name, 120, 'Food item'),
      calories: num(raw?.calories, 10000),
      protein: num(raw?.protein, 1000),
      carbs: num(raw?.carbs, 1000),
      fats: num(raw?.fats, 1000),
      weightGrams: num(raw?.weightGrams, 10000),
      boundingBox: {
        x: Math.min(num(box.x, 100), 100),
        y: Math.min(num(box.y, 100), 100),
        width: Math.min(num(box.width, 100), 100),
        height: Math.min(num(box.height, 100), 100)
      }
    };
  });
}

function sanitizeImageUrl(v: unknown): string {
  if (typeof v !== 'string') return '';
  if (v.startsWith('https://')) return v.slice(0, 2048);
  // Data URLs are only kept as a last-resort fallback when Cloudinary is down (cap ~2MB)
  if (v.startsWith('data:image/') && v.length < 2_800_000) return v;
  return '';
}

/**
 * Step 2 — persist the confirmed meal for ONE user on ONE local calendar day.
 */
export async function saveMealForUser(userId: string, body: any) {
  if (!userId) throw new Error('Missing user');

  const dateStr = typeof body?.dateStr === 'string' && DATE_STR_REGEX.test(body.dateStr)
    ? body.dateStr
    : new Date().toISOString().split('T')[0];

  const detectedItems = sanitizeItems(body?.detectedItems);

  const mealData = {
    userId,
    title: str(body?.title, 160, 'Scanned Meal'),
    category: str(body?.category, 80, 'Scanned Meal'),
    timestamp: str(body?.timestamp, 16, new Date().toISOString().slice(11, 16)),
    dateStr,
    imageUrl: sanitizeImageUrl(body?.imageUrl) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    totalCalories: num(body?.totalCalories),
    totalProtein: num(body?.totalProtein),
    totalCarbs: num(body?.totalCarbs),
    totalFats: num(body?.totalFats),
    detectedItems,
    aiAdvice: str(body?.aiAdvice, 2000, '')
  };

  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      const saved = await Meal.create(mealData);
      return toClientMeal(saved.toObject());
    } catch (err) {
      console.warn('[Backend] Meal.create failed, saving to fallback array:', err);
    }
  }

  const id = 'meal-' + Date.now();
  const fallbackMeal = { _id: id, id, ...mealData, createdAt: new Date() };
  fallbackMeals.unshift(fallbackMeal);
  return toClientMeal(fallbackMeal);
}

/** Only meals owned by `userId`, optionally restricted to one calendar day. */
export async function getMealsForUser(userId: string, dateStr?: string) {
  if (!userId) return [];
  const validDate = dateStr && DATE_STR_REGEX.test(dateStr) ? dateStr : undefined;

  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      const query: Record<string, string> = { userId };
      if (validDate) query.dateStr = validDate;
      const docs = await Meal.find(query).sort({ createdAt: -1 }).limit(100).lean();
      return docs.map(toClientMeal);
    } catch (err) {
      console.warn('[Backend] Meal.find failed:', err);
    }
  }

  return fallbackMeals
    .filter((m) => m.userId === userId && (!validDate || m.dateStr === validDate))
    .map(toClientMeal);
}

/** Deletes a meal only if it belongs to `userId`. */
export async function deleteMealForUser(userId: string, mealId: string) {
  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      if (/^[a-f0-9]{24}$/i.test(mealId)) {
        const result = await Meal.deleteOne({ _id: mealId, userId });
        if (result.deletedCount > 0) return true;
      }
    } catch (err) {
      console.warn('[Backend] Meal.deleteOne failed:', err);
    }
  }

  const index = fallbackMeals.findIndex((m) => (m.id === mealId || m._id === mealId) && m.userId === userId);
  if (index !== -1) {
    fallbackMeals.splice(index, 1);
    return true;
  }
  return false;
}

/** GDPR "right to erasure" — remove every meal owned by the user. */
export async function deleteAllMealsForUser(userId: string) {
  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      await Meal.deleteMany({ userId });
    } catch (err) {
      console.warn('[Backend] Meal.deleteMany failed:', err);
    }
  }
  for (let i = fallbackMeals.length - 1; i >= 0; i--) {
    if (fallbackMeals[i].userId === userId) fallbackMeals.splice(i, 1);
  }
}

/** Normalize the DB document for the browser (string id, no owner id leaked). */
function toClientMeal(doc: any) {
  const id = String(doc._id || doc.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId, __v, _id, ...rest } = doc;
  return { ...rest, id, _id: id };
}
