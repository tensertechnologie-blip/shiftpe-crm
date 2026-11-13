import mongoose, { Document, Schema, Types } from 'mongoose';

export type AccessStatus = 'active' | 'revoked';

export interface IDirectoryAccess extends Document {
  email: string;
  name?: string;
  designation?: string;
  department?: string;
  status: AccessStatus;
  addedBy?: Types.ObjectId;
  addedByEmail: string;
  notes?: string;
  registered: boolean;
  registeredUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const directoryAccessSchema = new Schema<IDirectoryAccess>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: 'Team Member' },
    department: { type: String, trim: true, default: 'Engineering' },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true
    },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    addedByEmail: { type: String, default: 'system' },
    notes: { type: String, default: '' },
    registered: { type: Boolean, default: false },
    registeredUserId: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const DirectoryAccess = mongoose.model<IDirectoryAccess>('DirectoryAccess', directoryAccessSchema);
