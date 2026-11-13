import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkIn: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  workMode: 'office' | 'remote';
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD (server date)
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    workMode: {
      type: String,
      enum: ['office', 'remote'],
      default: 'office'
    }
  },
  { timestamps: true }
);

// Ensure one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
