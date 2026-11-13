import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireExecutive } from '../middleware/roles.js';
import {
  getDirectory,
  grantAccess,
  revokeAccess,
  restoreAccess
} from '../controllers/directoryController.js';

const router = Router();

// All directory management routes are restricted to CEO & Founders
router.use(requireAuth, requireExecutive);

router.get('/', getDirectory);
router.post('/grant', grantAccess);
router.post('/revoke', revokeAccess);
router.post('/restore', restoreAccess);

export default router;
