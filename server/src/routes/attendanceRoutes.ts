import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getPendingAttendance,
  reviewAttendance,
  bulkApproveAttendance
} from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my', getMyAttendance);

// CEO approval routes
router.get('/pending', requireCEO, getPendingAttendance);
router.post('/bulk-approve', requireCEO, bulkApproveAttendance);
router.post('/:id/review', requireCEO, reviewAttendance);

export default router;
