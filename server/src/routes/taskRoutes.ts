import { Router } from 'express';
import { createTask, getMyTasks, updateTaskStatus, getAllTasks } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);

router.get('/my', getMyTasks);
router.patch('/:id/status', updateTaskStatus);

// CEO Task Management
router.post('/', requireCEO, createTask);
router.get('/all', requireCEO, getAllTasks);

export default router;
