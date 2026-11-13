import { Response } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// 1. Assign Task (CEO only)
export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { assigneeId, title, description, dueDate, priority } = req.body;

    if (!assigneeId || !title) {
      res.status(400).json({ error: 'Assignee and task title are required' });
      return;
    }

    const task = await Task.create({
      assigneeId: new mongoose.Types.ObjectId(assigneeId),
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
      status: 'todo',
      createdBy: new mongoose.Types.ObjectId(req.user?.userId)
    });

    res.status(201).json({ message: 'Task assigned successfully', task });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
}

// 2. Get My Tasks (Member sees only their own tasks)
export async function getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const tasks = await Task.find({ assigneeId: userId }).sort({ status: 1, dueDate: 1, createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('getMyTasks error:', error);
    res.status(500).json({ error: 'Failed to load user tasks' });
  }
}

// 3. Update Task Status (Member moves todo -> doing -> done)
export async function updateTaskStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!['todo', 'doing', 'done'].includes(status)) {
      res.status(400).json({ error: "Status must be 'todo', 'doing', or 'done'" });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.assigneeId.toString() !== userId && req.user?.role !== 'ceo') {
      res.status(403).json({ error: 'Forbidden: You can only update your own assigned tasks' });
      return;
    }

    task.status = status;
    await task.save();

    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

// 4. Get All Team Tasks (CEO only)
export async function getAllTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const tasks = await Task.find()
      .populate('assigneeId', 'name email designation domain')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('getAllTasks error:', error);
    res.status(500).json({ error: 'Failed to load all team tasks' });
  }
}
