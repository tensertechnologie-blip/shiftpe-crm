import mongoose, { Document, Schema } from 'mongoose';

export interface IDomain extends Document {
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const domainSchema = new Schema<IDomain>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Domain = mongoose.model<IDomain>('Domain', domainSchema);
