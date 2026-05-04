// Auth Controller
import { type Request, type Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  COOKIE_NAMES,
} from '../utils/cookieConfig';
import { auditAuthEvent } from '../utils/auditLogger';
import type {
  RegisterInput,
  LoginInput,
  DeleteAccountInput,
  UpdateProfileInput,
  ChangePasswordInput,
  ScheduleDeletionInput,
  ForceDeleteInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validations/auth.validation';

interface SessionInfo {
  userAgent?: string;
  ipAddress?: string;
}

const extractSessionInfo = (req: Request): SessionInfo => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0],
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as RegisterInput;
  const sessionInfo = extractSessionInfo(req);
  const result = await authService.register(data, sessionInfo);

  // Audit log: successful registration
  auditAuthEvent('REGISTER', 'SUCCESS', {
    userId: result.user.id,
    email: result.user.email,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  // Set httpOnly cookies
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.tokens.accessToken, getAccessTokenCookieOptions());
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    result.tokens.refreshToken,
    getRefreshTokenCookieOptions()
  );

  // Return user and session info, but NOT tokens
  res.status(201).json(
    createSuccessResponse({
      user: result.user,
      sessionInfo: result.sessionInfo,
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const sessionInfo = extractSessionInfo(req);

  try {
    const result = await authService.login(email, password, sessionInfo);

    // Audit log: successful login
    auditAuthEvent('LOGIN', 'SUCCESS', {
      userId: result.user.id,
      email: result.user.email,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
    });

    // Set httpOnly cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.tokens.accessToken, getAccessTokenCookieOptions());
    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      result.tokens.refreshToken,
      getRefreshTokenCookieOptions()
    );

    // Return user and session info, but NOT tokens
    res.json(
      createSuccessResponse({
        user: result.user,
        sessionInfo: result.sessionInfo,
      })
    );
  } catch (error) {
    // Audit log: failed login
    auditAuthEvent('LOGIN', 'FAILURE', {
      email,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      reason: error instanceof Error ? error.message : 'Authentication failed',
    });
    throw error;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
  const sessionInfo = extractSessionInfo(req);

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  // Audit log: logout
  auditAuthEvent('LOGOUT', 'SUCCESS', {
    userId: req.userId,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  // Clear httpOnly cookies
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, getClearCookieOptions());

  res.json(createSuccessResponse({ message: 'Logged out successfully' }));
});

export const logoutAllSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessionInfo = extractSessionInfo(req);

  await authService.logoutAllSessions(req.userId!);

  // Audit log: logout all sessions
  auditAuthEvent('LOGOUT_ALL', 'SUCCESS', {
    userId: req.userId,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  // Clear httpOnly cookies
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, getClearCookieOptions());

  res.json(
    createSuccessResponse({
      message: 'All sessions logged out successfully',
    })
  );
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

  if (!refreshToken) {
    throw new BadRequestError('Refresh token not found');
  }

  const sessionInfo = extractSessionInfo(req);
  const result = await authService.refreshAccessToken(refreshToken, sessionInfo);

  // Audit log: token refresh
  auditAuthEvent('TOKEN_REFRESH', 'SUCCESS', {
    userId: result.sessionInfo.userId,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  // Set new httpOnly cookies
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, getAccessTokenCookieOptions());
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, getRefreshTokenCookieOptions());

  // Return session info, but NOT tokens
  res.json(
    createSuccessResponse({
      sessionInfo: result.sessionInfo,
    })
  );
});

export const updateActivity = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

  if (refreshToken) {
    await authService.updateActivity(refreshToken);
  }

  res.json(createSuccessResponse({ message: 'Activity updated' }));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.userId!);
  res.json(createSuccessResponse(user));
});

export const getActiveSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await authService.getActiveSessions(req.userId!);
  const sanitizedSessions = sessions.map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
  }));

  res.json(createSuccessResponse(sanitizedSessions));
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const tokenId = getParamValue(req.params.tokenId);
  if (!tokenId) {
    throw new BadRequestError('Token ID is required');
  }
  await authService.revokeSession(tokenId, req.userId!);

  res.json(createSuccessResponse({ message: 'Session revoked successfully' }));
});

export const checkDeletionEligibility = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.checkDeletionEligibility(req.userId!);
  res.json(createSuccessResponse(result));
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { confirmation } = req.body as DeleteAccountInput;
  const sessionInfo = extractSessionInfo(req);

  await authService.deleteAccount(req.userId!, confirmation);

  // Audit log: account deletion
  auditAuthEvent('ACCOUNT_DELETE', 'SUCCESS', {
    userId: req.userId,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  // Clear httpOnly cookies
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, getClearCookieOptions());

  res.json(
    createSuccessResponse({
      message: 'Account deleted successfully',
    })
  );
});

export const scheduleDeletion = asyncHandler(async (req: Request, res: Response) => {
  const { confirmation } = req.body as ScheduleDeletionInput;

  const result = await authService.scheduleDeletion(req.userId!, confirmation);

  res.status(201).json(
    createSuccessResponse({
      id: result.id,
      requestedAt: result.requestedAt.toISOString(),
      scheduledDeletionAt: result.scheduledDeletionAt.toISOString(),
      gracePeriodDays: result.gracePeriodDays,
      status: result.status,
      blockedTeamIds: result.blockedTeamIds,
    })
  );
});

export const cancelScheduledDeletion = asyncHandler(async (req: Request, res: Response) => {
  await authService.cancelScheduledDeletion(req.userId!);

  res.json(createSuccessResponse({ message: 'Scheduled deletion cancelled successfully' }));
});

export const forceDeleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { confirmation } = req.body as ForceDeleteInput;

  await authService.forceDeleteAccount(req.userId!, confirmation);

  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, getClearCookieOptions());

  res.json(createSuccessResponse({ message: 'Account deleted successfully' }));
});

export const getDeletionStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getDeletionStatus(req.userId!);

  res.json(createSuccessResponse(result));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateProfileInput;
  const user = await authService.updateProfile(req.userId!, data);
  res.json(createSuccessResponse(user));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ChangePasswordInput;
  const sessionInfo = extractSessionInfo(req);

  await authService.changePassword(
    req.userId!,
    data.currentPassword,
    data.newPassword,
    sessionInfo
  );

  // Audit log: password change
  auditAuthEvent('PASSWORD_CHANGE', 'SUCCESS', {
    userId: req.userId,
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  res.json(
    createSuccessResponse({
      message: 'Password changed successfully',
    })
  );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordInput;
  const sessionInfo = extractSessionInfo(req);

  await authService.requestPasswordReset(email, sessionInfo);

  res.json(
    createSuccessResponse({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  );
});

export const validateResetToken = asyncHandler(async (req: Request, res: Response) => {
  const token = getParamValue(req.params.token);

  if (!token) {
    throw new BadRequestError('Reset token is required');
  }

  const result = await authService.validateResetToken(token);

  res.json(createSuccessResponse(result));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as ResetPasswordInput;
  const sessionInfo = extractSessionInfo(req);

  await authService.resetPassword(token, newPassword, sessionInfo);

  // Audit log: password reset
  auditAuthEvent('PASSWORD_RESET', 'SUCCESS', {
    ipAddress: sessionInfo.ipAddress,
    userAgent: sessionInfo.userAgent,
  });

  res.json(
    createSuccessResponse({
      message: 'Password reset successfully',
    })
  );
});
