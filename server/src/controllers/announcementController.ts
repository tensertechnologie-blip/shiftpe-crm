import { Response } from 'express';
import { Announcement } from '../models/Announcement.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const announcements = await Announcement.find()
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return res.json({ success: true, announcements });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, category, pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const user = req.user!;
    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'milestone',
      author: user.userId,
      authorName: user.name || 'Ajay (CEO)',
      authorRole: user.role,
      pinned: Boolean(pinned)
    });

    // Audit log
    await AuditLog.create({
      action: 'ANNOUNCEMENT_CREATED',
      actorId: user.userId,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: announcement._id.toString(),
      targetType: 'Announcement',
      details: { title: announcement.title, category: announcement.category }
    });

    return res.status(201).json({ success: true, announcement });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await AuditLog.create({
      action: 'ANNOUNCEMENT_DELETED',
      actorId: user.userId,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: announcement._id.toString(),
      targetType: 'Announcement',
      details: { title: announcement.title }
    });

    return res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePinAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcement.pinned = !announcement.pinned;
    await announcement.save();

    return res.json({ success: true, announcement });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
