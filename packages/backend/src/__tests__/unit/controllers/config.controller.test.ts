import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigController } from '../../../controllers/config.controller';
import { createMockRequest, createMockResponse } from '../../setup/testSetup';

vi.mock('../../../config', () => ({
  default: {
    notification: {
      pollingIntervalMs: 30000,
      maxPageSize: 100,
      retentionDays: 30,
    },
  },
}));

describe('Config Controller', () => {
  let controller: ConfigController;
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ConfigController();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  describe('getNotificationConfig', () => {
    it('should return notification configuration', async () => {
      await controller.getNotificationConfig(mockReq as any, mockRes as any);

      expect(mockRes._json).toEqual({
        success: true,
        data: {
          pollingIntervalMs: 30000,
          maxPageSize: 100,
          retentionDays: 30,
        },
      });
    });

    it('should return correct config values', async () => {
      await controller.getNotificationConfig(mockReq as any, mockRes as any);

      const response = mockRes._json;
      expect(response.data.pollingIntervalMs).toBe(30000);
      expect(response.data.maxPageSize).toBe(100);
      expect(response.data.retentionDays).toBe(30);
    });
  });
});
