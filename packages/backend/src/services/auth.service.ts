// Authentication Service
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import prisma from '../utils/prisma';
import config from '../config';
import {
  UnauthorizedError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  SessionIdleTimeoutError,
  SessionAbsoluteTimeoutError,
  SessionRevokedError,
  SessionExpiredError,
  AccountDeletionBlockedError,
  InvalidConfirmationError,
} from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { logger } from '../utils/logger';
import { emailService } from './email/index.js';
import {
  PasswordResetTemplate,
  PasswordChangeTemplate,
  WelcomeEmailTemplate,
} from './email/templates/index.js';
import type { User, RefreshToken } from '../generated/prisma/client';
import type { DeletionEligibilityResult, ScheduledDeletion } from '../types/user.types';

interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

interface SessionInfo {
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginResponse {
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  sessionInfo: {
    expiresAt: Date;
    idleTimeoutMs: number;
    absoluteTimeoutMs: number;
    warningThresholdMs: number;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  termsAccepted: true;
  marketingOptIn: boolean;
}

interface SessionValidationResult {
  isValid: boolean;
  reason?: 'expired' | 'revoked' | 'idle_timeout' | 'absolute_timeout';
  token?: RefreshToken;
}

class AuthService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private initialized = false;

  constructor() {
    // Don't start jobs in constructor - use lazy initialization
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.startCleanupJob();
    this.setupGracefulShutdown();
    this.initialized = true;
  }

  async register(data: RegisterData, sessionInfo?: SessionInfo): Promise<LoginResponse> {
    const { email, password, firstName, lastName } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);
    const userId = generateUUIDv7();
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        termsAcceptedAt: now,
        marketingOptIn: data.marketingOptIn,
        marketingOptInAt: data.marketingOptIn ? now : null,
      },
    });

    // Create GDPR consent audit records
    const consentVersion = now.toISOString().split('T')[0] ?? 'unknown';
    await prisma.consentRecord.createMany({
      data: [
        {
          id: generateUUIDv7(),
          userId: user.id,
          consentType: 'terms_of_service',
          action: 'granted',
          version: consentVersion,
          ipAddress: sessionInfo?.ipAddress ?? null,
          userAgent: sessionInfo?.userAgent ?? null,
        },
        ...(data.marketingOptIn
          ? [
              {
                id: generateUUIDv7(),
                userId: user.id,
                consentType: 'marketing_communications',
                action: 'granted',
                version: consentVersion,
                ipAddress: sessionInfo?.ipAddress ?? null,
                userAgent: sessionInfo?.userAgent ?? null,
              },
            ]
          : []),
      ],
    });

    const tokens = await this.generateTokens(user.id, user.email, sessionInfo);

    // Send welcome email (non-blocking - don't wait for it)
    this.sendWelcomeEmail(user, sessionInfo).catch((error) => {
      logger.error('Failed to send welcome email', {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      sessionInfo: this.getSessionInfo(),
    };
  }

  async login(email: string, password: string, sessionInfo?: SessionInfo): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.enforceMaxConcurrentSessions(user.id);

    const tokens = await this.generateTokens(user.id, user.email, sessionInfo);

    return {
      user: this.sanitizeUser(user),
      tokens,
      sessionInfo: this.getSessionInfo(),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      const tokenIdentifier = this.generateTokenIdentifier(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { token: tokenIdentifier },
        data: { revokedAt: new Date() },
      });
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.info('All sessions revoked for user', { userId });
  }

  async refreshAccessToken(
    refreshToken: string,
    sessionInfo?: SessionInfo
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionInfo: LoginResponse['sessionInfo'] & { userId: string };
  }> {
    const tokenIdentifier = this.generateTokenIdentifier(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: tokenIdentifier },
    });

    if (storedToken?.tokenHash) {
      const isValidToken = this.compareToken(refreshToken, storedToken.tokenHash);
      if (!isValidToken) {
        throw new SessionExpiredError();
      }
    }

    // Update lastActivityAt before validation to ensure token refresh counts as activity
    // This prevents session timeout when the user is actively using the application
    // but the activity tracking had issues (e.g., failed updates, race conditions)
    if (storedToken && !storedToken.revokedAt) {
      try {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { lastActivityAt: new Date() },
        });
        // Update the storedToken object to reflect the new activity time for validation
        storedToken.lastActivityAt = new Date();
      } catch (error) {
        // Log but continue - validation will use original timestamp
        logger.debug('Failed to update activity during token refresh', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const validation = await this.validateSession(storedToken);

    if (!validation.isValid) {
      switch (validation.reason) {
        case 'idle_timeout':
          throw new SessionIdleTimeoutError();
        case 'absolute_timeout':
          throw new SessionAbsoluteTimeoutError();
        case 'revoked':
          throw new SessionRevokedError();
        case 'expired':
        default:
          throw new SessionExpiredError();
      }
    }

    if (!storedToken) {
      throw new SessionExpiredError();
    }

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, sessionInfo);

    return {
      ...tokens,
      sessionInfo: {
        ...this.getSessionInfo(),
        userId: user.id,
      },
    };
  }

  async updateActivity(refreshToken: string): Promise<void> {
    try {
      const tokenIdentifier = this.generateTokenIdentifier(refreshToken);
      logger.debug('Updating session activity', {
        tokenIdentifier: `${tokenIdentifier.substring(0, 8)}...`,
      });
      const result = await prisma.refreshToken.updateMany({
        where: {
          token: tokenIdentifier,
          revokedAt: null,
        },
        data: { lastActivityAt: new Date() },
      });

      if (result.count === 0) {
        logger.warn('Activity update found no matching active token', {
          tokenIdentifier: `${tokenIdentifier.substring(0, 8)}...`,
          possibleCauses: ['Token revoked', 'Token not found', 'Identifier mismatch'],
        });
      } else {
        logger.debug('Session activity updated successfully', {
          tokenIdentifier: `${tokenIdentifier.substring(0, 8)}...`,
          updatedCount: result.count,
        });
      }
    } catch (error) {
      // Token may not exist or be revoked - log but don't throw
      // This is a best-effort update to keep session alive
      logger.warn('Failed to update activity for token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCurrentUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        marketingOptIn: true,
        marketingOptInAt: true,
        termsAcceptedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return this.sanitizeUser(user as User);
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async getActiveSessions(userId: string): Promise<RefreshToken[]> {
    return await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async revokeSession(tokenId: string, userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { id: tokenId, userId },
      data: { revokedAt: new Date() },
    });
  }

  async checkDeletionEligibility(userId: string): Promise<DeletionEligibilityResult> {
    // Get all team memberships for the user with team details
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const teams: DeletionEligibilityResult['teams'] = [];
    const blockedTeams: Array<{ id: string; name: string }> = [];

    // Check each team membership
    for (const membership of teamMemberships) {
      const isProductOwner = membership.role === 'PRODUCT_OWNER';
      let isLastPO = false;

      if (isProductOwner) {
        // Count how many Product Owners are in this team
        const poCount = await prisma.teamMember.count({
          where: {
            teamId: membership.teamId,
            role: 'PRODUCT_OWNER',
          },
        });

        isLastPO = poCount === 1;

        if (isLastPO) {
          blockedTeams.push({
            id: membership.team.id,
            name: membership.team.name,
          });
        }
      }

      teams.push({
        id: membership.team.id,
        name: membership.team.name,
        role: membership.role,
        isLastPO,
      });
    }

    const canDelete = blockedTeams.length === 0;
    const blockedReason = canDelete
      ? null
      : `You are the only Product Owner for ${blockedTeams.length} team(s): ${blockedTeams.map((t) => t.name).join(', ')}. You can schedule deletion with a 14-day grace period, or force-delete after the grace period.`;

    const scheduledDeletion = await prisma.scheduledDeletion.findFirst({
      where: { userId, status: 'PENDING' },
    });

    const pendingDeletion = scheduledDeletion
      ? {
          requestedAt: scheduledDeletion.requestedAt.toISOString(),
          scheduledDeletionAt: scheduledDeletion.scheduledDeletionAt.toISOString(),
          gracePeriodDays: scheduledDeletion.gracePeriodDays,
        }
      : null;

    return {
      canDelete,
      teams,
      blockedTeams,
      blockedReason,
      pendingDeletion,
    };
  }

  async deleteAccount(userId: string, confirmation: string): Promise<void> {
    if (confirmation !== 'DELETE MY ACCOUNT') {
      throw new InvalidConfirmationError();
    }

    const eligibility = await this.checkDeletionEligibility(userId);

    if (!eligibility.canDelete) {
      throw new AccountDeletionBlockedError(
        eligibility.blockedTeams,
        'Please schedule deletion with a grace period, or use force-delete after the grace period.'
      );
    }

    await this.executeDeletionTransaction(userId);

    logger.info('User account deleted successfully', { userId });
  }

  private async executeDeletionTransaction(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      await tx.notification.deleteMany({
        where: { userId },
      });

      await tx.teamMember.deleteMany({
        where: { userId },
      });

      await tx.dailyUpdate.deleteMany({
        where: { userId },
      });

      await tx.task.updateMany({
        where: { assigneeId: userId },
        data: { assigneeId: null },
      });

      await tx.impediment.deleteMany({
        where: { reportedById: userId },
      });

      await tx.impediment.updateMany({
        where: { ownerId: userId },
        data: { ownerId: null },
      });

      await tx.retrospectiveItem.updateMany({
        where: { authorId: userId },
        data: { authorId: null },
      });

      await tx.retroActionItem.deleteMany({
        where: { ownerId: userId },
      });

      await tx.sprintBacklogChange.updateMany({
        where: { createdBy: userId },
        data: { createdBy: null },
      });

      await tx.doDChecklistVerification.deleteMany({
        where: { verifiedBy: userId },
      });

      await tx.doRChecklistVerification.deleteMany({
        where: { verifiedBy: userId },
      });

      await tx.retroItemVote.deleteMany({
        where: { userId },
      });

      await tx.scheduledDeletion.deleteMany({ where: { userId } });

      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  async scheduleDeletion(userId: string, confirmation: string): Promise<ScheduledDeletion> {
    if (confirmation !== config.deletion.scheduleConfirmationPhrase) {
      throw new BadRequestError(
        `Confirmation must be exactly "${config.deletion.scheduleConfirmationPhrase}"`
      );
    }

    const existing = await prisma.scheduledDeletion.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existing) {
      throw new ConflictError('A deletion request is already pending for this account');
    }

    const eligibility = await this.checkDeletionEligibility(userId);
    const blockedTeamIds = eligibility.teams.filter((t) => t.isLastPO).map((t) => t.id);

    const gracePeriodDays = config.deletion.gracePeriodDays;
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + gracePeriodDays);

    const deletion = await prisma.scheduledDeletion.create({
      data: {
        userId,
        requestedAt: new Date(),
        scheduledDeletionAt,
        gracePeriodDays,
        status: 'PENDING',
        blockedTeamIds,
        confirmationPhrase: config.deletion.scheduleConfirmationPhrase,
        forceConfirmed: false,
      },
    });

    await this.notifyTeamMembersOfDeletion(userId, blockedTeamIds, scheduledDeletionAt);

    logger.info('Account deletion scheduled', { userId, scheduledDeletionAt });

    return deletion;
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    const scheduled = await prisma.scheduledDeletion.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (!scheduled) {
      throw new NotFoundError('No pending deletion request found');
    }

    await prisma.scheduledDeletion.update({
      where: { id: scheduled.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await this.notifyTeamMembersOfCancellation(userId, scheduled.blockedTeamIds);

    logger.info('Scheduled deletion cancelled', { userId });
  }

  async forceDeleteAccount(userId: string, confirmation: string): Promise<void> {
    if (confirmation !== 'DELETE MY ACCOUNT') {
      throw new InvalidConfirmationError();
    }

    const scheduled = await prisma.scheduledDeletion.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (!scheduled) {
      const eligibility = await this.checkDeletionEligibility(userId);
      if (eligibility.canDelete) {
        return this.deleteAccount(userId, confirmation);
      }
      throw new BadRequestError(
        'You must first schedule deletion and wait for the grace period to expire'
      );
    }

    if (new Date() < scheduled.scheduledDeletionAt) {
      const daysRemaining = Math.ceil(
        (scheduled.scheduledDeletionAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      throw new BadRequestError(`Grace period has not elapsed. ${daysRemaining} day(s) remaining.`);
    }

    await prisma.scheduledDeletion.update({
      where: { id: scheduled.id },
      data: { forceConfirmed: true },
    });

    await this.executeDeletionTransaction(userId);

    logger.info('Account force-deleted after grace period', { userId });
  }

  private async notifyTeamMembersOfDeletion(
    userId: string,
    blockedTeamIds: string[],
    scheduledDeletionAt: Date
  ): Promise<void> {
    for (const teamId of blockedTeamIds) {
      const members = await prisma.teamMember.findMany({
        where: { teamId, userId: { not: userId } },
        select: { userId: true },
      });

      for (const member of members) {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: member.userId,
            type: 'ACCOUNT_DELETION_SCHEDULED',
            title: 'Team member scheduled account deletion',
            message: `A Product Owner in your team has scheduled their account deletion. The account will be permanently deleted on ${scheduledDeletionAt.toLocaleDateString()}. Please assign a new Product Owner before then.`,
          },
        });
      }
    }
  }

  private async notifyTeamMembersOfCancellation(
    userId: string,
    blockedTeamIds: string[]
  ): Promise<void> {
    for (const teamId of blockedTeamIds) {
      const members = await prisma.teamMember.findMany({
        where: { teamId, userId: { not: userId } },
        select: { userId: true },
      });

      for (const member of members) {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: member.userId,
            type: 'ACCOUNT_DELETION_CANCELLED',
            title: 'Account deletion cancelled',
            message: 'A team member has cancelled their scheduled account deletion.',
          },
        });
      }
    }
  }

  async getDeletionStatus(userId: string): Promise<{
    id: string;
    requestedAt: Date;
    scheduledDeletionAt: Date;
    gracePeriodDays: number;
    status: string;
    blockedTeamIds: string[];
    canForceDelete: boolean;
    daysRemaining: number;
  } | null> {
    const scheduled = await prisma.scheduledDeletion.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (!scheduled) {
      return null;
    }

    const now = new Date();
    const canForceDelete = now >= scheduled.scheduledDeletionAt;
    const daysRemaining = Math.max(
      0,
      Math.ceil((scheduled.scheduledDeletionAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      id: scheduled.id,
      requestedAt: scheduled.requestedAt,
      scheduledDeletionAt: scheduled.scheduledDeletionAt,
      gracePeriodDays: scheduled.gracePeriodDays,
      status: scheduled.status,
      blockedTeamIds: scheduled.blockedTeamIds,
      canForceDelete,
      daysRemaining,
    };
  }

  async updateProfile(
    userId: string,
    data: { firstName: string; lastName: string }
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        updatedBy: userId,
      },
    });

    logger.info('User profile updated', { userId });

    return this.sanitizeUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    sessionInfo?: SessionInfo
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, firstName: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new UnauthorizedError('New password must be different from current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedBy: userId,
      },
    });

    logger.info('User password changed', {
      userId,
      timestamp: new Date().toISOString(),
    });

    // Send password change confirmation email
    try {
      const template = new PasswordChangeTemplate();
      const rendered = template.render({
        firstName: user.firstName,
        email: user.email,
        changedAt: new Date().toLocaleString(),
        ipAddress: sessionInfo?.ipAddress,
        userAgent: sessionInfo?.userAgent,
        subject: 'Your Password Has Been Changed',
        appName: 'Scrsphere',
        appUrl: config.email.frontendUrl,
        supportEmail: config.email.defaults.replyTo || config.email.defaults.fromAddress,
        currentYear: new Date().getFullYear(),
      });

      await emailService.send({
        to: [{ address: user.email, name: user.firstName }],
        subject: 'Your Password Has Been Changed',
        html: rendered.html,
        text: rendered.text,
        metadata: {
          type: 'PASSWORD_CHANGE',
          userId: user.id,
        },
      });

      logger.info('Password change confirmation email sent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      // Log the error but don't throw - password change was successful
      logger.error('Failed to send password change confirmation email', {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Request a password reset for a user
   * Generates a reset token and sends a password reset email
   * @param email - The user's email address
   * @param sessionInfo - Optional session information for audit logging
   * @returns Promise resolving to a success message
   */
  async requestPasswordReset(
    email: string,
    sessionInfo?: SessionInfo
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    // Log the password reset request for audit purposes
    logger.info('Password reset requested', {
      email: normalizedEmail,
      ipAddress: sessionInfo?.ipAddress,
      userAgent: sessionInfo?.userAgent,
    });

    // Find user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    // Always return the same message to prevent email enumeration
    const successMessage =
      'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      // User not found, but return success message to prevent enumeration
      return { message: successMessage };
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token using SHA256 (similar to existing token hashing)
    const tokenHash = this.hashToken(resetToken);

    // Calculate expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store in PasswordResetToken table
    await prisma.passwordResetToken.create({
      data: {
        id: generateUUIDv7(),
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Build reset URL using config.email.frontendUrl + /reset-password/:token
    const resetUrl = `${config.email.frontendUrl}/reset-password/${resetToken}`;

    // Send password reset email using EmailService
    try {
      const template = new PasswordResetTemplate();
      const rendered = template.render({
        firstName: user.firstName,
        email: user.email,
        resetUrl,
        expiresIn: '1 hour',
        subject: 'Reset Your Password',
        appName: 'Scrsphere',
        appUrl: config.email.frontendUrl,
        supportEmail: config.email.defaults.replyTo || config.email.defaults.fromAddress,
        currentYear: new Date().getFullYear(),
      });

      await emailService.send({
        to: [{ address: user.email, name: user.firstName }],
        subject: 'Reset Your Password',
        html: rendered.html,
        text: rendered.text,
        metadata: {
          type: 'PASSWORD_RESET',
          userId: user.id,
        },
      });

      logger.info('Password reset email sent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      // Log the error but don't throw - we don't want to reveal if email sending failed
      logger.error('Failed to send password reset email', {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return { message: successMessage };
  }

  /**
   * Validate a password reset token
   * @param token - The reset token to validate
   * @returns Promise resolving to validation result with user email if valid
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    // Hash the provided token
    const tokenHash = this.hashToken(token);

    // Find the token in PasswordResetToken table
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Check if token exists, not expired, not used
    if (!resetToken) {
      return { valid: false };
    }

    if (resetToken.usedAt) {
      return { valid: false };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    // Return { valid: true, email: user.email } if valid
    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  /**
   * Reset a user's password using a valid reset token
   * @param token - The reset token
   * @param newPassword - The new password
   * @param sessionInfo - Optional session information for audit logging
   * @returns Promise resolving to a success message
   */
  async resetPassword(
    token: string,
    newPassword: string,
    sessionInfo?: SessionInfo
  ): Promise<{ message: string }> {
    // Validate the token
    const validation = await this.validateResetToken(token);

    if (!validation.valid) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Hash the provided token to find the record
    const tokenHash = this.hashToken(token);

    // Get the reset token record with user info
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!resetToken) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const user = resetToken.user;

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Use transaction to update password, mark token as used, and revoke refresh tokens
    await prisma.$transaction(async (tx) => {
      // Update user's password
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedBy: user.id,
        },
      });

      // Mark token as used (set usedAt)
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Revoke all refresh tokens for the user (security measure)
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    // Log the action
    logger.info('Password reset completed', {
      userId: user.id,
      email: user.email,
      ipAddress: sessionInfo?.ipAddress,
      userAgent: sessionInfo?.userAgent,
    });

    // Send password change confirmation email
    try {
      const template = new PasswordChangeTemplate();
      const rendered = template.render({
        firstName: user.firstName,
        email: user.email,
        changedAt: new Date().toLocaleString(),
        ipAddress: sessionInfo?.ipAddress,
        userAgent: sessionInfo?.userAgent,
        subject: 'Your Password Has Been Changed',
        appName: 'Scrsphere',
        appUrl: config.email.frontendUrl,
        supportEmail: config.email.defaults.replyTo || config.email.defaults.fromAddress,
        currentYear: new Date().getFullYear(),
      });

      await emailService.send({
        to: [{ address: user.email, name: user.firstName }],
        subject: 'Your Password Has Been Changed',
        html: rendered.html,
        text: rendered.text,
        metadata: {
          type: 'PASSWORD_CHANGE',
          userId: user.id,
        },
      });

      logger.info('Password change confirmation email sent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      // Log the error but don't throw - password reset was successful
      logger.error('Failed to send password change confirmation email', {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Cleanup expired password reset tokens
   * @returns Promise resolving to count of deleted tokens
   */
  async cleanupExpiredTokens(): Promise<{ deleted: number }> {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    logger.info('Expired password reset tokens cleaned up', {
      deletedCount: result.count,
    });

    return { deleted: result.count };
  }

  private async validateSession(token: RefreshToken | null): Promise<SessionValidationResult> {
    if (!token) {
      return { isValid: false, reason: 'expired' };
    }

    if (token.revokedAt) {
      return { isValid: false, reason: 'revoked' };
    }

    if (token.expiresAt < new Date()) {
      return { isValid: false, reason: 'expired' };
    }

    const idleTimeoutMs = config.session.idleTimeoutMs;
    const lastActivity = new Date(token.lastActivityAt).getTime();
    const now = Date.now();

    if (now - lastActivity > idleTimeoutMs) {
      const result = await prisma.refreshToken.updateMany({
        where: {
          id: token.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      if (result.count > 0) {
        logger.warn('Session revoked due to idle timeout', {
          tokenId: token.id,
          userId: token.userId,
          idleTime: now - lastActivity,
          idleTimeoutMs,
          lastActivityAt: token.lastActivityAt,
        });
      }
      return { isValid: false, reason: 'idle_timeout' };
    }

    const absoluteTimeoutMs = config.session.absoluteTimeoutMs;
    const sessionAge = now - new Date(token.createdAt).getTime();

    if (sessionAge > absoluteTimeoutMs) {
      const result = await prisma.refreshToken.updateMany({
        where: {
          id: token.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      if (result.count > 0) {
        logger.info('Session revoked due to absolute timeout', {
          tokenId: token.id,
          userId: token.userId,
          sessionAge,
        });
      }
      return { isValid: false, reason: 'absolute_timeout' };
    }

    return { isValid: true, token };
  }

  private async enforceMaxConcurrentSessions(userId: string): Promise<void> {
    const maxSessions = config.session.maxConcurrentSessions;

    const activeSessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'asc' },
    });

    if (activeSessions.length >= maxSessions) {
      const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
      await prisma.refreshToken.updateMany({
        where: {
          id: { in: sessionsToRevoke.map((s) => s.id) },
        },
        data: { revokedAt: new Date() },
      });
      logger.info('Revoked oldest sessions to enforce max concurrent limit', {
        userId,
        revokedCount: sessionsToRevoke.length,
        maxSessions,
      });
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    sessionInfo?: SessionInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign({ sub: userId, email }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshTokenId = generateUUIDv7();
    const refreshToken = generateUUIDv7();
    const tokenIdentifier = this.generateTokenIdentifier(refreshToken);
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseDuration(config.jwt.refreshExpiresIn));

    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: tokenIdentifier,
        tokenHash,
        userId,
        expiresAt,
        createdBy: userId,
        lastActivityAt: new Date(),
        userAgent: sessionInfo?.userAgent,
        ipAddress: sessionInfo?.ipAddress,
      },
    });

    return { accessToken, refreshToken };
  }

  private parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }

  private getSessionInfo(): LoginResponse['sessionInfo'] {
    return {
      expiresAt: new Date(Date.now() + this.parseDuration(config.jwt.refreshExpiresIn)),
      idleTimeoutMs: config.session.idleTimeoutMs,
      absoluteTimeoutMs: config.session.absoluteTimeoutMs,
      warningThresholdMs: config.session.warningThresholdMs,
    };
  }

  private startCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const intervalMs = config.session.cleanupIntervalMs;

    this.cleanupInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        logger.error('Session cleanup job failed', { error });
      }
    }, intervalMs);

    this.cleanupInterval.unref();

    logger.info('Session cleanup job started', { intervalMs });
  }

  private setupGracefulShutdown(): void {
    const shutdown = () => {
      this.isShuttingDown = true;
      this.stopCleanupJob();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  async cleanupExpiredSessions(): Promise<{ deleted: number }> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: cutoffDate } }],
      },
    });

    logger.info('Session cleanup completed', { deletedCount: result.count });
    return { deleted: result.count };
  }

  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Session cleanup job stopped');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, config.bcrypt.saltRounds);
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private compareToken(token: string, hashedToken: string): boolean {
    const computedHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(hashedToken, 'hex')
      );
    } catch {
      return false;
    }
  }

  private generateTokenIdentifier(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
  }

  private sanitizeUser<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<T, 'password'>;
  }

  private async sendWelcomeEmail(
    user: { id: string; email: string; firstName: string },
    _sessionInfo?: SessionInfo
  ): Promise<void> {
    try {
      const template = new WelcomeEmailTemplate();
      const rendered = template.render({
        firstName: user.firstName,
        email: user.email,
        subject: `Welcome to ${config.email.defaults.fromName || 'Scrsphere'}`,
        appName: config.email.defaults.fromName || 'Scrsphere',
        appUrl: config.email.frontendUrl,
        supportEmail: config.email.defaults.replyTo || config.email.defaults.fromAddress,
        currentYear: new Date().getFullYear(),
      });

      await emailService.send({
        to: [{ address: user.email, name: user.firstName }],
        subject: `Welcome to ${config.email.defaults.fromName || 'Scrsphere'}`,
        html: rendered.html,
        text: rendered.text,
        metadata: {
          type: 'WELCOME',
          userId: user.id,
        },
      });

      logger.info('Welcome email sent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      logger.error('Failed to send welcome email', {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
