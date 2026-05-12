import { describe, it, expect, vi, beforeEach } from 'vitest';
import { definitionService } from './definition.service';
import { apiService } from '../index';

vi.mock('../index', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('DefinitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefinitionOfDone', () => {
    it('should get Definition of Done for a team', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'dod-1',
          teamId: 'team-1',
          items: [
            {
              id: 'item-1',
              description: 'Code reviewed',
              category: 'review',
              isActive: true,
              order: 1,
            },
          ],
          version: 1,
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      vi.mocked(apiService.get).mockResolvedValue({ data: mockResponse });

      const result = await definitionService.getDefinitionOfDone('team-1');

      expect(apiService.get).toHaveBeenCalledWith('/teams/team-1/definition-of-done');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('dod-1');
    });
  });

  describe('updateDefinitionOfDone', () => {
    it('should update Definition of Done for a team', async () => {
      const mockItems = [
        {
          id: 'item-1',
          description: 'Code reviewed',
          category: 'review',
          isActive: true,
          order: 1,
        },
      ];
      const mockResponse = {
        success: true,
        data: {
          id: 'dod-1',
          teamId: 'team-1',
          items: mockItems,
          version: 2,
          updatedAt: '2024-01-02T00:00:00Z',
        },
      };
      vi.mocked(apiService.put).mockResolvedValue({ data: mockResponse });

      const result = await definitionService.updateDefinitionOfDone('team-1', mockItems);

      expect(apiService.put).toHaveBeenCalledWith('/teams/team-1/definition-of-done', {
        items: mockItems,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getDefinitionOfReady', () => {
    it('should get Definition of Ready for a team', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'dor-1',
          teamId: 'team-1',
          items: [
            {
              id: 'item-1',
              description: 'Acceptance criteria defined',
              category: 'Documentation',
              isActive: true,
              order: 1,
            },
          ],
          version: 1,
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      vi.mocked(apiService.get).mockResolvedValue({ data: mockResponse });

      const result = await definitionService.getDefinitionOfReady('team-1');

      expect(apiService.get).toHaveBeenCalledWith('/teams/team-1/definition-of-ready');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('dor-1');
    });
  });

  describe('updateDefinitionOfReady', () => {
    it('should update Definition of Ready for a team', async () => {
      const mockItems = [
        {
          id: 'item-1',
          description: 'Acceptance criteria defined',
          category: 'Documentation',
          isActive: true,
          order: 1,
        },
      ];
      const mockResponse = {
        success: true,
        data: {
          id: 'dor-1',
          teamId: 'team-1',
          items: mockItems,
          version: 2,
          updatedAt: '2024-01-02T00:00:00Z',
        },
      };
      vi.mocked(apiService.put).mockResolvedValue({ data: mockResponse });

      const result = await definitionService.updateDefinitionOfReady('team-1', mockItems);

      expect(apiService.put).toHaveBeenCalledWith('/teams/team-1/definition-of-ready', {
        items: mockItems,
      });
      expect(result.success).toBe(true);
    });
  });
});
