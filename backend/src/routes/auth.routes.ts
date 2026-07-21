import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  recoverPassword,
  resetPassword,
  changePassword,
  profile,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public routes
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/recover-password', authLimiter, recoverPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Private/Protected routes
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, authLimiter, changePassword);
router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, updateProfile);

export default router;
