import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../config/mongodb';
import User from '../models/User';
import { isAdminEmail } from '../auth/session';
import {
  sanitizeEmail,
  sanitizeString,
  validatePasswordStrength,
  sanitizeNumber
} from '../security/sanitize';

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
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid registration data');
  }

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

  const normalizedEmail = sanitizeEmail(email);
  const validatedPassword = validatePasswordStrength(password);

  if (data.acceptedTerms !== true) {
    throw new Error('You must accept the Terms of Service and Privacy Policy to create an account');
  }

  const cleanName = sanitizeString(name, 60, 'Athlete');
  const cleanGoal = ['lose', 'gain', 'maintain'].includes(goal) ? goal : 'lose';
  const cleanGender = ['male', 'female', 'other'].includes(gender) ? gender : 'male';
  const cleanAge = sanitizeNumber(age, 16, 120, 25);
  const cleanHeight = sanitizeNumber(heightCm, 100, 250, 175);
  const cleanCurrentWeight = sanitizeNumber(currentWeightKg, 30, 300, 75);
  const cleanTargetWeight = sanitizeNumber(targetWeightKg, 30, 300, 70);
  const cleanWorkoutDays = sanitizeNumber(workoutDaysPerWeek, 0, 7, 4);
  const cleanTimeframe = sanitizeNumber(timeframeMonths, 1, 36, 3);

  const isDbConnected = await safeConnectDB();

  // Calculate macros using Mifflin-St Jeor equation
  let bmr = (10 * cleanCurrentWeight) + (6.25 * cleanHeight) - (5 * cleanAge);
  bmr += cleanGender === 'male' ? 5 : -161;

  const activityMultiplier = 1.2 + (cleanWorkoutDays * 0.08);
  const tdee = Math.round(bmr * activityMultiplier);

  let dailyCalories = tdee;
  if (cleanGoal === 'lose') dailyCalories = Math.round(tdee * 0.82);
  else if (cleanGoal === 'gain') dailyCalories = Math.round(tdee * 1.15);

  const proteinGrams = Math.round(cleanCurrentWeight * (cleanGoal === 'lose' ? 2.2 : 2.0));
  const fatsGrams = Math.round((dailyCalories * 0.25) / 9);
  const carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4);
  const waterLiters = Number((cleanCurrentWeight * 0.04).toFixed(1));

  const hashedPassword = await bcrypt.hash(validatedPassword, 10);

  const userPayload = {
    email: normalizedEmail,
    password: hashedPassword,
    name: cleanName,
    goal: cleanGoal,
    gender: cleanGender,
    age: cleanAge,
    heightCm: cleanHeight,
    currentWeightKg: cleanCurrentWeight,
    targetWeightKg: cleanTargetWeight,
    workoutDaysPerWeek: cleanWorkoutDays,
    timeframeMonths: cleanTimeframe,
    dailyCaloriesGoal: dailyCalories,
    proteinGoalGrams: proteinGrams,
    carbsGoalGrams: Math.max(carbsGrams, 50),
    fatsGoalGrams: fatsGrams,
    waterGoalLiters: waterLiters,
    role: (isAdminEmail(normalizedEmail) ? 'admin' : 'user') as 'admin' | 'user',
    acceptedTermsAt: new Date()
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
      userObj.role = isAdminEmail(userObj.email) ? 'admin' : (userObj.role || 'user');
      return userObj;
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) throw err;
      console.warn('[Backend] MongoDB create failed, using in-memory store:', err);
    }
  }

  // Fallback to in-memory store
  fallbackUserMap.set(normalizedEmail, userPayload);
  const userCopy: any = { ...userPayload };
  delete userCopy.password;
  userCopy.role = isAdminEmail(userCopy.email) ? 'admin' : 'user';
  return userCopy;
}

export async function loginUser(data: { email?: string; password?: string }) {
  if (!data || typeof data !== 'object') {
    throw new Error('Incorrect email or password');
  }

  const { email, password } = data;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Incorrect email or password');
  }

  const normalizedEmail = sanitizeEmail(email);
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
  userObj.role = isAdminEmail(userObj.email) ? 'admin' : (userObj.role || 'user');
  return userObj;
}

export async function getUserProfile(email?: string) {
  if (!email || typeof email !== 'string') return null;
  const normalizedEmail = sanitizeEmail(email);
  const isDbConnected = await safeConnectDB();

  if (isDbConnected) {
    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        const userObj = user.toObject();
        delete userObj.password;
        userObj.role = isAdminEmail(userObj.email) ? 'admin' : (userObj.role || 'user');
        return userObj;
      }
    } catch (err) {
      console.warn('[Backend] DB getUserProfile failed:', err);
    }
  }

  if (fallbackUserMap.has(normalizedEmail)) {
    const userCopy = { ...fallbackUserMap.get(normalizedEmail) };
    delete userCopy.password;
    userCopy.role = isAdminEmail(userCopy.email) ? 'admin' : 'user';
    return userCopy;
  }

  return null;
}

// Only these profile fields may be changed by the user through the API
const EDITABLE_FIELDS = [
  'name', 'goal', 'gender', 'age', 'heightCm', 'currentWeightKg', 'targetWeightKg',
  'workoutDaysPerWeek', 'timeframeMonths', 'dailyCaloriesGoal', 'proteinGoalGrams',
  'carbsGoalGrams', 'fatsGoalGrams', 'waterGoalLiters'
] as const;

function pickEditable(data: any) {
  const out: Record<string, any> = {};
  for (const key of EDITABLE_FIELDS) {
    if (data?.[key] === undefined) continue;
    const value = data[key];
    if (key === 'name') out[key] = sanitizeString(value, 60, 'Athlete');
    else if (key === 'goal') { if (['lose', 'gain', 'maintain'].includes(value)) out[key] = value; }
    else if (key === 'gender') { if (['male', 'female', 'other'].includes(value)) out[key] = value; }
    else {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0 && n < 100000) out[key] = n;
    }
  }
  return out;
}

/** Update the profile of the user identified by `email` (taken from the session, not the body). */
export async function updateUserProfile(email: string, data: any) {
  if (!email || typeof email !== 'string') return null;
  const normalizedEmail = sanitizeEmail(email);
  const updates = pickEditable(data);
  const isDbConnected = await safeConnectDB();

  if (isDbConnected) {
    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        Object.assign(user, updates);
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

  if (fallbackUserMap.has(normalizedEmail)) {
    const existing = fallbackUserMap.get(normalizedEmail);
    const updated = { ...existing, ...updates };
    fallbackUserMap.set(normalizedEmail, updated);
    const copy = { ...updated };
    delete copy.password;
    return copy;
  }

  return null;
}

/** GDPR right to erasure — permanently delete the account. */
export async function deleteUserAccount(email: string) {
  if (!email || typeof email !== 'string') return;
  const normalizedEmail = sanitizeEmail(email);
  const isDbConnected = await safeConnectDB();
  if (isDbConnected) {
    try {
      await User.deleteOne({ email: normalizedEmail });
    } catch (err) {
      console.warn('[Backend] DB deleteUserAccount failed:', err);
    }
  }
  fallbackUserMap.delete(normalizedEmail);
}
