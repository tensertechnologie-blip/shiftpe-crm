import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  lateAfter: string; // e.g. "10:15"
  creditScale: {
    min: number;
    max: number;
  };
  enabledModules: string[];
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    lateAfter: { type: String, default: '10:15' },
    creditScale: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 5 }
    },
    enabledModules: {
      type: [String],
      default: ['attendance', 'tasks', 'workLogs', 'contributions', 'salary']
    }
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISetting>('Setting', settingSchema);
