import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestLogger } from '../../../middleware/requestLogger.middleware';
import { logRequest } from '../../../utils/logger';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../utils/logger', () => ({
  logRequest: vi.fn(),
}));

describe('Request Logger Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;
  let finishCallback: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest({
      method: 'GET',
      path: '/api/users',
      id: 'req-123',
    });
    mockRes = createMockResponse();
    mockRes.statusCode = 200;
    mockRes.on = vi.fn((_event: string, callback: () => void) => {
      finishCallback = callback;
    });
    mockNext = createMockNext();
    finishCallback = undefined;
  });

  it('should log request details when response finishes', () => {
    requestLogger(mockReq as any, mockRes as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));

    expect(finishCallback).toBeDefined();
    finishCallback!();

    expect(logRequest).toHaveBeenCalledWith(
      'GET',
      '/api/users',
      200,
      expect.any(Number),
      'req-123'
    );
  });

  it('should calculate duration correctly', () => {
    requestLogger(mockReq as any, mockRes as any, mockNext);

    expect(finishCallback).toBeDefined();
    finishCallback!();

    const durationCall = vi.mocked(logRequest).mock.calls[0];
    const duration = durationCall?.[3];
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should log POST requests', () => {
    mockReq.method = 'POST';
    mockReq.path = '/api/users';
    mockReq.id = 'req-456';
    mockRes.statusCode = 201;

    requestLogger(mockReq as any, mockRes as any, mockNext);
    finishCallback!();

    expect(logRequest).toHaveBeenCalledWith(
      'POST',
      '/api/users',
      201,
      expect.any(Number),
      'req-456'
    );
  });

  it('should log error responses', () => {
    mockReq.method = 'GET';
    mockReq.path = '/api/users/123';
    mockReq.id = 'req-789';
    mockRes.statusCode = 404;

    requestLogger(mockReq as any, mockRes as any, mockNext);
    finishCallback!();

    expect(logRequest).toHaveBeenCalledWith(
      'GET',
      '/api/users/123',
      404,
      expect.any(Number),
      'req-789'
    );
  });

  it('should log requests without request id', () => {
    mockReq = createMockRequest({
      method: 'GET',
      path: '/',
      id: undefined,
    });
    mockRes = createMockResponse();
    mockRes.statusCode = 200;
    mockRes.on = vi.fn((_event: string, callback: () => void) => {
      finishCallback = callback;
    });
    mockNext = createMockNext();

    requestLogger(mockReq as any, mockRes as any, mockNext);
    finishCallback!();

    expect(logRequest).toHaveBeenCalledWith('GET', '/', 200, expect.any(Number), undefined);
  });

  it('should call next immediately without waiting for finish', () => {
    requestLogger(mockReq as any, mockRes as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(logRequest).not.toHaveBeenCalled();

    finishCallback!();

    expect(logRequest).toHaveBeenCalled();
  });
});
