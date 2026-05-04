import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  requireTeamContext,
  optionalTeamContext,
  requireTeamRoles,
} from '../../../middleware/teamContext.middleware';
import { BadRequestError, ForbiddenError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

const mockTeamMember = {
  teamId: 'team-123',
  userId: 'user-123',
  role: 'ADMIN',
  joinedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
};

vi.mock('../../../utils/prisma', () => ({
  default: {
    teamMember: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/validation', () => ({
  isValidUUID: vi.fn((uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }),
}));

import prisma from '../../../utils/prisma';
import { isValidUUID } from '../../../utils/validation';

describe('Team Context Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('requireTeamContext', () => {
    it('should accept teamId from x-team-id header', async () => {
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(true);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: {
          teamId_userId: {
            teamId: 'team-123',
            userId: 'user-123',
          },
        },
      });
      expect(mockReq.currentTeamId).toBe('team-123');
      expect(mockReq.userRoleInTeam).toBe('ADMIN');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept teamId from body', async () => {
      mockReq.body = { teamId: 'team-456' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(true);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBe('team-456');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept teamId from params', async () => {
      mockReq.params = { teamId: 'team-789' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(true);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBe('team-789');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize x-team-id header over body and params', async () => {
      mockReq.headers = { 'x-team-id': 'header-team' };
      mockReq.body = { teamId: 'body-team' };
      mockReq.params = { teamId: 'params-team' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(true);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBe('header-team');
    });

    it('should throw BadRequestError when teamId is missing', async () => {
      mockReq.headers = {};
      mockReq.body = {};
      mockReq.params = {};

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw BadRequestError for invalid UUID format', async () => {
      mockReq.headers = { 'x-team-id': 'invalid-uuid' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(false);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw ForbiddenError when user is not authenticated', async () => {
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = undefined;
      vi.mocked(isValidUUID).mockReturnValue(true);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should throw ForbiddenError when user is not a team member', async () => {
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(true);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should set user role from team membership', async () => {
      const teamMember = { ...mockTeamMember, role: 'MEMBER' };
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = 'user-123';
      vi.mocked(isValidUUID).mockReturnValue(true);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(teamMember as any);

      await requireTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.userRoleInTeam).toBe('MEMBER');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalTeamContext', () => {
    it('should attach team context when teamId and userId are provided', async () => {
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = 'user-123';
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await optionalTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBe('team-123');
      expect(mockReq.userRoleInTeam).toBe('ADMIN');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach team context when teamId is missing', async () => {
      mockReq.headers = {};
      mockReq.body = {};
      mockReq.params = {};
      mockReq.userId = 'user-123';

      await optionalTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBeUndefined();
      expect(mockReq.userRoleInTeam).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach team context when userId is missing', async () => {
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = undefined;

      await optionalTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBeUndefined();
      expect(mockReq.userRoleInTeam).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach team context when user is not a member', async () => {
      mockReq.headers = { 'x-team-id': 'team-123' };
      mockReq.userId = 'user-123';
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null);

      await optionalTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBeUndefined();
      expect(mockReq.userRoleInTeam).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept teamId from body', async () => {
      mockReq.body = { teamId: 'team-456' };
      mockReq.userId = 'user-123';
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await optionalTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBe('team-456');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept teamId from params', async () => {
      mockReq.params = { teamId: 'team-789' };
      mockReq.userId = 'user-123';
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockTeamMember as any);

      await optionalTeamContext(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.currentTeamId).toBe('team-789');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireTeamRoles', () => {
    it('should pass when user has required role', async () => {
      mockReq.currentTeamId = 'team-123';
      mockReq.userRoleInTeam = 'ADMIN';

      const middleware = requireTeamRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass when user has one of the required roles', async () => {
      mockReq.currentTeamId = 'team-123';
      mockReq.userRoleInTeam = 'MEMBER';

      const middleware = requireTeamRoles('ADMIN', 'MEMBER');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw BadRequestError when team context is missing', async () => {
      mockReq.currentTeamId = undefined;
      mockReq.userRoleInTeam = 'ADMIN';

      const middleware = requireTeamRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw ForbiddenError when user role is not found', async () => {
      mockReq.currentTeamId = 'team-123';
      mockReq.userRoleInTeam = undefined;

      const middleware = requireTeamRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should throw ForbiddenError when user has insufficient permissions', async () => {
      mockReq.currentTeamId = 'team-123';
      mockReq.userRoleInTeam = 'MEMBER';

      const middleware = requireTeamRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should include required roles in error message', async () => {
      mockReq.currentTeamId = 'team-123';
      mockReq.userRoleInTeam = 'MEMBER';

      const middleware = requireTeamRoles('ADMIN', 'OWNER');
      await middleware(mockReq as any, mockRes as any, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain('ADMIN, OWNER');
    });
  });
});
