import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'member' | 'manager' | 'ceo';
export type UserStatus = 'active' | 'inactive';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  totpSecret?: string;
  totpEnabled: boolean;
  role: UserRole;
  designation: string;
  domain: string;
  reportsTo?: Types.ObjectId | null;
  skills: string[];
  phone: string;
  joinDate: Date;
  status: UserStatus;
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
  isTemporaryPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[\w.-]+@shiftpe\.(com|in)$/i.test(v);
        },
        message: (props: { value: string }) => `${props.value} is not a valid @shiftpe.com or @shiftpe.in email address!`
      }
    },
    passwordHash: { type: String, required: true },
    totpSecret: { type: String, select: true },
    totpEnabled: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['member', 'manager', 'ceo'],
      default: 'member',
      required: true
    },
    designation: { type: String, default: 'Team Member', trim: true },
    domain: { type: String, default: 'General', trim: true },
    reportsTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    skills: { type: [String], default: [] },
    phone: { type: String, default: '', trim: true },
    joinDate: { type: Date, default: Date.now },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSkipped: { type: Boolean, default: false },
    isTemporaryPassword: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.totpSecret;
  return obj;
};

export const User = mongoose.model<IUser>('User', userSchema);
