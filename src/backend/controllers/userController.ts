import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../config/mongodb';
import User from '../models/User';

export async function registerUser(data: any) {
  await connectToDatabase();

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
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // BMR Calculation (Mifflin-St Jeor)
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

  const user = await User.create({
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
  });

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

export async function loginUser(data: { email?: string; password?: string }) {
  await connectToDatabase();

  const { email, password } = data;
  if (!email || !password) {
    throw new Error('Incorrect email or password');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.password) {
    throw new Error('Incorrect email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Incorrect email or password');
  }

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

export async function getUserProfile(email?: string) {
  await connectToDatabase();
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

  return null;
}

export async function updateUserProfile(data: any) {
  await connectToDatabase();

  const {
    email,
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

  let query = email ? { email: email.trim().toLowerCase() } : {};
  let user = await User.findOne(query);

  if (user) {
    user.name = name;
    user.goal = goal;
    user.gender = gender;
    user.age = age;
    user.heightCm = heightCm;
    user.currentWeightKg = currentWeightKg;
    user.targetWeightKg = targetWeightKg;
    user.workoutDaysPerWeek = workoutDaysPerWeek;
    user.timeframeMonths = timeframeMonths;
    user.dailyCaloriesGoal = dailyCalories;
    user.proteinGoalGrams = proteinGrams;
    user.carbsGoalGrams = Math.max(carbsGrams, 50);
    user.fatsGoalGrams = fatsGrams;
    user.waterGoalLiters = waterLiters;
    user.updatedAt = new Date();
    await user.save();
  }

  if (!user) {
    return null;
  }

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}
