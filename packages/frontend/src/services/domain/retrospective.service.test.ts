import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retrospectiveService } from './retrospective.service';
import { coreApiService } from '../core/api.core';

vi.mock('../core/api.core', () => ({
  coreApiService: {
    axiosInstance: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('RetrospectiveService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRetrospectives', () => {
    it('should get retrospectives for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'retro-1',
              sprintId: 'sprint-1',
              teamId: 'team-1',
              retroDate: '2024-01-15T00:00:00Z',
              facilitatorId: 'user-1',
              status: 'COMPLETED',
              participants: [],
              attendees: [],
              items: [],
              actionItems: [],
              isAnonymous: false,
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.getRetrospectives('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/retrospectives/team/team-1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getPendingRetroActionItems', () => {
    it('should get pending action items for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'action-1',
              retrospectiveId: 'retro-1',
              title: 'Improve communication',
              ownerId: 'user-1',
              status: 'PENDING',
              addedToSprintBacklog: false,
              createdAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.getPendingRetroActionItems('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/retrospectives/team/team-1/pending-action-items');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getRetrospective', () => {
    it('should get a single retrospective by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'retro-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            retroDate: '2024-01-15T00:00:00Z',
            facilitatorId: 'user-1',
            status: 'COMPLETED',
            participants: [],
            attendees: [],
            items: [],
            actionItems: [],
            isAnonymous: false,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.getRetrospective('retro-1');

      expect(mockApi.get).toHaveBeenCalledWith('/retrospectives/retro-1');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('retro-1');
    });
  });

  describe('getRetrospectiveBySprintId', () => {
    it('should get retrospective by sprint id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'retro-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            retroDate: '2024-01-15T00:00:00Z',
            facilitatorId: 'user-1',
            status: 'COMPLETED',
            participants: [],
            attendees: [],
            items: [],
            actionItems: [],
            isAnonymous: false,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.getRetrospectiveBySprintId('sprint-1');

      expect(mockApi.get).toHaveBeenCalledWith('/retrospectives/sprint/sprint-1');
      expect(result.success).toBe(true);
      expect(result.data?.sprintId).toBe('sprint-1');
    });
  });

  describe('createRetrospective', () => {
    it('should create a new retrospective', async () => {
      const retroData = {
        sprintId: 'sprint-1',
        teamId: 'team-1',
        retroDate: '2024-01-15T00:00:00Z',
        facilitatorId: 'user-1',
        isAnonymous: false,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'retro-1',
            ...retroData,
            status: 'DRAFT',
            participants: [],
            attendees: [],
            items: [],
            actionItems: [],
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.createRetrospective(retroData);

      expect(mockApi.post).toHaveBeenCalledWith('/retrospectives', retroData);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('retro-1');
    });
  });

  describe('updateRetrospective', () => {
    it('should update a retrospective', async () => {
      const updates = { summary: 'Good retrospective' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'retro-1',
            summary: 'Good retrospective',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.updateRetrospective('retro-1', updates);

      expect(mockApi.put).toHaveBeenCalledWith('/retrospectives/retro-1', updates);
      expect(result.success).toBe(true);
      expect(result.data?.summary).toBe('Good retrospective');
    });
  });

  describe('addRetrospectiveItem', () => {
    it('should add an item to a retrospective', async () => {
      const item = {
        category: 'WENT_WELL' as const,
        content: 'Great teamwork',
        votes: 0,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'item-1',
            retrospectiveId: 'retro-1',
            ...item,
            votedBy: [],
            order: 0,
            createdAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.addRetrospectiveItem('retro-1', item);

      expect(mockApi.post).toHaveBeenCalledWith('/retrospectives/retro-1/items', item);
      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Great teamwork');
    });
  });

  describe('voteRetrospectiveItem', () => {
    it('should vote for an item', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'item-1',
            votes: 1,
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.voteRetrospectiveItem('retro-1', 'item-1');

      expect(mockApi.post).toHaveBeenCalledWith('/retrospectives/retro-1/items/item-1/vote');
      expect(result.success).toBe(true);
      expect(result.data?.votes).toBe(1);
    });
  });

  describe('unvoteRetrospectiveItem', () => {
    it('should remove vote from an item', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'item-1',
            votes: 0,
          },
        },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.unvoteRetrospectiveItem('retro-1', 'item-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/retrospectives/retro-1/items/item-1/vote');
      expect(result.success).toBe(true);
      expect(result.data?.votes).toBe(0);
    });
  });

  describe('updateRetrospectiveItem', () => {
    it('should update an item', async () => {
      const updates = { content: 'Updated content' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'item-1',
            content: 'Updated content',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.updateRetrospectiveItem(
        'retro-1',
        'item-1',
        updates
      );

      expect(mockApi.put).toHaveBeenCalledWith('/retrospectives/retro-1/items/item-1', updates);
      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Updated content');
    });
  });

  describe('deleteRetrospectiveItem', () => {
    it('should delete an item', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: undefined,
        },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.deleteRetrospectiveItem('retro-1', 'item-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/retrospectives/retro-1/items/item-1');
      expect(result.success).toBe(true);
    });
  });

  describe('addActionItem', () => {
    it('should add an action item to a retrospective', async () => {
      const actionItem = {
        title: 'Improve code review',
        ownerId: 'user-1',
        status: 'PENDING' as const,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'action-1',
            retrospectiveId: 'retro-1',
            ...actionItem,
            addedToSprintBacklog: false,
            createdAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.addActionItem('retro-1', actionItem);

      expect(mockApi.post).toHaveBeenCalledWith('/retrospectives/retro-1/action-items', actionItem);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Improve code review');
    });
  });

  describe('updateActionItem', () => {
    it('should update an action item', async () => {
      const updates = { status: 'IN_PROGRESS' as const };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'action-1',
            status: 'IN_PROGRESS',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.updateActionItem('retro-1', 'action-1', updates);

      expect(mockApi.put).toHaveBeenCalledWith(
        '/retrospectives/retro-1/action-items/action-1',
        updates
      );
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('IN_PROGRESS');
    });
  });

  describe('deleteActionItem', () => {
    it('should delete an action item', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: undefined,
        },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.deleteActionItem('retro-1', 'action-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/retrospectives/retro-1/action-items/action-1');
      expect(result.success).toBe(true);
    });
  });

  describe('addRetroAttendee', () => {
    it('should add an attendee to a retrospective', async () => {
      const attendeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'developer',
        attended: true,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'attendee-1',
            ...attendeeData,
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.addRetroAttendee('retro-1', attendeeData);

      expect(mockApi.post).toHaveBeenCalledWith('/retrospectives/retro-1/attendees', attendeeData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John Doe');
    });
  });

  describe('updateRetroAttendee', () => {
    it('should update an attendee', async () => {
      const attendeeData = { attended: false };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'attendee-1',
            name: 'John Doe',
            attended: false,
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.updateRetroAttendee('attendee-1', attendeeData);

      expect(mockApi.put).toHaveBeenCalledWith(
        '/retrospectives/attendees/attendee-1',
        attendeeData
      );
      expect(result.success).toBe(true);
      expect(result.data?.attended).toBe(false);
    });
  });

  describe('deleteRetroAttendee', () => {
    it('should delete an attendee', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { message: 'Attendee deleted' },
        },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await retrospectiveService.deleteRetroAttendee('attendee-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/retrospectives/attendees/attendee-1');
      expect(result.success).toBe(true);
    });
  });
});
