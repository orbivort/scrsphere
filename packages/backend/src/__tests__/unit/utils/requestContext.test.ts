import { describe, it, expect } from 'vitest';
import {
  getRequestContext,
  setRequestContext,
  getRequestId,
  getUserId,
  getTeamId,
  updateRequestContext,
} from '../../../utils/requestContext';

describe('RequestContext', () => {
  describe('setRequestContext', () => {
    it('should set and retrieve request context', () => {
      const context = { requestId: 'test-request-123' };

      const result = setRequestContext(context, () => {
        const retrieved = getRequestContext();
        expect(retrieved).toEqual(context);
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should return undefined when not in a context', () => {
      const context = getRequestContext();
      expect(context).toBeUndefined();
    });

    it('should isolate contexts between different runs', () => {
      const context1 = { requestId: 'request-1', userId: 'user-1' };
      const context2 = { requestId: 'request-2', userId: 'user-2' };

      setRequestContext(context1, () => {
        expect(getRequestContext()).toEqual(context1);

        setRequestContext(context2, () => {
          expect(getRequestContext()).toEqual(context2);
        });

        expect(getRequestContext()).toEqual(context1);
      });
    });
  });

  describe('getRequestContext', () => {
    it('should return the full context object', () => {
      const context = {
        requestId: 'req-123',
        userId: 'user-456',
        teamId: 'team-789',
      };

      setRequestContext(context, () => {
        expect(getRequestContext()).toEqual(context);
      });
    });
  });

  describe('getRequestId', () => {
    it('should return requestId from context', () => {
      const context = { requestId: 'req-123' };

      setRequestContext(context, () => {
        expect(getRequestId()).toBe('req-123');
      });
    });

    it('should return undefined when no context exists', () => {
      expect(getRequestId()).toBeUndefined();
    });
  });

  describe('getUserId', () => {
    it('should return userId from context', () => {
      const context = { requestId: 'req-123', userId: 'user-456' };

      setRequestContext(context, () => {
        expect(getUserId()).toBe('user-456');
      });
    });

    it('should return undefined when userId is not set', () => {
      const context = { requestId: 'req-123' };

      setRequestContext(context, () => {
        expect(getUserId()).toBeUndefined();
      });
    });
  });

  describe('getTeamId', () => {
    it('should return teamId from context', () => {
      const context = { requestId: 'req-123', teamId: 'team-789' };

      setRequestContext(context, () => {
        expect(getTeamId()).toBe('team-789');
      });
    });

    it('should return undefined when teamId is not set', () => {
      const context = { requestId: 'req-123' };

      setRequestContext(context, () => {
        expect(getTeamId()).toBeUndefined();
      });
    });
  });

  describe('updateRequestContext', () => {
    it('should update existing context with new values', () => {
      const context = { requestId: 'req-123' };

      setRequestContext(context, () => {
        updateRequestContext({ userId: 'user-456' });

        expect(getRequestContext()).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
        });
      });
    });

    it('should allow multiple updates', () => {
      const context = { requestId: 'req-123' };

      setRequestContext(context, () => {
        updateRequestContext({ userId: 'user-456' });
        updateRequestContext({ teamId: 'team-789' });

        expect(getRequestContext()).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
          teamId: 'team-789',
        });
      });
    });

    it('should overwrite existing values', () => {
      const context = { requestId: 'req-123', userId: 'user-old' };

      setRequestContext(context, () => {
        updateRequestContext({ userId: 'user-new' });

        expect(getRequestContext()).toEqual({
          requestId: 'req-123',
          userId: 'user-new',
        });
      });
    });

    it('should do nothing when no context exists', () => {
      expect(() => {
        updateRequestContext({ userId: 'user-456' });
      }).not.toThrow();

      expect(getRequestContext()).toBeUndefined();
    });
  });

  describe('async context propagation', () => {
    it('should maintain context across async operations', async () => {
      const context = { requestId: 'req-async' };

      await setRequestContext(context, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(getRequestContext()).toEqual(context);
      });
    });

    it('should maintain context with nested async operations', async () => {
      const context = { requestId: 'req-nested' };

      await setRequestContext(context, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));

        const nestedContext = { requestId: 'req-nested-2', userId: 'user-1' };
        await setRequestContext(nestedContext, async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          expect(getUserId()).toBe('user-1');
        });

        expect(getRequestContext()).toEqual(context);
      });
    });
  });
});
