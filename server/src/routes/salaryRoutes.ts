import { Router } from 'express';
import { getMySalaries, upsertSalary, markSalaryPaid, getAllSalaries } from '../controllers/salaryController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);

router.get('/my', getMySalaries);

// CEO Salary Operations
router.get('/all', requireCEO, getAllSalaries);
router.post('/', requireCEO, upsertSalary);
router.patch('/:id/pay', requireCEO, markSalaryPaid);

export default router;
