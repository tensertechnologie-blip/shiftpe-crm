import { Response } from 'express';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { Domain } from '../models/Domain.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Helper: Detect circular reporting chain
export async function wouldCreateReportingCycle(userId: string, targetManagerId: string): Promise<boolean> {
  if (userId === targetManagerId) {
    return true;
  }

  let currentId: string | null = targetManagerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === userId) {
      return true; // Cycle detected
    }
    if (visited.has(currentId)) {
      return true; // Malformed graph cycle
    }
    visited.add(currentId);

    const manager: IUser | null = await User.findById(currentId).select('reportsTo');
    if (!manager || !manager.reportsTo) {
      break;
    }
    currentId = manager.reportsTo.toString();
  }

  return false;
}

// 1. Get People Directory with domain filter & search
export async function getPeople(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { domain, search } = req.query;
    const filter: any = {};

    // Standard members only see active accounts
    if (req.user?.role !== 'ceo') {
      filter.status = 'active';
    }

    if (domain && domain !== 'all') {
      filter.domain = domain;
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { designation: regex }, { skills: regex }];
    }

    const users = await User.find(filter)
      .populate('reportsTo', 'name email designation domain')
      .sort({ role: -1, name: 1 });

    res.status(200).json({ users });
  } catch (error) {
    console.error('getPeople error:', error);
    res.status(500).json({ error: 'Failed to retrieve directory members' });
  }
}

// 2. Get User Profile with chain to CEO and direct reports
export async function getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(id).populate('reportsTo', 'name email designation domain');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Build chain to CEO
    const chainToCeo: Array<{ _id: string; name: string; designation: string; domain: string; role: string }> = [];
    let currentReportsTo = user.reportsTo as any;

    const visited = new Set<string>();
    while (currentReportsTo && !visited.has(currentReportsTo._id.toString())) {
      visited.add(currentReportsTo._id.toString());
      chainToCeo.push({
        _id: currentReportsTo._id.toString(),
        name: currentReportsTo.name,
        designation: currentReportsTo.designation,
        domain: currentReportsTo.domain,
        role: currentReportsTo.role
      });

      const parent: IUser | null = await User.findById(currentReportsTo._id).populate('reportsTo', 'name email designation domain role');
      currentReportsTo = parent?.reportsTo as any;
    }

    // Direct reports
    const directReports = await User.find({ reportsTo: user._id, status: 'active' }).select('name email designation domain role phone');

    res.status(200).json({
      user,
      chainToCeo,
      directReports
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
}

// 3. Update User (CEO edits organizational fields; Member edits phone & skills)
export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isCeo = req.user?.role === 'ceo';
    const isSelf = req.user?.userId === id;

    if (!isCeo && !isSelf) {
      res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
      return;
    }

    const { phone, skills, designation, domain, reportsTo, status, role } = req.body;

    // Both CEO and self can update phone and skills
    if (phone !== undefined) targetUser.phone = phone;
    if (skills !== undefined && Array.isArray(skills)) targetUser.skills = skills;

    // Only CEO can update organizational fields
    if (isCeo) {
      if (designation !== undefined) targetUser.designation = designation;
      if (domain !== undefined) targetUser.domain = domain;
      if (status !== undefined) targetUser.status = status;
      if (role !== undefined) targetUser.role = role;

      if (reportsTo !== undefined) {
        if (reportsTo === null || reportsTo === '') {
          targetUser.reportsTo = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(reportsTo)) {
            res.status(400).json({ error: 'Invalid reportsTo user ID' });
            return;
          }

          // Cycle check
          const isCycle = await wouldCreateReportingCycle(id, reportsTo);
          if (isCycle) {
            res.status(400).json({
              error: 'Invalid hierarchy: A circular reporting relationship was detected. A teammate cannot report to their own direct or indirect subordinate.'
            });
            return;
          }

          targetUser.reportsTo = new mongoose.Types.ObjectId(reportsTo);
        }
      }
    }

    await targetUser.save();

    const updated = await User.findById(id).populate('reportsTo', 'name email designation domain');
    res.status(200).json({
      message: 'User profile updated successfully',
      user: updated
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

// 4. Get Org Tree
export async function getOrgTree(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await User.find({ status: 'active' })
      .select('name email designation domain role reportsTo phone')
      .lean();

    res.status(200).json({ users });
  } catch (error) {
    console.error('getOrgTree error:', error);
    res.status(500).json({ error: 'Failed to construct organization tree' });
  }
}

// 5. Domains list
export async function getDomains(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const domains = await Domain.find({ active: true }).sort({ name: 1 });
    res.status(200).json({ domains });
  } catch (error) {
    console.error('getDomains error:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
}
