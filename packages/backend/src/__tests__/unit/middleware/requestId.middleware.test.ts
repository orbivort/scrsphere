import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestId } from '../../../middleware/requestId.middleware';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'generated-uuid-12345'),
}));

describe('Request ID Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  it('should generate a UUID when no x-request-id header is present', () => {
    mockReq.headers = {};

    requestId(mockReq as any, mockRes as any, mockNext);

    expect(mockReq.id).toBe('generated-uuid-12345');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'generated-uuid-12345');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use x-request-id header when provided', () => {
    mockReq.headers = { 'x-request-id': 'custom-request-id-123' };

    requestId(mockReq as any, mockRes as any, mockNext);

    expect(mockReq.id).toBe('custom-request-id-123');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'custom-request-id-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set the same ID in both req.id and response header', () => {
    mockReq.headers = { 'x-request-id': 'test-id' };

    requestId(mockReq as any, mockRes as any, mockNext);

    expect(mockReq.id).toBe('test-id');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'test-id');
  });

  it('should handle empty string x-request-id header as falsy', () => {
    mockReq.headers = { 'x-request-id': '' };

    requestId(mockReq as any, mockRes as any, mockNext);

    expect(mockReq.id).toBe('generated-uuid-12345');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'generated-uuid-12345');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next to continue middleware chain', () => {
    requestId(mockReq as any, mockRes as any, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
