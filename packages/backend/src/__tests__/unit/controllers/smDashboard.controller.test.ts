import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSmDashboard,
  getEventSchedule,
  updateSprintSmNotes,
  updateSprintReviewSmNotes,
  updateRetrospectiveSmNotes,
} from '../../../controllers/smDashboard.controller';
import { smDashboardService } from '../../../services/smDashboard.service';
import { smNotesService } from '../../../services/smNotes.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext, wait } from '../../setup/testSetup';

// Mock the module-level service singletons so the controller logic can be tested in isolation.
vi.mock('../../../services/smDashboard.service', () => ({
  smDashboardService: {
    getDashboard: vi.fn(),
    getEventSchedule: vi.fn(),
  },
}));

vi.mock('../../../services/smNotes.service', () => ({
  smNotesService: {
    updateSprintNotes: vi.fn(),
    updateSprintReviewNotes: vi.fn(),
    updateRetrospectiveNotes: vi.fn(),
  },
}));

describe('SM Dashboard Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  const TEAM_ID = 'team-123';
  const SPRINT_ID = 'sprint-123';

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSmDashboard', () => {
    it('should return the aggregated dashboard using default sprintCount of 5', async () => {
      const mockDashboard = {
        eventCompliance: [],
        impedimentMetrics: {},
        dodComplianceTrend: [],
        sprintGoalAchievement: {},
        actionItemCompletion: {},
        healthCheck: null,
      };
      (smDashboardService.getDashboard as any).mockResolvedValue(mockDashboard);

      mockReq.currentTeamId = TEAM_ID;
      mockReq.query = {};

      await getSmDashboard(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).not.toHaveBeenCalled();
      expect(smDashboardService.getDashboard).toHaveBeenCalledWith(TEAM_ID, 5);
      expect(mockRes._json).toEqual({ success: true, data: mockDashboard });
    });

    it('should parse sprintCount from query string', async () => {
      const mockDashboard = { eventCompliance: [] };
      (smDashboardService.getDashboard as any).mockResolvedValue(mockDashboard);

      mockReq.currentTeamId = TEAM_ID;
      mockReq.query = { sprintCount: '10' };

      await getSmDashboard(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(smDashboardService.getDashboard).toHaveBeenCalledWith(TEAM_ID, 10);
      expect(mockRes._json).toEqual({ success: true, data: mockDashboard });
    });

    it('should pass NaN when query value is a non-numeric truthy string', async () => {
      const mockDashboard = { eventCompliance: [] };
      (smDashboardService.getDashboard as any).mockResolvedValue(mockDashboard);

      mockReq.currentTeamId = TEAM_ID;
      // The controller uses `req.query.sprintCount ? parseInt(...) : 5`, so a
      // non-empty string keeps the NaN result of parseInt (it does not fall back to 5).
      mockReq.query = { sprintCount: 'abc' };

      await getSmDashboard(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(smDashboardService.getDashboard).toHaveBeenCalledWith(TEAM_ID, NaN);
      expect(mockRes._json).toEqual({ success: true, data: mockDashboard });
    });

    it('should use default sprintCount of 5 when query key is absent', async () => {
      const mockDashboard = { eventCompliance: [] };
      (smDashboardService.getDashboard as any).mockResolvedValue(mockDashboard);

      mockReq.currentTeamId = TEAM_ID;
      mockReq.query = {};

      await getSmDashboard(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(smDashboardService.getDashboard).toHaveBeenCalledWith(TEAM_ID, 5);
    });

    it('should propagate errors to next', async () => {
      const error = new Error('Database failure');
      (smDashboardService.getDashboard as any).mockRejectedValue(error);

      mockReq.currentTeamId = TEAM_ID;
      mockReq.query = {};

      await getSmDashboard(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes._json).toBeNull();
    });
  });

  describe('getEventSchedule', () => {
    it('should return the event schedule for the current team', async () => {
      const mockSchedule = {
        sprintName: 'Sprint 1',
        durationDays: 14,
        events: [],
      };
      (smDashboardService.getEventSchedule as any).mockResolvedValue(mockSchedule);

      mockReq.currentTeamId = TEAM_ID;

      await getEventSchedule(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).not.toHaveBeenCalled();
      expect(smDashboardService.getEventSchedule).toHaveBeenCalledWith(TEAM_ID);
      expect(mockRes._json).toEqual({ success: true, data: mockSchedule });
    });

    it('should propagate errors to next', async () => {
      const error = new Error('Schedule error');
      (smDashboardService.getEventSchedule as any).mockRejectedValue(error);

      mockReq.currentTeamId = TEAM_ID;

      await getEventSchedule(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSprintSmNotes', () => {
    it('should update sprint SM notes and return the result', async () => {
      const updated = { id: SPRINT_ID, smNotes: 'Facilitation notes' };
      (smNotesService.updateSprintNotes as any).mockResolvedValue(updated);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Facilitation notes' };
      mockReq.user = { id: 'user-1' };

      await updateSprintSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).not.toHaveBeenCalled();
      expect(smNotesService.updateSprintNotes).toHaveBeenCalledWith(
        SPRINT_ID,
        'Facilitation notes',
        'user-1'
      );
      expect(mockRes._json).toEqual({ success: true, data: updated });
    });

    it('should pass undefined userId when no user is present', async () => {
      const updated = { id: SPRINT_ID, smNotes: 'Notes' };
      (smNotesService.updateSprintNotes as any).mockResolvedValue(updated);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Notes' };
      mockReq.user = undefined;

      await updateSprintSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(smNotesService.updateSprintNotes).toHaveBeenCalledWith(SPRINT_ID, 'Notes', undefined);
      expect(mockRes._json).toEqual({ success: true, data: updated });
    });

    it('should throw BadRequestError when sprint id is missing', async () => {
      mockReq.params = { id: undefined };

      await updateSprintSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const err = (mockNext as any).mock.calls[0][0];
      expect(err.message).toBe('Sprint ID is required');
      expect(smNotesService.updateSprintNotes).not.toHaveBeenCalled();
    });

    it('should propagate service errors to next', async () => {
      const error = new Error('Update failed');
      (smNotesService.updateSprintNotes as any).mockRejectedValue(error);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Notes' };

      await updateSprintSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSprintReviewSmNotes', () => {
    it('should update sprint review SM notes and return the result', async () => {
      const updated = { id: SPRINT_ID, smNotes: 'Review notes' };
      (smNotesService.updateSprintReviewNotes as any).mockResolvedValue(updated);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Review notes' };
      mockReq.user = { id: 'user-2' };

      await updateSprintReviewSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).not.toHaveBeenCalled();
      expect(smNotesService.updateSprintReviewNotes).toHaveBeenCalledWith(
        SPRINT_ID,
        'Review notes',
        'user-2'
      );
      expect(mockRes._json).toEqual({ success: true, data: updated });
    });

    it('should throw BadRequestError when sprint review id is missing', async () => {
      mockReq.params = { id: '' };

      await updateSprintReviewSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const err = (mockNext as any).mock.calls[0][0];
      expect(err.message).toBe('Sprint ID is required');
      expect(smNotesService.updateSprintReviewNotes).not.toHaveBeenCalled();
    });

    it('should propagate service errors to next', async () => {
      const error = new Error('Review update failed');
      (smNotesService.updateSprintReviewNotes as any).mockRejectedValue(error);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Review notes' };

      await updateSprintReviewSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateRetrospectiveSmNotes', () => {
    it('should update retrospective SM notes and return the result', async () => {
      const updated = { id: SPRINT_ID, smNotes: 'Retro notes' };
      (smNotesService.updateRetrospectiveNotes as any).mockResolvedValue(updated);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Retro notes' };
      mockReq.user = { id: 'user-3' };

      await updateRetrospectiveSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).not.toHaveBeenCalled();
      expect(smNotesService.updateRetrospectiveNotes).toHaveBeenCalledWith(
        SPRINT_ID,
        'Retro notes',
        'user-3'
      );
      expect(mockRes._json).toEqual({ success: true, data: updated });
    });

    it('should throw BadRequestError when retrospective id is missing', async () => {
      mockReq.params = {};

      await updateRetrospectiveSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const err = (mockNext as any).mock.calls[0][0];
      expect(err.message).toBe('Sprint ID is required');
      expect(smNotesService.updateRetrospectiveNotes).not.toHaveBeenCalled();
    });

    it('should propagate service errors to next', async () => {
      const error = new Error('Retro update failed');
      (smNotesService.updateRetrospectiveNotes as any).mockRejectedValue(error);

      mockReq.params = { id: SPRINT_ID };
      mockReq.body = { smNotes: 'Retro notes' };

      await updateRetrospectiveSmNotes(mockReq as any, mockRes as any, mockNext);
      await wait(0);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
