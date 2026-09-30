import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  goal: 'lose' | 'gain' | 'maintain';
  gender: 'male' | 'female' | 'other';
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  workoutDaysPerWeek: number;
  timeframeMonths: number;
  
  // Calculated Macro Targets
  dailyCaloriesGoal: number;
  proteinGoalGrams: number;
  carbsGoalGrams: number;
  fatsGoalGrams: number;
  waterGoalLiters: number;
  
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, default: 'Athlete' },
  goal: { type: String, enum: ['lose', 'gain', 'maintain'], default: 'maintain' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  age: { type: Number, default: 25 },
  heightCm: { type: Number, default: 175 },
  currentWeightKg: { type: Number, default: 75 },
  targetWeightKg: { type: Number, default: 75 },
  workoutDaysPerWeek: { type: Number, default: 4 },
  timeframeMonths: { type: Number, default: 3 },

  dailyCaloriesGoal: { type: Number, default: 2200 },
  proteinGoalGrams: { type: Number, default: 150 },
  carbsGoalGrams: { type: Number, default: 220 },
  fatsGoalGrams: { type: Number, default: 65 },
  waterGoalLiters: { type: Number, default: 3.0 },

  updatedAt: { type: Date, default: Date.now }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
