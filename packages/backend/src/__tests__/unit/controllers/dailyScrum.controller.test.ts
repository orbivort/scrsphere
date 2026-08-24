import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDailyScrum,
  getDailyScrums,
  getDailyScrumById,
  createDailyScrum,
  updateDailyScrum,
  recordParticipation,
  getParticipation,
  promoteToImpediment,
  sendTeamSignal,
} from '../../../controllers/dailyScrum.controller';
import { dailyScrumService } from '../../../services/dailyScrum.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/dailyScrum.service', () => ({
  dailyScrumService: {
    getDailyScrum: vi.fn(),
    getDailyScrums: vi.fn(),
    getDailyScrumById: vi.fn(),
    createDailyScrum: vi.fn(),
    updateDailyScrum: vi.fn(),
    recordParticipation: vi.fn(),
    getParticipation: vi.fn(),
    promoteToImpediment: vi.fn(),
    sendTeamSignal: vi.fn(),
  },
}));

describe('DailyScrum Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('getDailyScrum', () => {
    it('returns the team-level Daily Scrum for a sprint', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = { date: '2026-08-23' };
      const mockScrum = { id: 'scrum-1', sprintId: 'sprint-123' };

      (dailyScrumService.getDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      getDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.getDailyScrum).toHaveBeenCalledWith('sprint-123', '2026-08-23');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockScrum }));
    });

    it('forwards an undefined date when the query param is absent', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = {};
      const mockScrum = { id: 'scrum-1', sprintId: 'sprint-123' };

      (dailyScrumService.getDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      getDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.getDailyScrum).toHaveBeenCalledWith('sprint-123', undefined);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockScrum }));
    });

    it('throws BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};

      getDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.getDailyScrum).not.toHaveBeenCalled();
    });
  });

  describe('getDailyScrums', () => {
    it('returns all Daily Scrums for a sprint', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      const mockScrums = [{ id: 'scrum-1' }, { id: 'scrum-2' }];

      (dailyScrumService.getDailyScrums as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrums
      );

      getDailyScrums(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockScrums }));
    });

    it('forwards an undefined date when the query param is absent', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = {};
      const mockScrums = [{ id: 'scrum-1' }];

      (dailyScrumService.getDailyScrums as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrums
      );

      getDailyScrums(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.getDailyScrums).toHaveBeenCalledWith('sprint-123', undefined);
    });

    it('throws BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};

      getDailyScrums(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.getDailyScrums).not.toHaveBeenCalled();
    });
  });

  describe('getDailyScrumById', () => {
    it('returns the Daily Scrum when it exists', async () => {
      mockReq.params = { id: 'scrum-1' };
      const mockScrum = { id: 'scrum-1' };

      (
        dailyScrumService.getDailyScrumById as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockScrum);

      getDailyScrumById(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.getDailyScrumById).toHaveBeenCalledWith('scrum-1');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockScrum }));
    });

    it('returns a null data response when no Daily Scrum is found', async () => {
      mockReq.params = { id: 'scrum-missing' };

      (
        dailyScrumService.getDailyScrumById as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      getDailyScrumById(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.getDailyScrumById).toHaveBeenCalledWith('scrum-missing');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: null }));
    });

    it('throws BadRequestError when id is missing', async () => {
      mockReq.params = {};

      getDailyScrumById(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.getDailyScrumById).not.toHaveBeenCalled();
    });
  });

  describe('createDailyScrum', () => {
    it('creates a team-level Daily Scrum with goal-focused fields', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        progressNotes: 'On track',
        planForNextDay: 'Pair on X',
      };
      const mockScrum = { id: 'scrum-1' };

      (dailyScrumService.createDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      createDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.createDailyScrum).toHaveBeenCalledWith('user-1', {
        sprintId: 'sprint-123',
        scrumDate: undefined,
        progressNotes: 'On track',
        adaptationsNotes: undefined,
        planForNextDay: 'Pair on X',
        backlogAdjustments: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('forwards a client-supplied scrumDate to the service', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        scrumDate: '2026-08-20',
        planForNextDay: 'Pair on Y',
      };
      const mockScrum = { id: 'scrum-1' };

      (dailyScrumService.createDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      createDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.createDailyScrum).toHaveBeenCalledWith('user-1', {
        sprintId: 'sprint-123',
        scrumDate: '2026-08-20',
        progressNotes: undefined,
        adaptationsNotes: undefined,
        planForNextDay: 'Pair on Y',
        backlogAdjustments: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('forwards all goal-focused body fields including focusMode and backlogAdjustments', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        scrumDate: '2026-08-20',
        progressNotes: 'On track',
        adaptationsNotes: 'Adjusted scope',
        planForNextDay: 'Pair on Z',
        focusMode: 'BLOCKERS',
        backlogAdjustments: 'Moved PBI-5',
      };
      const mockScrum = { id: 'scrum-1' };

      (dailyScrumService.createDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      createDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.createDailyScrum).toHaveBeenCalledWith('user-1', {
        sprintId: 'sprint-123',
        scrumDate: '2026-08-20',
        progressNotes: 'On track',
        adaptationsNotes: 'Adjusted scope',
        planForNextDay: 'Pair on Z',
        focusMode: 'BLOCKERS',
        backlogAdjustments: 'Moved PBI-5',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('throws BadRequestError when the user is not authenticated', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = undefined;

      createDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.createDailyScrum).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-1' };

      createDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.createDailyScrum).not.toHaveBeenCalled();
    });
  });

  describe('updateDailyScrum', () => {
    it('updates the team-level Daily Scrum', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = { planForNextDay: 'Updated plan' };
      const mockScrum = { id: 'scrum-1' };

      (dailyScrumService.updateDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      updateDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockScrum }));
    });

    it('forwards all updatable goal-focused fields', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        progressNotes: 'Still on track',
        adaptationsNotes: 'Scope trimmed',
        planForNextDay: 'Pair on W',
        focusMode: 'GOALS',
        backlogAdjustments: 'Reordered PBI-2',
      };
      const mockScrum = { id: 'scrum-1' };

      (dailyScrumService.updateDailyScrum as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockScrum
      );

      updateDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.updateDailyScrum).toHaveBeenCalledWith('scrum-1', 'user-1', {
        progressNotes: 'Still on track',
        adaptationsNotes: 'Scope trimmed',
        planForNextDay: 'Pair on W',
        focusMode: 'GOALS',
        backlogAdjustments: 'Reordered PBI-2',
      });
    });

    it('throws BadRequestError when the user is not authenticated', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = undefined;

      updateDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.updateDailyScrum).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when id is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-1' };

      updateDailyScrum(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.updateDailyScrum).not.toHaveBeenCalled();
    });
  });

  describe('recordParticipation', () => {
    it('records the current user as a participant', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = { id: 'user-1' };
      const mockScrum = { id: 'scrum-1' };

      (
        dailyScrumService.recordParticipation as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockScrum);

      recordParticipation(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.recordParticipation).toHaveBeenCalledWith('scrum-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockScrum }));
    });

    it('throws BadRequestError when the user is not authenticated', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = undefined;

      recordParticipation(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.recordParticipation).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when id is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-1' };

      recordParticipation(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.recordParticipation).not.toHaveBeenCalled();
    });
  });

  describe('getParticipation', () => {
    it('returns participation without status-report framing', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = { date: '2026-08-23' };
      const result = {
        dailyScrum: { id: 'scrum-1' },
        participants: [],
        nonParticipants: [{ userId: 'user-2', userName: 'Jane' }],
      };

      (dailyScrumService.getParticipation as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        result
      );

      getParticipation(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: result }));
    });

    it('returns an empty default participation object when date is missing', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = {};

      getParticipation(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.getParticipation).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { dailyScrum: null, participants: [], nonParticipants: [] },
        })
      );
    });

    it('throws BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};
      mockReq.query = { date: '2026-08-23' };

      getParticipation(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.getParticipation).not.toHaveBeenCalled();
    });
  });

  describe('promoteToImpediment', () => {
    it('promotes a Daily Scrum impediment', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        title: 'Blocked',
        description: 'Need API access',
      };
      const result = { dailyScrum: { id: 'scrum-1' }, impediment: { id: 'imp-1' } };

      (
        dailyScrumService.promoteToImpediment as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue(result);

      promoteToImpediment(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.promoteToImpediment).toHaveBeenCalledWith('scrum-1', 'user-1', {
        title: 'Blocked',
        description: 'Need API access',
        ownerId: undefined,
        sprintId: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('forwards optional ownerId and sprintId when supplied', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        title: 'Blocked',
        description: 'Need API access',
        ownerId: 'user-2',
        sprintId: 'sprint-456',
      };
      const result = { dailyScrum: { id: 'scrum-1' }, impediment: { id: 'imp-2' } };

      (
        dailyScrumService.promoteToImpediment as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue(result);

      promoteToImpediment(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.promoteToImpediment).toHaveBeenCalledWith('scrum-1', 'user-1', {
        title: 'Blocked',
        description: 'Need API access',
        ownerId: 'user-2',
        sprintId: 'sprint-456',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('throws BadRequestError when the user is not authenticated', async () => {
      mockReq.params = { id: 'scrum-1' };
      mockReq.user = undefined;

      promoteToImpediment(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.promoteToImpediment).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when id is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-1' };

      promoteToImpediment(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.promoteToImpediment).not.toHaveBeenCalled();
    });
  });

  describe('sendTeamSignal', () => {
    it('sends a neutral team-wide Daily Scrum signal', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = { id: 'user-1' };
      const result = { sentCount: 3, message: 'Signal sent' };

      (dailyScrumService.sendTeamSignal as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        result
      );

      sendTeamSignal(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyScrumService.sendTeamSignal).toHaveBeenCalledWith('sprint-123', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: result }));
    });

    it('throws BadRequestError when the user is not authenticated', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = undefined;

      sendTeamSignal(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.sendTeamSignal).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-1' };

      sendTeamSignal(mockReq as never, mockRes as never, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(dailyScrumService.sendTeamSignal).not.toHaveBeenCalled();
    });
  });
});
