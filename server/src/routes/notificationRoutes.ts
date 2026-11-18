import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
} from '../controllers/notificationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/', createNotification);
router.post('/read-all', markAllAsRead);
router.post('/:id/read', markAsRead);

export default router;
