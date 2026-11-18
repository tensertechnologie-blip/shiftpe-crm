import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Notification, INotification } from '../models/Notification.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

const createNotificationSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  message: z.string().min(3, 'Message must be at least 3 characters').max(1000),
  type: z.enum(['urgent', 'announcement', 'role_change', 'attendance', 'task', 'security', 'info']).default('info'),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  recipient: z.string().nullable().optional(),
  actionText: z.string().optional(),
  actionLink: z.string().optional()
});

// 1. Get notifications for current user (including global broadcasts)
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notifications = await Notification.find({
      $or: [
        { recipient: null }, // broadcast to all
        { recipient: userObjectId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = notifications.map((n) => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      senderName: n.senderName,
      actionText: n.actionText,
      actionLink: n.actionLink,
      createdAt: n.createdAt,
      read: Array.isArray(n.readBy) && n.readBy.some((id) => id.toString() === userId)
    }));

    const unreadCount = formatted.filter((n) => !n.read).length;
    const hasUrgent = formatted.some((n) => (n.type === 'urgent' || n.priority === 'high') && !n.read);

    res.status(200).json({
      notifications: formatted,
      unreadCount,
      hasUrgent
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
}

// 2. Mark single notification as read
export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: new mongoose.Types.ObjectId(userId) }
    });

    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}

// 3. Mark all notifications as read for current user
export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    await Notification.updateMany(
      {
        $or: [{ recipient: null }, { recipient: userObjectId }],
        readBy: { $ne: userObjectId }
      },
      {
        $addToSet: { readBy: userObjectId }
      }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

// 4. CEO Broadcast Alert or targeted notification
export async function createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'ceo') {
      res.status(403).json({ error: 'Forbidden: Only CEO administrators can broadcast notifications' });
      return;
    }

    const parsed = createNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { title, message, type, priority, recipient, actionText, actionLink } = parsed.data;

    let targetRecipient: mongoose.Types.ObjectId | null = null;
    if (recipient && mongoose.Types.ObjectId.isValid(recipient)) {
      targetRecipient = new mongoose.Types.ObjectId(recipient);
    }

    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
      priority: type === 'urgent' ? 'high' : (priority || 'normal'),
      sender: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null,
      senderName: req.user?.email ? req.user.email.split('@')[0] : 'CEO Administration',
      recipient: targetRecipient,
      readBy: [],
      actionText: actionText ? actionText.trim() : undefined,
      actionLink: actionLink ? actionLink.trim() : undefined
    });

    await logAuditEvent(req, 'notification_broadcast_created', 'Notification', notification._id.toString(), {
      title,
      type,
      recipient: recipient || 'ALL_TEAMMATES'
    });

    res.status(201).json({
      message: 'Notification published successfully',
      notification
    });
  } catch (error) {
    console.error('createNotification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
}
