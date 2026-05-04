// Auth Routes
import { Router, type Router as RouterType } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  authRateLimit,
  loginRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
} from '../middleware/rateLimit.middleware';
import { generateCsrfTokenHandler } from '../middleware/csrf.middleware';
import {
  registerSchema,
  loginSchema,
  deleteAccountSchema,
  updateProfileSchema,
  changePasswordSchema,
  scheduleDeletionSchema,
  forceDeleteSchema,
  forgotPasswordSchema,
  validateResetTokenSchema,
  resetPasswordSchema,
} from '../validations/auth.validation';

const router: RouterType = Router();

router.get('/csrf-token', generateCsrfTokenHandler);

router.post('/register', authRateLimit, validateBody(registerSchema), authController.register);

router.post('/login', loginRateLimit, validateBody(loginSchema), authController.login);

// Password reset routes
router.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.get(
  '/reset-password/:token',
  validateParams(validateResetTokenSchema),
  authController.validateResetToken
);

router.post(
  '/reset-password',
  resetPasswordRateLimit,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// Logout uses cookie-based authentication - no body validation needed
router.post('/logout', authController.logout);

router.post('/logout-all', authenticate, authController.logoutAllSessions);

// Token refresh uses cookie-based authentication - no body validation needed
// The refresh token is extracted from httpOnly cookies in the controller
router.post('/refresh', authRateLimit, authController.refreshToken);

// Activity endpoint uses cookie-based auth, no body validation needed
router.post('/activity', authController.updateActivity);

router.get('/me', authenticate, authController.getCurrentUser);

router.put(
  '/me/profile',
  authenticate,
  validateBody(updateProfileSchema),
  authController.updateProfile
);

router.put(
  '/me/password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

router.get('/me/deletion-check', authenticate, authController.checkDeletionEligibility);

router.delete('/me', authenticate, validateBody(deleteAccountSchema), authController.deleteAccount);

router.post(
  '/me/schedule-deletion',
  authenticate,
  validateBody(scheduleDeletionSchema),
  authController.scheduleDeletion
);

router.delete('/me/schedule-deletion', authenticate, authController.cancelScheduledDeletion);

router.post(
  '/me/force-delete',
  authenticate,
  validateBody(forceDeleteSchema),
  authController.forceDeleteAccount
);

router.get('/me/deletion-status', authenticate, authController.getDeletionStatus);

router.get('/sessions', authenticate, authController.getActiveSessions);

router.delete('/sessions/:tokenId', authenticate, authController.revokeSession);

export default router;
