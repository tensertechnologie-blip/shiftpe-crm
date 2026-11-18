import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'urgent'
  | 'announcement'
  | 'role_change'
  | 'attendance'
  | 'task'
  | 'security'
  | 'info';

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  priority: 'high' | 'normal' | 'low';
  sender?: mongoose.Types.ObjectId | null;
  senderName?: string;
  recipient?: mongoose.Types.ObjectId | null; // null = organization-wide broadcast
  readBy: mongoose.Types.ObjectId[];
  actionText?: string;
  actionLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['urgent', 'announcement', 'role_change', 'attendance', 'task', 'security', 'info'],
      default: 'info'
    },
    priority: {
      type: String,
      enum: ['high', 'normal', 'low'],
      default: 'normal'
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    senderName: { type: String, default: 'ShiftPe System' },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    actionText: { type: String, trim: true },
    actionLink: { type: String, trim: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, priority: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
