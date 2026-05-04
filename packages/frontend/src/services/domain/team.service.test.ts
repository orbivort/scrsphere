import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamService } from './team.service';
import { coreApiService } from '../core/api.core';

// Mock the core API service
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

describe('TeamService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTeams', () => {
    it('should get teams with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            teams: [
              { id: '1', name: 'Team 1', description: 'Description 1' },
              { id: '2', name: 'Team 2', description: 'Description 2' },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
            },
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await teamService.getTeams({ page: 1, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith('/teams', { params: { page: 1, limit: 10 } });
      expect(result.success).toBe(true);
      expect(result.data?.teams).toHaveLength(2);
    });

    it('should get teams with search', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            teams: [{ id: '1', name: 'Search Result', description: 'Found team' }],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await teamService.getTeams({
        search: 'search',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(mockApi.get).toHaveBeenCalledWith('/teams', {
        params: { search: 'search', sortBy: 'name', sortOrder: 'asc' },
      });
      expect(result.data?.teams[0].name).toBe('Search Result');
    });
  });

  describe('getTeam', () => {
    it('should get a single team by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', name: 'Team 1', description: 'Description 1' },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await teamService.getTeam('1');

      expect(mockApi.get).toHaveBeenCalledWith('/teams/1');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('1');
    });
  });

  describe('createTeam', () => {
    it('should create a new team', async () => {
      const teamData = { name: 'New Team', description: 'New Description' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: '3', name: 'New Team', description: 'New Description' },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await teamService.createTeam(teamData);

      expect(mockApi.post).toHaveBeenCalledWith('/teams', teamData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Team');
    });
  });

  describe('updateTeam', () => {
    it('should update an existing team', async () => {
      const teamData = { name: 'Updated Team', description: 'Updated Description' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', name: 'Updated Team', description: 'Updated Description' },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await teamService.updateTeam('1', teamData);

      expect(mockApi.put).toHaveBeenCalledWith('/teams/1', teamData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Team');
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team', async () => {
      const mockResponse = {
        data: { success: true, data: null },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await teamService.deleteTeam('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/teams/1');
      expect(result.success).toBe(true);
    });
  });

  describe('addTeamMember', () => {
    it('should add a member to a team with role', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 'member-1', userId: 'user-1', role: 'DEVELOPER' },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await teamService.addTeamMember('1', 'new@example.com', 'developer');

      expect(mockApi.post).toHaveBeenCalledWith('/teams/1/members', {
        email: 'new@example.com',
        role: 'DEVELOPER',
      });
      expect(result.success).toBe(true);
      expect(result.data?.role).toBe('DEVELOPER');
    });

    it('should convert role to uppercase', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 'member-1', userId: 'user-1', role: 'PRODUCT_OWNER' },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      await teamService.addTeamMember('1', 'po@example.com', 'product_owner');

      expect(mockApi.post).toHaveBeenCalledWith('/teams/1/members', {
        email: 'po@example.com',
        role: 'PRODUCT_OWNER',
      });
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a member from a team', async () => {
      const mockResponse = {
        data: { success: true, data: null },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await teamService.removeTeamMember('1', 'member-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/teams/1/members/member-1');
      expect(result.success).toBe(true);
    });
  });

  describe('updateTeamMemberRole', () => {
    it('should update a team member role', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 'member-1', userId: 'user-1', role: 'SCRUM_MASTER' },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await teamService.updateTeamMemberRole('1', 'member-1', 'SCRUM_MASTER');

      expect(mockApi.put).toHaveBeenCalledWith('/teams/1/members/member-1', {
        role: 'SCRUM_MASTER',
      });
      expect(result.success).toBe(true);
      expect(result.data?.role).toBe('SCRUM_MASTER');
    });
  });

  describe('getMyTeams', () => {
    it('should get teams for current user with roles', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: '1', name: 'Team 1', userRole: 'PRODUCT_OWNER' },
            { id: '2', name: 'Team 2', userRole: 'DEVELOPER' },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await teamService.getMyTeams();

      expect(mockApi.get).toHaveBeenCalledWith('/teams/my-teams');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].userRole).toBe('PRODUCT_OWNER');
    });
  });

  describe('getMyRoleInTeam', () => {
    it('should get current user role in a specific team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { role: 'SCRUM_MASTER' },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await teamService.getMyRoleInTeam('1');

      expect(mockApi.get).toHaveBeenCalledWith('/teams/1/my-role');
      expect(result.success).toBe(true);
      expect(result.data?.role).toBe('SCRUM_MASTER');
    });
  });

  describe('selectTeam', () => {
    it('should select a team for the current user', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', name: 'Team 1', userRole: 'DEVELOPER' },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await teamService.selectTeam('1');

      expect(mockApi.post).toHaveBeenCalledWith('/teams/select-team', { teamId: '1' });
      expect(result.success).toBe(true);
      expect(result.data?.userRole).toBe('DEVELOPER');
    });
  });
});
