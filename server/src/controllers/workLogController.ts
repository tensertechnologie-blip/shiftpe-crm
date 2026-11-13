import { Response } from 'express';
import mongoose from 'mongoose';
import { WorkLog } from '../models/WorkLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

// 1. Submit Work
export async function submitWork(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { title, description, hours, link, date } = req.body;

    if (!title || !description || hours === undefined) {
      res.status(400).json({ error: 'Title, description, and hours are required' });
      return;
    }

    const parsedHours = Number(hours);
    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      res.status(400).json({ error: 'Hours must be a positive number up to 24' });
      return;
    }

    const logDate = date || new Date().toISOString().split('T')[0];

    // Members CANNOT set credits! We explicitly discard any credits passed by client.
    const workLog = await WorkLog.create({
      userId,
      date: logDate,
      title: title.trim(),
      description: description.trim(),
      hours: parsedHours,
      link: link ? link.trim() : '',
      status: 'pending',
      credits: undefined,
      reviewNote: ''
    });

    res.status(201).json({
      message: 'Work deliverable submitted successfully for CEO review',
      workLog
    });
  } catch (error) {
    console.error('submitWork error:', error);
    res.status(500).json({ error: 'Failed to submit work deliverable' });
  }
}

// 2. Get My Work Submissions
export async function getMyWorkLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const workLogs = await WorkLog.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ workLogs });
  } catch (error) {
    console.error('getMyWorkLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch work logs' });
  }
}

// 3. Get Pending Work for CEO Approval
export async function getPendingWorkLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const pendingLogs = await WorkLog.find({ status: 'pending' })
      .populate('userId', 'name email designation domain role')
      .sort({ createdAt: -1 });

    res.status(200).json({ workLogs: pendingLogs });
  } catch (error) {
    console.error('getPendingWorkLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch pending work submissions' });
  }
}

// 4. Review Work (CEO only: approve with credits 1-5, or reject with required reason)
export async function reviewWorkLog(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { action, credits, reviewNote } = req.body; // action: 'approve' | 'reject'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid work log ID' });
      return;
    }

    const workLog = await WorkLog.findById(id);
    if (!workLog) {
      res.status(404).json({ error: 'Work log not found' });
      return;
    }

    const reviewerId = new mongoose.Types.ObjectId(req.user?.userId);
    const now = new Date();

    if (action === 'approve') {
      const parsedCredits = Number(credits);
      if (!Number.isInteger(parsedCredits) || parsedCredits < 1 || parsedCredits > 5) {
        res.status(400).json({ error: 'Approving work requires an integer credit rating between 1 and 5' });
        return;
      }

      workLog.status = 'approved';
      workLog.credits = parsedCredits;
      workLog.reviewNote = reviewNote ? reviewNote.trim() : '';
      workLog.reviewedBy = reviewerId;
      workLog.reviewedAt = now;
      await workLog.save();

      await logAuditEvent(req, 'work_approved', 'WorkLog', workLog._id.toString(), {
        userId: workLog.userId.toString(),
        credits: parsedCredits,
        title: workLog.title
      });

      res.status(200).json({
        message: `Work approved with ${parsedCredits} credit(s)`,
        workLog
      });
      return;
    }

    if (action === 'reject') {
      // Must require a written reason
      if (!reviewNote || !reviewNote.trim()) {
        res.status(400).json({ error: 'A written reason is required when rejecting work so the teammate can revise and resubmit' });
        return;
      }

      workLog.status = 'rejected';
      workLog.credits = undefined;
      workLog.reviewNote = reviewNote.trim();
      workLog.reviewedBy = reviewerId;
      workLog.reviewedAt = now;
      await workLog.save();

      await logAuditEvent(req, 'work_rejected', 'WorkLog', workLog._id.toString(), {
        userId: workLog.userId.toString(),
        reason: reviewNote.trim(),
        title: workLog.title
      });

      res.status(200).json({
        message: 'Work submission rejected with feedback provided',
        workLog
      });
      return;
    }

    res.status(400).json({ error: "Invalid review action. Must be 'approve' or 'reject'." });
  } catch (error) {
    console.error('reviewWorkLog error:', error);
    res.status(500).json({ error: 'Failed to process work review' });
  }
}

