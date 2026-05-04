import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextMiddleware } from '../../../middleware/context.middleware';
import { getRequestContext } from '../../../utils/requestContext';
import type { Request, Response } from 'express';

describe('contextMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let capturedContext: ReturnType<typeof getRequestContext>;

  beforeEach(() => {
    mockReq = {
      id: undefined,
      userId: undefined,
      user: undefined,
      currentTeamId: undefined,
    };
    mockRes = {};
    capturedContext = undefined;
  });

  it('should initialize context with requestId', () => {
    mockReq.id = 'test-request-123';

    const mockNext = vi.fn(() => {
      capturedContext = getRequestContext();
    });

    contextMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(capturedContext).toEqual({
      requestId: 'test-request-123',
    });
  });

  it('should handle missing requestId', () => {
    mockReq.id = undefined;

    const mockNext = vi.fn(() => {
      capturedContext = getRequestContext();
    });

    contextMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(capturedContext).toEqual({
      requestId: '',
    });
  });

  it('should not include userId or teamId initially', () => {
    mockReq.id = 'test-request-123';
    mockReq.userId = 'user-456';
    mockReq.currentTeamId = 'team-789';

    const mockNext = vi.fn(() => {
      capturedContext = getRequestContext();
    });

    contextMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(capturedContext).toEqual({
      requestId: 'test-request-123',
    });
    expect(capturedContext?.userId).toBeUndefined();
    expect(capturedContext?.teamId).toBeUndefined();
  });

  it('should call next middleware', () => {
    mockReq.id = 'test-request-123';

    const mockNext = vi.fn();

    contextMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should create isolated context for each request', () => {
    let context1: ReturnType<typeof getRequestContext>;
    let context2: ReturnType<typeof getRequestContext>;

    const mockNext1 = vi.fn(() => {
      context1 = getRequestContext();
    });

    const mockNext2 = vi.fn(() => {
      context2 = getRequestContext();
    });

    mockReq.id = 'request-1';
    contextMiddleware(mockReq as Request, mockRes as Response, mockNext1);

    mockReq.id = 'request-2';
    contextMiddleware(mockReq as Request, mockRes as Response, mockNext2);

    expect(context1!).toEqual({ requestId: 'request-1' });
    expect(context2!).toEqual({ requestId: 'request-2' });
  });
});
