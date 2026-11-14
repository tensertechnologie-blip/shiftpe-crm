import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, UserRole } from '../models/User.js';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  purpose?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as any;
    if (!decoded || decoded.purpose !== 'session') {
      res.status(401).json({ error: 'Invalid token purpose. Session token required.' });
      return;
    }

    const user = await User.findById(decoded.userId).select('email role name status');
    if (!user || user.status !== 'active') {
      res.status(401).json({ error: 'User not found or account is inactive.' });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      purpose: 'session'
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
    return;
  }
}
