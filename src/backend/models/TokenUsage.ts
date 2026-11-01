import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITokenUsage extends Document {
  dateStr: string; // YYYY-MM-DD
  userId?: string;
  action: 'analyze_plate' | 'fix_result';
  aiModel: string;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  createdAt: Date;
}

const TokenUsageSchema = new Schema<ITokenUsage>({
  dateStr: { 
    type: String, 
    required: true, 
    index: true,
    default: () => new Date().toISOString().split('T')[0] 
  },
  userId: { type: String, default: 'guest', index: true },
  action: { type: String, enum: ['analyze_plate', 'fix_result'], default: 'analyze_plate' },
  aiModel: { type: String, default: 'gemini-3.5-flash-lite' },
  promptTokens: { type: Number, default: 0 },
  candidatesTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Fast lookup for daily token aggregation
TokenUsageSchema.index({ dateStr: 1, createdAt: -1 });

const TokenUsage: Model<ITokenUsage> = 
  mongoose.models.TokenUsage || mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema);

export default TokenUsage;
