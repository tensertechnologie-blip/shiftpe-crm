import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement
} from '../controllers/announcementController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAnnouncements);
router.post('/', requireCEO, createAnnouncement);
router.delete('/:id', requireCEO, deleteAnnouncement);
router.patch('/:id/pin', requireCEO, togglePinAnnouncement);

export default router;
