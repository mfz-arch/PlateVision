import { connectToDatabase } from '../config/mongodb';
import User from '../models/User';

export async function getUserProfile() {
  await connectToDatabase();
  let user = await User.findOne();

  if (!user) {
    user = await User.create({
      name: 'Alex Johnson',
      goal: 'lose',
      gender: 'male',
      age: 26,
      heightCm: 178,
      currentWeightKg: 82,
      targetWeightKg: 75,
      workoutDaysPerWeek: 4,
      timeframeMonths: 3,
      dailyCaloriesGoal: 2150,
      proteinGoalGrams: 160,
      carbsGoalGrams: 200,
      fatsGoalGrams: 60,
      waterGoalLiters: 3.2
    });
  }

  return user;
}

export async function updateUserProfile(data: any) {
  await connectToDatabase();

  const {
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

  // BMR Calculation (Mifflin-St Jeor)
  let bmr = (10 * currentWeightKg) + (6.25 * heightCm) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;

  // Activity multiplier
  const activityMultiplier = 1.2 + (workoutDaysPerWeek * 0.08);
  let tdee = Math.round(bmr * activityMultiplier);

  // Goal adjustment
  let dailyCalories = tdee;
  if (goal === 'lose') dailyCalories = Math.round(tdee * 0.82);
  else if (goal === 'gain') dailyCalories = Math.round(tdee * 1.15);

  const proteinGrams = Math.round(currentWeightKg * (goal === 'lose' ? 2.2 : 2.0));
  const fatsGrams = Math.round((dailyCalories * 0.25) / 9);
  const carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatsGrams * 9)) / 4);
  const waterLiters = Number((currentWeightKg * 0.04).toFixed(1));

  let user = await User.findOne();

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
  } else {
    user = await User.create({
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
  }

  return user;
}
