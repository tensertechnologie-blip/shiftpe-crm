import mongoose, { Document, Schema, Types } from 'mongoose';

export type WorkLogStatus = 'pending' | 'approved' | 'rejected';

export interface IWorkLog extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  hours: number;
  link?: string;
  status: WorkLogStatus;
  credits?: number; // 1-5, set by approver only
  reviewNote?: string; // required on rejection
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workLogSchema = new Schema<IWorkLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 0.1, max: 24 },
    link: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true
    },
    credits: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function (val: number) {
          return val === undefined || (Number.isInteger(val) && val >= 1 && val <= 5);
        },
        message: 'Credits must be an integer between 1 and 5'
      }
    },
    reviewNote: { type: String, trim: true, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

workLogSchema.index({ date: 1, status: 1 });

export const WorkLog = mongoose.model<IWorkLog>('WorkLog', workLogSchema);
