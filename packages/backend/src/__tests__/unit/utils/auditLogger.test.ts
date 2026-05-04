// Unit tests for auditLogger module
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the logger module - must be before imports
vi.mock('../../../utils/logger', () => ({
  auditLogger: {
    info: vi.fn(),
  },
}));

// Mock requestContext
vi.mock('../../../utils/requestContext', () => ({
  getRequestContext: vi.fn(),
}));

// Import after mocks are set up
import { auditLogger } from '../../../utils/logger';
import { getRequestContext } from '../../../utils/requestContext';
import {
  auditLog,
  auditAuthEvent,
  auditResourceEvent,
  AuditEventTypes,
  AuditActions,
  AuditResults,
} from '../../../utils/auditLogger';

describe('auditLogger', () => {
  const mockAuditLoggerInfo = auditLogger.info as ReturnType<typeof vi.fn>;
  const mockGetRequestContext = getRequestContext as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestContext.mockReturnValue({
      requestId: 'req-123',
      userId: 'user-456',
      teamId: 'team-789',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('auditLog', () => {
    it('should log audit event with all required fields', () => {
      auditLog({
        eventType: AuditEventTypes.AUTH,
        action: AuditActions.LOGIN,
        actor: {
          userId: 'user-123',
          email: 'test@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        resource: {
          type: 'SESSION',
        },
        result: AuditResults.SUCCESS,
      });

      expect(mockAuditLoggerInfo).toHaveBeenCalledOnce();
      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;

      expect(callArgs[0]).toBe('AUDIT: AUTH.LOGIN');
      expect(callArgs[1]).toHaveProperty('audit');
      expect(callArgs[1]).toHaveProperty('requestId', 'req-123');
      expect(callArgs[1]).toHaveProperty('teamId', 'team-789');

      const auditEntry = callArgs[1].audit;
      expect(auditEntry).toHaveProperty('timestamp');
      expect(auditEntry.eventType).toBe('AUTH');
      expect(auditEntry.action).toBe('LOGIN');
      expect(auditEntry.result).toBe('SUCCESS');
      expect(auditEntry.actor.userId).toBe('user-123');
      expect(auditEntry.actor.email).toBe('test@example.com');
    });

    it('should merge actor userId from request context if not provided', () => {
      auditLog({
        eventType: AuditEventTypes.USER,
        action: AuditActions.UPDATE,
        actor: {
          email: 'test@example.com',
        },
        resource: {
          type: 'USER',
          id: 'user-789',
        },
        result: AuditResults.SUCCESS,
      });

      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      expect(callArgs[1].audit.actor.userId).toBe('user-456'); // From request context
    });

    it('should include additional details when provided', () => {
      auditLog({
        eventType: AuditEventTypes.TEAM,
        action: AuditActions.CREATE,
        actor: {
          userId: 'user-123',
        },
        resource: {
          type: 'TEAM',
          id: 'team-456',
          name: 'Engineering Team',
        },
        result: AuditResults.SUCCESS,
        details: {
          memberCount: 5,
          plan: 'enterprise',
        },
      });

      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      expect(callArgs[1].audit.details).toEqual({
        memberCount: 5,
        plan: 'enterprise',
      });
    });

    it('should handle failure results', () => {
      auditLog({
        eventType: AuditEventTypes.AUTH,
        action: AuditActions.LOGIN,
        actor: {
          email: 'test@example.com',
        },
        resource: {
          type: 'SESSION',
        },
        result: AuditResults.FAILURE,
        details: {
          reason: 'Invalid credentials',
        },
      });

      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      expect(callArgs[1].audit.result).toBe('FAILURE');
      expect(callArgs[1].audit.details.reason).toBe('Invalid credentials');
    });

    it('should handle denied results', () => {
      auditLog({
        eventType: AuditEventTypes.USER,
        action: AuditActions.DELETE,
        actor: {
          userId: 'user-123',
        },
        resource: {
          type: 'USER',
          id: 'user-789',
        },
        result: AuditResults.DENIED,
        details: {
          reason: 'Insufficient permissions',
        },
      });

      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      expect(callArgs[1].audit.result).toBe('DENIED');
    });
  });

  describe('auditAuthEvent', () => {
    it('should create audit log for authentication events', () => {
      auditAuthEvent('LOGIN', 'SUCCESS', {
        userId: 'user-123',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockAuditLoggerInfo).toHaveBeenCalledOnce();
      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;

      expect(callArgs[0]).toBe('AUDIT: AUTH.LOGIN');
      expect(callArgs[1].audit.eventType).toBe('AUTH');
      expect(callArgs[1].audit.action).toBe('LOGIN');
      expect(callArgs[1].audit.result).toBe('SUCCESS');
      expect(callArgs[1].audit.resource.type).toBe('SESSION');
    });

    it('should include failure reason when provided', () => {
      auditAuthEvent('LOGIN', 'FAILURE', {
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        reason: 'Invalid password',
      });

      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      expect(callArgs[1].audit.result).toBe('FAILURE');
      expect(callArgs[1].audit.details.reason).toBe('Invalid password');
    });

    it('should handle different auth actions', () => {
      const actions = ['LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'TOKEN_REFRESH'];

      actions.forEach((action) => {
        mockAuditLoggerInfo.mockClear();

        auditAuthEvent(action, 'SUCCESS', {
          userId: 'user-123',
        });

        expect(mockAuditLoggerInfo).toHaveBeenCalledWith(
          `AUDIT: AUTH.${action}`,
          expect.any(Object)
        );
      });
    });
  });

  describe('auditResourceEvent', () => {
    it('should create audit log for resource operations', () => {
      auditResourceEvent(
        AuditEventTypes.TEAM,
        AuditActions.CREATE,
        AuditResults.SUCCESS,
        {
          type: 'TEAM',
          id: 'team-123',
          name: 'Engineering',
        },
        { memberCount: 5 }
      );

      expect(mockAuditLoggerInfo).toHaveBeenCalledOnce();
      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;

      expect(callArgs[0]).toBe('AUDIT: TEAM.CREATE');
      expect(callArgs[1].audit.eventType).toBe('TEAM');
      expect(callArgs[1].audit.action).toBe('CREATE');
      expect(callArgs[1].audit.resource.type).toBe('TEAM');
      expect(callArgs[1].audit.resource.id).toBe('team-123');
      expect(callArgs[1].audit.resource.name).toBe('Engineering');
    });

    it('should handle resource operations without optional fields', () => {
      auditResourceEvent(AuditEventTypes.SPRINT, AuditActions.VIEW, AuditResults.SUCCESS, {
        type: 'SPRINT',
      });

      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      expect(callArgs[1].audit.resource.type).toBe('SPRINT');
      expect(callArgs[1].audit.resource.id).toBeUndefined();
      expect(callArgs[1].audit.resource.name).toBeUndefined();
    });

    it('should work with different event types', () => {
      const eventTypes = [
        AuditEventTypes.USER,
        AuditEventTypes.TEAM,
        AuditEventTypes.SPRINT,
        AuditEventTypes.PROJECT,
      ];

      eventTypes.forEach((eventType) => {
        mockAuditLoggerInfo.mockClear();

        auditResourceEvent(eventType, AuditActions.UPDATE, AuditResults.SUCCESS, {
          type: eventType,
        });

        expect(mockAuditLoggerInfo).toHaveBeenCalledWith(
          `AUDIT: ${eventType}.UPDATE`,
          expect.any(Object)
        );
      });
    });
  });

  describe('constants', () => {
    it('should export AuditEventTypes', () => {
      expect(AuditEventTypes.AUTH).toBe('AUTH');
      expect(AuditEventTypes.USER).toBe('USER');
      expect(AuditEventTypes.TEAM).toBe('TEAM');
      expect(AuditEventTypes.SPRINT).toBe('SPRINT');
      expect(AuditEventTypes.PROJECT).toBe('PROJECT');
      expect(AuditEventTypes.SESSION).toBe('SESSION');
    });

    it('should export AuditActions', () => {
      expect(AuditActions.LOGIN).toBe('LOGIN');
      expect(AuditActions.LOGOUT).toBe('LOGOUT');
      expect(AuditActions.CREATE).toBe('CREATE');
      expect(AuditActions.UPDATE).toBe('UPDATE');
      expect(AuditActions.DELETE).toBe('DELETE');
      expect(AuditActions.VIEW).toBe('VIEW');
      expect(AuditActions.EXPORT).toBe('EXPORT');
      expect(AuditActions.IMPORT).toBe('IMPORT');
      expect(AuditActions.ASSIGN).toBe('ASSIGN');
      expect(AuditActions.UNASSIGN).toBe('UNASSIGN');
    });

    it('should export AuditResults', () => {
      expect(AuditResults.SUCCESS).toBe('SUCCESS');
      expect(AuditResults.FAILURE).toBe('FAILURE');
      expect(AuditResults.DENIED).toBe('DENIED');
    });
  });

  describe('timestamp generation', () => {
    it('should generate ISO timestamp for each audit entry', () => {
      const beforeTimestamp = new Date().toISOString();

      auditLog({
        eventType: AuditEventTypes.AUTH,
        action: AuditActions.LOGIN,
        actor: {},
        resource: { type: 'SESSION' },
        result: AuditResults.SUCCESS,
      });

      const afterTimestamp = new Date().toISOString();
      const callArgs = mockAuditLoggerInfo.mock.calls[0]!;
      const entryTimestamp = callArgs[1].audit.timestamp;

      expect(entryTimestamp).toBeDefined();
      expect(entryTimestamp >= beforeTimestamp).toBe(true);
      expect(entryTimestamp <= afterTimestamp).toBe(true);
    });
  });
});
