import { Response } from 'express';
import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

function getServerDateString(date = new Date()): string {
  // Use YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

// 1. Check in using SERVER time only
export async function checkIn(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const now = new Date();
    const today = getServerDateString(now);
    const { workMode = 'office' } = req.body;

    // Check if record exists for today
    const existing = await Attendance.findOne({ userId, date: today });
    if (existing) {
      res.status(400).json({
        error: `You have already recorded check-in for today at ${existing.checkIn.toLocaleTimeString()}`,
        attendance: existing
      });
      return;
    }

    const attendance = await Attendance.create({
      userId,
      date: today,
      checkIn: now,
      status: 'pending',
      workMode
    });

    res.status(201).json({
      message: 'Check-in recorded successfully using server timestamp',
      attendance
    });
  } catch (error) {
    console.error('checkIn error:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
}

// 2. Check out using SERVER time only
export async function checkOut(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const now = new Date();
    const today = getServerDateString(now);

    const attendance = await Attendance.findOne({ userId, date: today });
    if (!attendance) {
      res.status(400).json({ error: 'No check-in record found for today. You must check in before checking out.' });
      return;
    }

    if (attendance.checkOut) {
      res.status(400).json({
        error: `You have already checked out today at ${attendance.checkOut.toLocaleTimeString()}`,
        attendance
      });
      return;
    }

    attendance.checkOut = now;
    await attendance.save();

    res.status(200).json({
      message: 'Check-out recorded successfully using server timestamp',
      attendance
    });
  } catch (error) {
    console.error('checkOut error:', error);
    res.status(500).json({ error: 'Failed to record check-out' });
  }
}

// 3. Get Today's attendance status
export async function getTodayStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const today = getServerDateString();

    const attendance = await Attendance.findOne({ userId, date: today });
    res.status(200).json({
      date: today,
      attendance: attendance || null,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('getTodayStatus error:', error);
    res.status(500).json({ error: 'Failed to get today status' });
  }
}

// 4. Get User's Monthly Attendance
export async function getMyAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { month } = req.query; // YYYY-MM

    const query: any = { userId };
    if (month && typeof month === 'string') {
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    res.status(200).json({ records });
  } catch (error) {
    console.error('getMyAttendance error:', error);
    res.status(500).json({ error: 'Failed to load attendance history' });
  }
}

// 5. Get Pending Attendance (CEO only)
export async function getPendingAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const pending = await Attendance.find({ status: 'pending' })
      .populate('userId', 'name email designation domain role')
      .sort({ date: -1, checkIn: -1 });

    res.status(200).json({ records: pending });
  } catch (error) {
    console.error('getPendingAttendance error:', error);
    res.status(500).json({ error: 'Failed to load pending attendance' });
  }
}

// 6. Review Attendance (CEO only)
export async function reviewAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      return;
    }

    const record = await Attendance.findById(id);
    if (!record) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    record.status = status;
    record.reviewedBy = new mongoose.Types.ObjectId(req.user?.userId);
    record.reviewedAt = new Date();
    await record.save();

    await logAuditEvent(req, `attendance_${status}`, 'Attendance', record._id.toString(), {
      userId: record.userId.toString(),
      date: record.date,
      status
    });

    res.status(200).json({
      message: `Attendance marked as ${status}`,
      attendance: record
    });
  } catch (error) {
    console.error('reviewAttendance error:', error);
    res.status(500).json({ error: 'Failed to review attendance record' });
  }
}

// 7. Bulk Approve Attendance (CEO only)
export async function bulkApproveAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ids } = req.body;
    const reviewerId = new mongoose.Types.ObjectId(req.user?.userId);
    const now = new Date();

    let filter: any = { status: 'pending' };
    if (Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
    }

    const result = await Attendance.updateMany(filter, {
      $set: {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: now
      }
    });

    await logAuditEvent(req, 'attendance_bulk_approved', 'Attendance', undefined, {
      count: result.modifiedCount,
      ids: ids || 'all_pending'
    });

    res.status(200).json({
      message: `Successfully approved ${result.modifiedCount} attendance records`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('bulkApproveAttendance error:', error);
    res.status(500).json({ error: 'Failed to bulk approve attendance' });
  }
}
