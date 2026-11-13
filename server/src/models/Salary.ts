import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISalary extends Document {
  userId: Types.ObjectId;
  month: string; // YYYY-MM
  amount: number;
  paid: boolean;
  paidOn?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salarySchema = new Schema<ISalary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format']
    },
    amount: { type: Number, required: true, min: 0 },
    paid: { type: Boolean, default: false },
    paidOn: { type: Date },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

// Unique on userId + month
salarySchema.index({ userId: 1, month: 1 }, { unique: true });

export const Salary = mongoose.model<ISalary>('Salary', salarySchema);
