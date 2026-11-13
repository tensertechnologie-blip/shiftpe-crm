import { Router, Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);
router.use(requireCEO);

// GET /api/audit (CEO only: audit trail for approvals, credit changes, salary mutations)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ logs });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit log records' });
  }
});

export default router;
