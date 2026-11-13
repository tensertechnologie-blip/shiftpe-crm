import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireExecutive } from '../middleware/roles.js';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/wikiController.js';

const router = Router();

// General team can browse visible articles
router.get('/', requireAuth, getArticles);
router.get('/:id', requireAuth, getArticle);

// Management operations restricted exclusively to CEO & Founders
router.post('/', requireAuth, requireExecutive, createArticle);
router.put('/:id', requireAuth, requireExecutive, updateArticle);
router.delete('/:id', requireAuth, requireExecutive, deleteArticle);

export default router;
