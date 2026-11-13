import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { z } from 'zod';
import { User, IUser } from '../models/User.js';
import { Task } from '../models/Task.js';
import { AuditLog } from '../models/AuditLog.js';
import { DirectoryAccess } from '../models/DirectoryAccess.js';
import { config } from '../config/env.js';
import { AuthenticatedRequest, AuthUser } from '../middleware/auth.js';
import { sendTemporaryPasswordEmail } from '../services/emailService.js';
import { isEmailWhitelisted } from '../config/whitelist.js';

// Setup authenticator options
authenticator.options = { window: 1 };

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .refine((val) => /@shiftpe\.(com|in)$/i.test(val.toLowerCase()), {
      message: 'Access restricted to official @shiftpe.com or @shiftpe.in company email addresses'
    }),
  password: z.string().min(1, 'Password is required')
});

const totpVerifySchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().length(6, 'TOTP code must be 6 digits')
});

const registerTeammateSchema = z.object({
  email: z
    .string()
    .email()
    .refine((val) => /@shiftpe\.(com|in)$/i.test(val.toLowerCase()), {
      message: 'Access restricted to official @shiftpe.com or @shiftpe.in company email addresses'
    }),
  name: z.string().optional()
});

const onboardingSchema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  designation: z.string().min(2, 'Designation is required'),
  domain: z.string().min(2, 'Domain is required'),
  skills: z.array(z.string()).default([]),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional()
});

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `ShiftPe#${randomStr}${digits}`;
}

const inviteUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z
    .string()
    .email()
    .refine((val) => /@shiftpe\.(com|in)$/i.test(val.toLowerCase()), {
      message: 'Email must end with @shiftpe.com or @shiftpe.in'
    }),
  role: z.enum(['member', 'manager', 'ceo']).default('member'),
  designation: z.string().default('Team Member'),
  domain: z.string().default('General'),
  reportsTo: z.string().nullable().optional(),
  phone: z.string().optional().default(''),
  initialPassword: z.string().min(8, 'Password must be at least 8 characters')
});

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Enforce strict corporate email whitelist
    if (!(await isEmailWhitelisted(normalizedEmail))) {
      res.status(403).json({
        error: 'Access denied: This email address is not in the authorized ShiftPe company directory whitelist. Contact ajay.founder@shiftpe.in to provision access.'
      });
      return;
    }

    // Check database connection state
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'Database connection offline: MongoDB Atlas cluster is unreachable. Please verify your current IP is whitelisted in MongoDB Atlas under Network Access.'
      });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +totpSecret');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Your account is inactive. Please contact the administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check TOTP status
    if (!user.totpEnabled || !user.totpSecret) {
      // First-time or unconfigured TOTP -> Generate secret & QR code
      const secret = authenticator.generateSecret();
      user.totpSecret = secret;
      user.totpEnabled = false;
      await user.save();

      const otpauthUrl = authenticator.keyuri(user.email, 'ShiftPe Portal', secret);
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

      const tempToken = jwt.sign(
        { userId: user._id.toString(), step: 'totp_setup' },
        config.jwtSecret,
        { expiresIn: '10m' }
      );

      res.status(200).json({
        status: 'totp_setup_required',
        message: 'Scan the QR code in Google Authenticator or enter the manual secret',
        tempToken,
        qrCode: qrCodeDataUrl,
        manualSecret: secret,
        email: user.email
      });
      return;
    }

    // TOTP already configured -> Prompt for 6-digit code
    const tempToken = jwt.sign(
      { userId: user._id.toString(), step: 'totp_verify' },
      config.jwtSecret,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      status: 'totp_required',
      message: 'Enter the 6-digit code from your authenticator app',
      tempToken,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function verifyTotp(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = totpVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { tempToken, code } = parseResult.data;

    let decoded: { userId: string; step: string };
    try {
      decoded = jwt.verify(tempToken, config.jwtSecret) as { userId: string; step: string };
    } catch (e) {
      res.status(401).json({ error: 'Authentication session expired. Please log in again.' });
      return;
    }

    const user = await User.findById(decoded.userId).select('+totpSecret');
    if (!user || !user.totpSecret) {
      res.status(400).json({ error: 'User or TOTP secret not found' });
      return;
    }

    const isValid = authenticator.check(code, user.totpSecret);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid 6-digit authenticator code. Please try again.' });
      return;
    }

    // Enable TOTP if it was in setup mode
    if (!user.totpEnabled) {
      user.totpEnabled = true;
      await user.save();
    }

    // Link directory entry as registered if present
    await DirectoryAccess.findOneAndUpdate(
      { email: user.email.toLowerCase().trim() },
      { registered: true, registeredUserId: user._id }
    );

    // Sign permanent session token
    const authPayload: AuthUser = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    const sessionToken = jwt.sign(authPayload, config.jwtSecret, { expiresIn: '7d' });

    res.cookie('token', sessionToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: 'Authentication successful',
      token: sessionToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    res.status(500).json({ error: 'Internal server error during TOTP verification' });
  }
}

