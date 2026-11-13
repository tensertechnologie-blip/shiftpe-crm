import { Router } from 'express';
import {
  submitWork,
  getMyWorkLogs,
  getPendingWorkLogs,
  reviewWorkLog,
  updateWorkLog,
  getContributionGraph,
  getLeaderboard
} from '../controllers/workLogController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);

router.post('/', submitWork);
router.get('/my', getMyWorkLogs);
router.patch('/:id', updateWorkLog);
router.get('/contributions', getContributionGraph);
router.get('/leaderboard', getLeaderboard);

// CEO Approval routes
router.get('/pending', requireCEO, getPendingWorkLogs);
router.post('/:id/review', requireCEO, reviewWorkLog);

export default router;
