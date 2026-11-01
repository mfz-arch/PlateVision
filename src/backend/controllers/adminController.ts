import { connectToDatabase } from '../config/mongodb';
import User from '../models/User';
import Meal from '../models/Meal';
import { toLocalDateStr } from '@/lib/date';

async function safeConnect(): Promise<boolean> {
  try {
    await connectToDatabase();
    return true;
  } catch (err) {
    console.warn('[AdminController] DB connection failed:', err);
    return false;
  }
}

export async function getAdminOverview() {
  const isConnected = await safeConnect();

  if (!isConnected) {
    return {
      connected: false,
      totalUsers: 0,
      totalMeals: 0,
      todayMealsCount: 0,
      goalsBreakdown: { lose: 0, gain: 0, maintain: 0 },
      aggregates: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      systemHealth: {
        mongodb: false,
        gemini: !!process.env.GEMINI_API_KEY,
        cloudinary: !!process.env.CLOUDINARY_API_KEY
      }
    };
  }

  const todayStr = toLocalDateStr();

  // Run queries in parallel for peak performance
  const [
    totalUsers,
    totalMeals,
    todayMealsCount,
    goalLoseCount,
    goalGainCount,
    goalMaintainCount,
    aggregatesResult
  ] = await Promise.all([
    User.countDocuments({}),
    Meal.countDocuments({}),
    Meal.countDocuments({ dateStr: todayStr }),
    User.countDocuments({ goal: 'lose' }),
    User.countDocuments({ goal: 'gain' }),
    User.countDocuments({ goal: 'maintain' }),
    Meal.aggregate([
      {
        $group: {
          _id: null,
          totalCalories: { $sum: '$totalCalories' },
          totalProtein: { $sum: '$totalProtein' },
          totalCarbs: { $sum: '$totalCarbs' },
          totalFats: { $sum: '$totalFats' }
        }
      }
    ])
  ]);

  const agg = aggregatesResult?.[0] || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0
  };

  return {
    connected: true,
    totalUsers,
    totalMeals,
    todayMealsCount,
    goalsBreakdown: {
      lose: goalLoseCount,
      gain: goalGainCount,
      maintain: goalMaintainCount
    },
    aggregates: {
      calories: Math.round(agg.totalCalories || 0),
      protein: Math.round(agg.totalProtein || 0),
      carbs: Math.round(agg.totalCarbs || 0),
      fats: Math.round(agg.totalFats || 0)
    },
    systemHealth: {
      mongodb: true,
      gemini: !!process.env.GEMINI_API_KEY,
      cloudinary: !!process.env.CLOUDINARY_API_KEY
    }
  };
}

export async function getAdminUsers(search?: string, limit = 50) {
  const isConnected = await safeConnect();
  if (!isConnected) return [];

  let filter: any = {};
  if (search && typeof search === 'string') {
    const clean = search.trim();
    filter = {
      $or: [
        { name: { $regex: clean, $options: 'i' } },
        { email: { $regex: clean, $options: 'i' } }
      ]
    };
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  // Attach meal counts for each user
  const userIds = users.map(u => String(u._id));
  const userEmails = users.map(u => String(u.email));

  const mealCounts = await Meal.aggregate([
    {
      $match: {
        userId: { $in: [...userIds, ...userEmails] }
      }
    },
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 }
      }
    }
  ]);

  const mealMap = new Map<string, number>();
  for (const m of mealCounts) {
    mealMap.set(String(m._id), m.count);
  }

  return users.map(u => ({
    ...u,
    _id: String(u._id),
    mealsCount: (mealMap.get(String(u._id)) || 0) + (mealMap.get(String(u.email)) || 0)
  }));
}

export async function getAdminActivity(limit = 35) {
  const isConnected = await safeConnect();
  if (!isConnected) return [];

  const meals = await Meal.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return meals.map(m => ({
    id: String(m._id),
    userId: m.userId,
    title: m.title,
    category: m.category,
    timestamp: m.timestamp,
    dateStr: m.dateStr,
    imageUrl: m.imageUrl,
    totalCalories: m.totalCalories,
    totalProtein: m.totalProtein,
    totalCarbs: m.totalCarbs,
    totalFats: m.totalFats,
    detectedCount: m.detectedItems?.length || 0,
    createdAt: m.createdAt
  }));
}

