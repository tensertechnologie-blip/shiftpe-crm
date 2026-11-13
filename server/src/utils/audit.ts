import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function logAuditEvent(
  req: AuthenticatedRequest,
  action: string,
  targetType: 'Attendance' | 'WorkLog' | 'Salary' | 'User',
  targetId?: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    if (!req.user) return;
    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(req.user.userId),
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : undefined,
      details,
      ipAddress: req.ip || req.socket.remoteAddress || ''
    });
  } catch (error) {
    console.error('Audit log creation error:', error);
  }
}
