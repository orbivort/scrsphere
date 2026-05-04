import type { User, PrismaClient } from './generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: Omit<User, 'password'>;
      userId?: string;
      prisma?: PrismaClient;
      currentTeamId?: string;
      userRoleInTeam?: string;
      // Validated data from middleware (Express 5 compatibility)
      validatedBody?: unknown;
      validatedParams?: Record<string, string>;
      validatedQuery?: Record<string, string>;
      apiVersion?: number;
    }
  }
}

export {};
