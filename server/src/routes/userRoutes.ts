import { Router } from 'express';
import { getPeople, getUserProfile, updateUser, getOrgTree, getDomains } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getPeople);
router.get('/tree', getOrgTree);
router.get('/domains', getDomains);
router.get('/:id/profile', getUserProfile);
router.patch('/:id', updateUser);

export default router;
