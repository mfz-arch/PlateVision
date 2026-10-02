import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../config/mongodb';
import User from '../models/User';

// In-memory fallback cache if MONGODB_URI is not set in environment
const fallbackUserMap = new Map<string, any>();

async function safeConnectDB(): Promise<boolean> {
  try {
    await connectToDatabase();
    return true;
  } catch (err) {
    console.warn('[Backend] MongoDB connection failed, using fallback store:', err);
    return false;
  }
}

export async function registerUser(data: any) {
  const {
    email,
    password,
    name = 'Athlete',
    goal = 'lose',
    gender = 'male',
    age = 25,
    heightCm = 175,
    currentWeightKg = 75,
    targetWeightKg = 70,
    workoutDaysPerWeek = 4,
    timeframeMonths = 3
  } = data;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isDbConnected = await safeConnectDB();

  // Calculate macros
  let bmr = (10 * currentWeightKg) + (6.25 * heightCm) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;

  const activityMultiplier = 1.2 + (workoutDaysPerWeek * 0.08);
  let tdee = Math.round(bmr * activityMultiplier);

  let dailyCalories = tdee;
  if (goal === 'lose') dailyCalories = Math.round(tdee * 0.82);
  else if (goal === 'gain') dailyCalories = Math.round(tdee * 1.15);

  const proteinGrams = Math.round(currentWeightKg * (goal === 'lose' ? 2.2 : 2.0));
  const fatsGrams = Math.round((dailyCalories * 0.25) / 9);
  const carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4);
  const waterLiters = Number((currentWeightKg * 0.04).toFixed(1));

  const hashedPassword = await bcrypt.hash(password, 10);

  const userPayload = {
    email: normalizedEmail,
    password: hashedPassword,
    name,
    goal,
    gender,
    age,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    workoutDaysPerWeek,
    timeframeMonths,
    dailyCaloriesGoal: dailyCalories,
    proteinGoalGrams: proteinGrams,
    carbsGoalGrams: Math.max(carbsGrams, 50),
    fatsGoalGrams: fatsGrams,
    waterGoalLiters: waterLiters
  };

  if (isDbConnected) {
    try {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      const user = await User.create(userPayload);
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    } catch (err: any) {
      if (err.message.includes('already exists')) throw err;
      console.warn('[Backend] MongoDB create failed, using in-memory store:', err);
    }
  }

  // Fallback to in-memory store
  fallbackUserMap.set(normalizedEmail, userPayload);
  const userCopy = { ...userPayload };
  delete (userCopy as any).password;
  return userCopy;
}

export async function loginUser(data: { email?: string; password?: string }) {
  const { email, password } = data;
  if (!email || !password) {
    throw new Error('Incorrect email or password');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isDbConnected = await safeConnectDB();

  let foundUser: any = null;

  if (isDbConnected) {
    try {
      foundUser = await User.findOne({ email: normalizedEmail });
      if (foundUser) foundUser = foundUser.toObject();
    } catch (err) {
      console.warn('[Backend] DB find failed during login, checking fallback store:', err);
    }
  }

  if (!foundUser) {
    foundUser = fallbackUserMap.get(normalizedEmail);
  }

  if (!foundUser || !foundUser.password) {
    throw new Error('Incorrect email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, foundUser.password);
  if (!isPasswordValid) {
    throw new Error('Incorrect email or password');
  }

  const userObj = { ...foundUser };
  delete userObj.password;
  return userObj;
}

export async function getUserProfile(email?: string) {
  const isDbConnected = await safeConnectDB();

  if (isDbConnected) {
    try {
      let query = email ? { email: email.trim().toLowerCase() } : {};
      let user = await User.findOne(query).sort({ updatedAt: -1 });

      if (!user && !email) {
        user = await User.findOne().sort({ updatedAt: -1 });
      }

      if (user) {
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
      }
    } catch (err) {
      console.warn('[Backend] DB getUserProfile failed:', err);
    }
  }

  if (email && fallbackUserMap.has(email.toLowerCase())) {
    const userCopy = { ...fallbackUserMap.get(email.toLowerCase()) };
    delete userCopy.password;
    return userCopy;
  }

  if (fallbackUserMap.size > 0) {
    const firstUser = Array.from(fallbackUserMap.values())[0];
    const userCopy = { ...firstUser };
    delete userCopy.password;
    return userCopy;
  }

  return null;
}

export async function updateUserProfile(data: any) {
  const isDbConnected = await safeConnectDB();
  const { email } = data;

  if (isDbConnected) {
    try {
      let query = email ? { email: email.trim().toLowerCase() } : {};
      let user = await User.findOne(query);
      if (user) {
        Object.assign(user, data);
        user.updatedAt = new Date();
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
      }
    } catch (err) {
      console.warn('[Backend] DB updateUserProfile failed:', err);
    }
  }

  if (email && fallbackUserMap.has(email.toLowerCase())) {
    const existing = fallbackUserMap.get(email.toLowerCase());
    const updated = { ...existing, ...data };
    fallbackUserMap.set(email.toLowerCase(), updated);
    delete updated.password;
    return updated;
  }

  return null;
}
