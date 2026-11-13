import { Response } from 'express';
import { z } from 'zod';
import { DirectoryAccess } from '../models/DirectoryAccess.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AUTHORIZED_SHIFTPE_EMAILS } from '../config/whitelist.js';

const grantAccessSchema = z.object({
  email: z
    .string()
    .email()
    .refine((val) => /@shiftpe\.(com|in)$/i.test(val.toLowerCase()), {
      message: 'Email must be a valid @shiftpe.in or @shiftpe.com corporate address'
    }),
  name: z.string().optional().default(''),
  designation: z.string().optional().default('Team Member'),
  department: z.string().optional().default('Engineering'),
  notes: z.string().optional().default('')
});

const revokeAccessSchema = z.object({
  email: z.string().email()
});

/**
 * Seed initial authorized corporate directory emails if not yet seeded
 */
async function ensureDefaultSeeds(addedByEmail: string) {
  try {
    for (const email of AUTHORIZED_SHIFTPE_EMAILS) {
      const exists = await DirectoryAccess.findOne({ email });
      if (!exists) {
        const parts = email.split('@')[0].split('.');
        const inferredName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        await DirectoryAccess.create({
          email,
          name: inferredName,
          designation: email.includes('founder') ? 'Founder / Leadership' : 'Corporate Operations',
          department: email.includes('founder') ? 'Executive' : 'Support',
          status: 'active',
          addedByEmail,
          notes: 'ShiftPe Founding Directory Whitelist'
        });
      }
    }
  } catch (err) {
    console.warn('Directory seed check notice:', err);
  }
}

/**
 * GET /api/access/directory
 * List all whitelisted emails with real-time registration status
 */
export async function getDirectory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await ensureDefaultSeeds(req.user.email);

    const directory = await DirectoryAccess.find().sort({ status: 1, createdAt: -1 });

    // Correlate with registered users to provide complete team telemetry
    const emails = directory.map(d => d.email);
    const existingUsers = await User.find({ email: { $in: emails } }).select('_id name email designation domain role status onboardingCompleted createdAt');
    const userMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));

    const enriched = directory.map(entry => {
      const userDoc = userMap.get(entry.email.toLowerCase());
      return {
        _id: entry._id,
        email: entry.email,
        name: userDoc?.name || entry.name || entry.email.split('@')[0],
        designation: userDoc?.designation || entry.designation || 'Team Member',
        department: userDoc?.domain || entry.department || 'General',
        status: entry.status,
        registered: !!userDoc,
        onboardingCompleted: userDoc?.onboardingCompleted || false,
        registeredUserId: userDoc?._id || null,
        addedByEmail: entry.addedByEmail,
        notes: entry.notes,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      directory: enriched
    });
  } catch (error: any) {
    console.error('getDirectory error:', error);
    res.status(500).json({ error: 'Failed to load directory: ' + error.message });
  }
}

/**
 * POST /api/access/directory/grant
 * CEO / Founder grants a teammate access by entering their business email
 */
export async function grantAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const parseResult = grantAccessSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, name, designation, department, notes } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const resolvedName = name.trim() || normalizedEmail.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

    const entry = await DirectoryAccess.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: resolvedName,
        designation: designation.trim() || 'Team Member',
        department: department.trim() || 'Engineering',
        status: 'active',
        addedBy: req.user.userId,
        addedByEmail: req.user.email,
        notes: notes.trim()
      },
      { upsert: true, new: true }
    );

    // If an existing registered user account was previously inactive, restore them
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.status === 'inactive') {
      existingUser.status = 'active';
      await existingUser.save();
    }

    await AuditLog.create({
      action: 'CRM_ACCESS_GRANTED',
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetId: entry._id.toString(),
      targetType: 'Directory',
      details: { email: normalizedEmail, name: resolvedName, designation }
    });

    res.status(200).json({
      success: true,
      message: `Access granted for ${normalizedEmail}. They can now register or sign into the CRM!`,
      entry
    });
  } catch (error: any) {
    console.error('grantAccess error:', error);
    res.status(500).json({ error: 'Failed to grant CRM access: ' + error.message });
  }
}

/**
 * POST /api/access/directory/revoke
 * CEO / Founder revokes a teammate's CRM access
 */
export async function revokeAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const parseResult = revokeAccessSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === req.user.email.toLowerCase()) {
      res.status(400).json({ error: 'You cannot revoke your own executive account access.' });
      return;
    }

    const entry = await DirectoryAccess.findOneAndUpdate(
      { email: normalizedEmail },
      { status: 'revoked' },
      { new: true }
    );

    // If user has an active account, deactivate it immediately
    const userDoc = await User.findOne({ email: normalizedEmail });
    if (userDoc) {
      userDoc.status = 'inactive';
      await userDoc.save();
    }

    await AuditLog.create({
      action: 'CRM_ACCESS_REVOKED',
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetId: entry?._id?.toString() || normalizedEmail,
      targetType: 'Directory',
      details: { email: normalizedEmail, accountDeactivated: !!userDoc }
    });

    res.status(200).json({
      success: true,
      message: `Access revoked for ${normalizedEmail}. They can no longer sign in or register.`,
      entry
    });
  } catch (error: any) {
    console.error('revokeAccess error:', error);
    res.status(500).json({ error: 'Failed to revoke access: ' + error.message });
  }
}

/**
 * POST /api/access/directory/restore
 * CEO / Founder re-enables access for a teammate
 */
export async function restoreAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const parseResult = revokeAccessSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const entry = await DirectoryAccess.findOneAndUpdate(
      { email: normalizedEmail },
      { status: 'active' },
      { new: true }
    );

    const userDoc = await User.findOne({ email: normalizedEmail });
    if (userDoc) {
      userDoc.status = 'active';
      await userDoc.save();
    }

    await AuditLog.create({
      action: 'CRM_ACCESS_RESTORED',
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetId: entry?._id?.toString() || normalizedEmail,
      targetType: 'Directory',
      details: { email: normalizedEmail }
    });

    res.status(200).json({
      success: true,
      message: `Access restored for ${normalizedEmail}.`,
      entry
    });
  } catch (error: any) {
    console.error('restoreAccess error:', error);
    res.status(500).json({ error: 'Failed to restore access: ' + error.message });
  }
}
