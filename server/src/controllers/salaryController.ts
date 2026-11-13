import { Response } from 'express';
import mongoose from 'mongoose';
import { Salary } from '../models/Salary.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

// 1. Get My Salary (Member sees ONLY their own records. Never return other users' salary)
export async function getMySalaries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const records = await Salary.find({ userId }).sort({ month: -1 });
    res.status(200).json({ salaries: records });
  } catch (error) {
    console.error('getMySalaries error:', error);
    res.status(500).json({ error: 'Failed to fetch salary records' });
  }
}

// 2. Set or Update Monthly Salary Record (CEO only)
export async function upsertSalary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, month, amount, paid, notes } = req.body;

    if (!userId || !month || amount === undefined) {
      res.status(400).json({ error: 'userId, month (YYYY-MM), and amount are required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      res.status(400).json({ error: 'Amount must be a non-negative number' });
      return;
    }

    const existing = await Salary.findOne({ userId, month });
    if (existing) {
      existing.amount = parsedAmount;
      if (paid !== undefined) {
        existing.paid = Boolean(paid);
        if (existing.paid && !existing.paidOn) existing.paidOn = new Date();
      }
      if (notes !== undefined) existing.notes = notes;
      await existing.save();

      await logAuditEvent(req, 'salary_updated', 'Salary', existing._id.toString(), {
        userId,
        month,
        amount: parsedAmount,
        paid: existing.paid
      });

      res.status(200).json({ message: 'Salary record updated successfully', salary: existing });
      return;
    }

    const newSalary = await Salary.create({
      userId: new mongoose.Types.ObjectId(userId),
      month,
      amount: parsedAmount,
      paid: Boolean(paid),
      paidOn: paid ? new Date() : undefined,
      notes: notes || ''
    });

    await logAuditEvent(req, 'salary_created', 'Salary', newSalary._id.toString(), {
      userId,
      month,
      amount: parsedAmount,
      paid: newSalary.paid
    });

    res.status(201).json({ message: 'Salary record created successfully', salary: newSalary });
  } catch (error) {
    console.error('upsertSalary error:', error);
    res.status(500).json({ error: 'Failed to manage salary record' });
  }
}

// 3. Mark Salary as Paid (CEO only)
export async function markSalaryPaid(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const salary = await Salary.findById(id);
    if (!salary) {
      res.status(404).json({ error: 'Salary record not found' });
      return;
    }

    salary.paid = true;
    salary.paidOn = new Date();
    await salary.save();

    await logAuditEvent(req, 'salary_marked_paid', 'Salary', salary._id.toString(), {
      userId: salary.userId.toString(),
      month: salary.month,
      amount: salary.amount
    });

    res.status(200).json({ message: 'Salary marked as paid successfully', salary });
  } catch (error) {
    console.error('markSalaryPaid error:', error);
    res.status(500).json({ error: 'Failed to update salary payment' });
  }
}

// 4. Get All Salaries (CEO only)
export async function getAllSalaries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { month } = req.query;
    const query: any = {};
    if (month && typeof month === 'string') {
      query.month = month;
    }

    const salaries = await Salary.find(query)
      .populate('userId', 'name email designation domain role')
      .sort({ month: -1, createdAt: -1 });

    res.status(200).json({ salaries });
  } catch (error) {
    console.error('getAllSalaries error:', error);
    res.status(500).json({ error: 'Failed to load company payroll' });
  }
}