// 5. Update/Resubmit Work (Approved records cannot be edited silently)
export async function updateWorkLog(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid work log ID' });
      return;
    }

    const workLog = await WorkLog.findById(id);
    if (!workLog) {
      res.status(404).json({ error: 'Work log not found' });
      return;
    }

    // Must be own record
    if (workLog.userId.toString() !== userId && req.user?.role !== 'ceo') {
      res.status(403).json({ error: 'Forbidden: You can only edit your own work submission' });
      return;
    }

    // Approved records cannot be edited silently!
    if (workLog.status === 'approved') {
      res.status(400).json({
        error: 'Approved work records are locked and cannot be edited. Please submit a new deliverable or contact the CEO.'
      });
      return;
    }

    const { title, description, hours, link } = req.body;
    if (title) workLog.title = title.trim();
    if (description) workLog.description = description.trim();
    if (hours !== undefined) {
      const parsedHours = Number(hours);
      if (parsedHours > 0 && parsedHours <= 24) workLog.hours = parsedHours;
    }
    if (link !== undefined) workLog.link = link.trim();

    // If was rejected, reset to pending for re-review
    if (workLog.status === 'rejected') {
      workLog.status = 'pending';
    }

    await workLog.save();

    res.status(200).json({
      message: 'Work submission updated and queued for review',
      workLog
    });
  } catch (error) {
    console.error('updateWorkLog error:', error);
    res.status(500).json({ error: 'Failed to update work submission' });
  }
}

// 6. Get 20-week Contribution Graph from approved workLogs
export async function getContributionGraph(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const targetUserId = req.query.userId ? req.query.userId.toString() : req.user?.userId;
    if (!targetUserId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Generate last 140 days (20 weeks)
    const days: { date: string; credits: number; count: number; level: number }[] = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 140);

    const approvedLogs = await WorkLog.find({
      userId: new mongoose.Types.ObjectId(targetUserId),
      status: 'approved',
      date: { $gte: startDate.toISOString().split('T')[0] }
    });

    const dayMap = new Map<string, { credits: number; count: number }>();
    approvedLogs.forEach((log) => {
      const existing = dayMap.get(log.date) || { credits: 0, count: 0 };
      existing.credits += log.credits || 0;
      existing.count += 1;
      dayMap.set(log.date, existing);
    });

    for (let i = 139; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stats = dayMap.get(dateStr) || { credits: 0, count: 0 };

      // Calculate intensity level 0-4
      let level = 0;
      if (stats.credits >= 10) level = 4;
      else if (stats.credits >= 6) level = 3;
      else if (stats.credits >= 3) level = 2;
      else if (stats.credits >= 1) level = 1;

      days.push({
        date: dateStr,
        credits: stats.credits,
        count: stats.count,
        level
      });
    }

    const totalCredits = approvedLogs.reduce((acc, curr) => acc + (curr.credits || 0), 0);
    const totalHours = approvedLogs.reduce((acc, curr) => acc + curr.hours, 0);

    res.status(200).json({
      days,
      totalCredits,
      totalHours,
      totalSubmissions: approvedLogs.length
    });
  } catch (error) {
    console.error('getContributionGraph error:', error);
    res.status(500).json({ error: 'Failed to compute contribution graph' });
  }
}

// 7. Get Team Leaderboard (ranked by total approved credits)
export async function getLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const aggregate = await WorkLog.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$userId',
          totalCredits: { $sum: '$credits' },
          totalHours: { $sum: '$hours' },
          deliverablesCount: { $sum: 1 }
        }
      },
      { $sort: { totalCredits: -1, totalHours: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalCredits: 1,
          totalHours: 1,
          deliverablesCount: 1,
          name: '$user.name',
          email: '$user.email',
          designation: '$user.designation',
          domain: '$user.domain',
          role: '$user.role'
        }
      }
    ]);

    res.status(200).json({ leaderboard: aggregate });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
}
