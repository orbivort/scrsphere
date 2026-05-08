// Team Context Middleware
import { type Request, type Response, type NextFunction } from 'express';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { isValidUUID } from '../utils/validation';
import prisma from '../utils/prisma';
import { updateRequestContext } from '../utils/requestContext';

/**
 * Team Context Middleware
 * Validates that a team context is provided and user is a member
 */
export const requireTeamContext = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId =
      (req.headers['x-team-id'] as string | undefined) ?? req.body.teamId ?? req.params.teamId;

    if (!teamId) {
      throw new BadRequestError('Team context is required');
    }

    if (!isValidUUID(teamId)) {
      throw new BadRequestError('Invalid team ID format');
    }

    if (!req.userId) {
      throw new ForbiddenError('Authentication required');
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: req.userId,
        },
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    req.currentTeamId = teamId;
    req.userRoleInTeam = teamMember.role;

    // Update request context with teamId for logging
    updateRequestContext({ teamId });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional team context middleware
 * Attaches team context if provided, but doesn't require it
 */
export const optionalTeamContext = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId =
      (req.headers['x-team-id'] as string | undefined) ?? req.body.teamId ?? req.params.teamId;

    if (teamId && req.userId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: req.userId,
          },
        },
      });

      if (teamMember) {
        req.currentTeamId = teamId;
        req.userRoleInTeam = teamMember.role;
        // Update request context with teamId for logging
        updateRequestContext({ teamId });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization within team context
 */
export const requireTeamRoles = (...roles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.currentTeamId) {
        throw new BadRequestError('Team context is required');
      }

      if (!req.userRoleInTeam) {
        throw new ForbiddenError('User role in team not found');
      }

      if (!roles.includes(req.userRoleInTeam)) {
        throw new ForbiddenError(`Insufficient permissions. Required roles: ${roles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
