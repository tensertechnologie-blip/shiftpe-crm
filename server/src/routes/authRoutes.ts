import { Router, Response } from 'express';
import {
  login,
  verifyTotp,
  resetTotp,
  inviteUser,
  getMe,
  logout,
  registerTeammate,
  completeOnboarding,
  skipOnboarding
} from '../controllers/authController.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { requireCEO } from '../middleware/roles.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', loginLimiter, registerTeammate);
router.post('/login', loginLimiter, login);
router.post('/totp-verify', loginLimiter, verifyTotp);
router.post('/reset-totp', loginLimiter, resetTotp);
router.post('/onboarding', requireAuth, completeOnboarding);
router.post('/onboarding/skip', requireAuth, skipOnboarding);
router.post('/invite', requireAuth, requireCEO, inviteUser);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

// Diagnostic/test CEO endpoint
router.get('/ceo-only', requireAuth, requireCEO, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ message: 'Welcome to CEO command area', user: req.user });
});

export default router;
