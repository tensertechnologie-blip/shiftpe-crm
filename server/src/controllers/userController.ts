import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User, IUser } from '../models/User.js';
import { Domain } from '../models/Domain.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { logAuditEvent } from '../utils/audit.js';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters').optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  skills: z.array(z.string()).max(30, 'Skills must contain at most 30 items').optional(),
  designation: z.string().optional(),
  domain: z.string().optional(),
  reportsTo: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  role: z.enum(['member', 'manager', 'ceo']).optional()
});

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
      filter.domain = String(domain);
    }

    if (search && typeof search === 'string') {
      const searchStr = escapeRegex(search.trim().slice(0, 50));
      const regex = new RegExp(searchStr, 'i');
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

    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name, phone, skills, designation, domain, reportsTo, status, role } = parseResult.data;

    // Refuse to demote or deactivate the last remaining CEO
    if (targetUser.role === 'ceo') {
      const isDemoting = role !== undefined && role !== 'ceo';
      const isDeactivating = status !== undefined && status === 'inactive';
      if (isDemoting || isDeactivating) {
        const activeCeoCount = await User.countDocuments({ role: 'ceo', status: 'active' });
        if (activeCeoCount <= 1) {
          res.status(400).json({ error: 'Cannot demote or deactivate the last remaining CEO.' });
          return;
        }
      }
    }

    const previousRole = targetUser.role;
    const previousStatus = targetUser.status;

    // Both CEO and self can update profile details: name, phone, skills, designation, domain, and reportsTo
    if (name !== undefined) targetUser.name = name.trim();
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (skills !== undefined && Array.isArray(skills)) targetUser.skills = skills;
    if (designation !== undefined) targetUser.designation = designation.trim();
    if (domain !== undefined) targetUser.domain = domain.trim();

    if (reportsTo !== undefined) {
      if (reportsTo === null || reportsTo === '' || reportsTo === 'none') {
        targetUser.reportsTo = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(reportsTo)) {
          res.status(400).json({ error: 'Invalid reportsTo user ID' });
          return;
        }

        // Validate that target manager exists and is active within the organization
        const managerUser = await User.findById(reportsTo);
        if (!managerUser || managerUser.status !== 'active') {
          res.status(400).json({ error: 'Selected manager does not exist or is inactive' });
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

    // Only CEO can update account status and security role
    if (isCeo) {
      if (status !== undefined) targetUser.status = status;
      if (role !== undefined) targetUser.role = role;
    }

    await targetUser.save();

    // Call logAuditEvent for any role or status change
    if ((role !== undefined && role !== previousRole) || (status !== undefined && status !== previousStatus)) {
      await logAuditEvent(req, 'user_role_or_status_changed', 'User', id, {
        previousRole,
        newRole: targetUser.role,
        previousStatus,
        newStatus: targetUser.status
      });
    }

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
