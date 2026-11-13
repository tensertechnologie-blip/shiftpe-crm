import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetId?: string;
  targetType: 'Attendance' | 'WorkLog' | 'Salary' | 'User' | 'Announcement' | 'Directory' | 'Wiki';
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    targetType: {
      type: String,
      enum: ['Attendance', 'WorkLog', 'Salary', 'User', 'Announcement', 'Directory', 'Wiki'],
      required: true
    },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
