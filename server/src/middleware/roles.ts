import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../models/User.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
}

export const requireCEO = requireRole('ceo');
export const requireApprover = requireRole('ceo', 'manager');

export function isExecutive(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  if (user.role === 'ceo') return true;
  if (user.email && (user.email.includes('.founder@shiftpe.in') || user.email === 'founders@shiftpe.in')) {
    return true;
  }
  return false;
}

export function requireExecutive(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!isExecutive(req.user)) {
    res.status(403).json({
      error: 'Forbidden: Executive privileges required (CEO or Founder access only).'
    });
    return;
  }

  next();
}
