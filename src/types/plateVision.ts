export type GoalType = 'lose' | 'gain' | 'maintain' | 'muscle';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export interface OnboardingData {
  goal: GoalType;
  name: string;
  email?: string;
  password?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  workoutDaysPerWeek: number;
  timeframeMonths: number;
  hasChildren?: boolean;
  acceptedTerms?: boolean;
  acceptedTermsAt?: Date;
}

export interface UserProfile extends OnboardingData {
  _id?: string;
  role?: 'user' | 'admin';
  dailyCaloriesGoal: number;
  proteinGoalGrams: number;
  carbsGoalGrams: number;
  fatsGoalGrams: number;
  waterGoalLiters: number;
}

export interface DetectedItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weightGrams: number;
  boundingBox: {
    x: number; // percentage
    y: number;
    width: number;
    height: number;
  };
}

export interface ScannedMeal {
  id: string;
  title: string;
  timestamp: string;
  dateStr?: string;
  imageUrl: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  detectedItems: DetectedItem[];
  aiAdvice: string;
}

export interface SampleDish {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  detectedItems: DetectedItem[];
  aiAdvice: string;
}