export async function inviteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = inviteUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name, email, role, designation, domain, reportsTo, phone, initialPassword } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: `User with email ${normalizedEmail} already exists` });
      return;
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      designation,
      domain,
      reportsTo: reportsTo || null,
      phone,
      totpEnabled: false,
      status: 'active'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.toJSON()
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId).populate('reportsTo', 'name email designation domain');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production'
  });
  res.status(200).json({ message: 'Logged out successfully' });
}

export async function registerTeammate(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerTeammateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, name } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Enforce strict corporate email whitelist
    if (!(await isEmailWhitelisted(normalizedEmail))) {
      res.status(403).json({
        error: 'Registration restricted: This email is not in the authorized ShiftPe company directory whitelist. Only provisioned mailboxes (e.g. ritesh.founder@shiftpe.in, ajay.founder@shiftpe.in) are permitted. Contact ajay.founder@shiftpe.in.'
      });
      return;
    }

    // Check database connection state
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'Database connection offline: MongoDB Atlas cluster is unreachable.'
      });
      return;
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user && user.onboardingCompleted && user.status === 'active') {
      res.status(409).json({
        error: 'Account already registered and active. Please sign in with your email and password.'
      });
      return;
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const resolvedName = name?.trim() || normalizedEmail.split('@')[0].replace(/[._]/g, ' ');

    if (!user) {
      user = await User.create({
        name: resolvedName,
        email: normalizedEmail,
        passwordHash,
        role: 'member',
        designation: 'Team Member',
        domain: 'General',
        phone: '',
        onboardingCompleted: false,
        isTemporaryPassword: true,
        status: 'active'
      });
    } else {
      // Re-issue temporary password for teammate who hasn't completed onboarding yet
      user.passwordHash = passwordHash;
      user.isTemporaryPassword = true;
      user.onboardingCompleted = false;
      await user.save();
    }

    // Link directory entry as registered if present
    await DirectoryAccess.findOneAndUpdate(
      { email: user.email.toLowerCase().trim() },
      { registered: true, registeredUserId: user._id }
    );

    // Send email with temporary password
    const emailResult = await sendTemporaryPasswordEmail(normalizedEmail, resolvedName, tempPassword);

    await AuditLog.create({
      action: 'TEAMMATE_REGISTERED',
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: user._id.toString(),
      targetType: 'User',
      details: { email: user.email, emailSent: emailResult.success }
    });

    res.status(200).json({
      success: true,
      message: `Access credentials dispatched to ${normalizedEmail}. Please check your business email inbox and enter the temporary password to sign in.`,
      email: normalizedEmail,
      devPassword: emailResult.preview ? tempPassword : undefined
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to process registration: ' + error.message });
  }
}

export async function completeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const parseResult = onboardingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name, phone, designation, domain, skills, newPassword } = parseResult.data;

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.name = name.trim();
    user.phone = phone.trim();
    user.designation = designation.trim();
    user.domain = domain.trim();
    user.skills = skills;
    user.onboardingCompleted = true;

    if (newPassword && newPassword.length >= 8) {
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.isTemporaryPassword = false;
    }

    await user.save();

    // Mark assigned onboarding task as done if exists
    await Task.updateMany(
      { assigneeId: user._id, title: 'Complete Teammate Onboarding & Profile' },
      { status: 'done' }
    );

    await AuditLog.create({
      action: 'ONBOARDING_COMPLETED',
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: user._id.toString(),
      targetType: 'User',
      details: { designation: user.designation, domain: user.domain }
    });

    res.status(200).json({
      success: true,
      message: 'Teammate profile & security credentials successfully updated. Welcome to ShiftPe!',
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding: ' + error.message });
  }
}

export async function skipOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.onboardingSkipped = true;
    await user.save();

    // Automatically create/assign the Onboarding Task
    const existingTask = await Task.findOne({
      assigneeId: user._id,
      title: 'Complete Teammate Onboarding & Profile'
    });

    if (!existingTask) {
      await Task.create({
        assigneeId: user._id,
        title: 'Complete Teammate Onboarding & Profile',
        description: 'Provide your department, designation, official phone number, and set your permanent password.',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdBy: user._id
      });
    }

    await AuditLog.create({
      action: 'ONBOARDING_SKIPPED',
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: user._id.toString(),
      targetType: 'User',
      details: { message: 'User skipped initial onboarding; high-priority task created' }
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding postponed. An assigned task and reminder have been added to your dashboard.',
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error('Skip onboarding error:', error);
    res.status(500).json({ error: 'Failed to skip onboarding: ' + error.message });
  }
}
