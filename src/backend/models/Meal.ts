import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDetectedItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weightGrams: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface IMeal extends Document {
  title: string;
  category: string;
  timestamp: string;
  dateStr: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  detectedItems: IDetectedItem[];
  aiAdvice: string;
  createdAt: Date;
}

const DetectedItemSchema = new Schema<IDetectedItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  calories: { type: Number, required: true, default: 0 },
  protein: { type: Number, required: true, default: 0 },
  carbs: { type: Number, required: true, default: 0 },
  fats: { type: Number, required: true, default: 0 },
  weightGrams: { type: Number, required: true, default: 0 },
  boundingBox: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  }
}, { _id: false });

const MealSchema = new Schema<IMeal>({
  title: { type: String, required: true },
  category: { type: String, default: 'Scanned Meal' },
  timestamp: { type: String, required: true },
  dateStr: { 
    type: String, 
    required: true, 
    default: () => new Date().toISOString().split('T')[0] 
  },
  imageUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String },
  totalCalories: { type: Number, required: true, default: 0 },
  totalProtein: { type: Number, required: true, default: 0 },
  totalCarbs: { type: Number, required: true, default: 0 },
  totalFats: { type: Number, required: true, default: 0 },
  detectedItems: [DetectedItemSchema],
  aiAdvice: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Meal: Model<IMeal> = mongoose.models.Meal || mongoose.model<IMeal>('Meal', MealSchema);

export default Meal;
