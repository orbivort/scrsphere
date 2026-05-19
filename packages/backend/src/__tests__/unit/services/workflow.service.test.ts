import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowService } from '../../../services/workflow.service';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../../utils/errors';

// Mock prisma
vi.mock('../../../utils/prisma', () => ({
  default: {
    workflow: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workflowState: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    workflowTransition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    statusChangeHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

// Mock workflow-lock.service
vi.mock('../../../services/workflow-lock.service', () => ({
  WorkflowLockService: {
    withLock: vi.fn().mockImplementation(async (_entityType, callback) => {
      return callback();
    }),
  },
}));

// Mock uuid
vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('mock-uuid-7'),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import prisma from '../../../utils/prisma';
import { WorkflowLockService } from '../../../services/workflow-lock.service';

describe('WorkflowService', () => {
  let workflowService: WorkflowService;

  beforeEach(() => {
    vi.clearAllMocks();
    workflowService = new WorkflowService();
  });

  describe('getWorkflowByEntityType', () => {
    it('should return workflow from cache if available', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      // First call - fetch from DB
      const result1 = await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(result1).toBeDefined();

      // Second call - should use cache
      const result2 = await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(result2).toBeDefined();
      expect(prisma.workflow.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should create default workflow if not exists', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          workflow: {
            create: vi.fn(),
          },
          workflowState: {
            create: vi.fn(),
          },
          workflowTransition: {
            create: vi.fn(),
          },
        });
      });

      await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(prisma.workflow.findUnique).toHaveBeenCalled();
    });

    it('should return null for unknown entity type', async () => {
      const result = await workflowService.getWorkflowByEntityType('UnknownType', 'user-1');
      expect(result).toBeNull();
    });

    it('should return in-progress initialization promise when initialization already in progress', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (workflowService as any).initializationLocks.set(
        'productgoal',
        Promise.resolve(mockWorkflow)
      );

      const result = await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(result).toBe(mockWorkflow);
      expect(prisma.workflow.findUnique).not.toHaveBeenCalled();
    });

    it('should handle double-check pattern when workflow created by another instance', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (prisma.workflow.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockWorkflow);

      const result = await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(result).toBeDefined();
      expect(result!.entityType).toBe('ProductGoal');
    });

    it('should handle P2002 error and recover by fetching existing workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (WorkflowLockService.withLock as any).mockRejectedValueOnce({ code: 'P2002' });
      (prisma.workflow.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockWorkflow);

      const result = await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(result).toBeDefined();
      expect(result!.entityType).toBe('ProductGoal');
    });

    it('should return null when no userId provided and workflow needs creation', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);
      vi.spyOn(workflowService as any, 'delay').mockResolvedValue(undefined);

      const result = await workflowService.getWorkflowByEntityType('ProductGoal');

      expect(result).toBeNull();
    });
  });

  describe('getWorkflowStates', () => {
    it('should return workflow states', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getWorkflowStates('ProductGoal');

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('NEW');
    });

    it('should throw NotFoundError when workflow not found', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      await expect(workflowService.getWorkflowStates('UnknownType')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getWorkflowTransitions', () => {
    it('should return workflow transitions', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [],
        transitions: [
          { id: 'trans-1', fromStateId: 'state-1', toStateId: 'state-2', isActive: true },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getWorkflowTransitions('ProductGoal');

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundError when workflow not found', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      await expect(workflowService.getWorkflowTransitions('UnknownType')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getStateByName', () => {
    it('should return state by name', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getStateByName('ProductGoal', 'ACTIVE');

      expect(result).toBeDefined();
      expect(result?.name).toBe('ACTIVE');
    });

    it('should return null when state not found', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getStateByName('ProductGoal', 'NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should return null when workflow not found for entity type', async () => {
      const result = await workflowService.getStateByName('UnknownType', 'NEW');

      expect(result).toBeNull();
    });
  });

  describe('validateTransition', () => {
    it('should validate allowed transition', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: ['PRODUCT_OWNER'],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'ACTIVE',
        'user-1',
        ['PRODUCT_OWNER']
      );

      expect(result.isValid).toBe(true);
      expect(result.allowed).toBe(true);
    });

    it('should reject transition when no workflow exists', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      const result = await workflowService.validateTransition(
        'UnknownType',
        'NEW',
        'ACTIVE',
        'user-1',
        []
      );

      expect(result.isValid).toBe(false);
      expect(result.allowed).toBe(false);
    });

    it('should reject transition to non-existent state', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'NONEXISTENT',
        'user-1',
        []
      );

      expect(result.isValid).toBe(false);
    });

    it('should reject transition without permission', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: ['PRODUCT_OWNER'],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'ACTIVE',
        'user-1',
        ['DEVELOPER']
      );

      expect(result.isValid).toBe(true);
      expect(result.allowed).toBe(false);
    });

    it('should reject transition when transition is inactive', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: false,
            allowedRoles: [],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'ACTIVE',
        'user-1',
        []
      );

      expect(result.allowed).toBe(false);
    });

    it('should allow initial status as default', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        null,
        'NEW',
        'user-1',
        []
      );

      expect(result.isValid).toBe(true);
      expect(result.allowed).toBe(true);
    });

    it('should reject non-default initial status', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        null,
        'ACTIVE',
        'user-1',
        []
      );

      expect(result.isValid).toBe(false);
    });

    it('should allow transition when no role or user restrictions exist', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: [],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'ACTIVE',
        'user-1',
        []
      );

      expect(result.isValid).toBe(true);
      expect(result.allowed).toBe(true);
    });

    it('should reject transition when user not in allowed list', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: [],
            allowedUserIds: ['other-user'],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'ACTIVE',
        'user-1',
        []
      );

      expect(result.isValid).toBe(true);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('do not have permission');
    });

    it('should allow transition when user is in allowed list', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: [],
            allowedUserIds: ['user-1'],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.validateTransition(
        'ProductGoal',
        'NEW',
        'ACTIVE',
        'user-1',
        []
      );

      expect(result.isValid).toBe(true);
      expect(result.allowed).toBe(true);
    });
  });

  describe('executeStatusChange', () => {
    it('should execute status change successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: ['PRODUCT_OWNER'],
            allowedUserIds: [],
          },
        ],
      };

      const mockHistory = {
        id: 'history-1',
        entityType: 'ProductGoal',
        entityId: 'goal-1',
        fromStateId: 'state-1',
        toStateId: 'state-2',
        changedBy: 'user-1',
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);
      (prisma.statusChangeHistory.create as any).mockResolvedValue(mockHistory);

      const result = await workflowService.executeStatusChange({
        entityType: 'ProductGoal',
        entityId: 'goal-1',
        fromStatus: 'NEW',
        toStatus: 'ACTIVE',
        userId: 'user-1',
        userRoles: ['PRODUCT_OWNER'],
      });

      expect(result).toBeDefined();
      expect(result.entityId).toBe('goal-1');
    });

    it('should throw ForbiddenError for invalid transition', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      await expect(
        workflowService.executeStatusChange({
          entityType: 'ProductGoal',
          entityId: 'goal-1',
          fromStatus: 'NEW',
          toStatus: 'ACTIVE',
          userId: 'user-1',
          userRoles: [],
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for unauthorized transition', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: ['PRODUCT_OWNER'],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      await expect(
        workflowService.executeStatusChange({
          entityType: 'ProductGoal',
          entityId: 'goal-1',
          fromStatus: 'NEW',
          toStatus: 'ACTIVE',
          userId: 'user-1',
          userRoles: ['DEVELOPER'],
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError when target state does not exist', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      await expect(
        workflowService.executeStatusChange({
          entityType: 'ProductGoal',
          entityId: 'goal-1',
          fromStatus: 'NEW',
          toStatus: 'NONEXISTENT',
          userId: 'user-1',
          userRoles: [],
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getStatusChangeHistory', () => {
    it('should return status change history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          entityType: 'ProductGoal',
          entityId: 'goal-1',
          fromStateId: 'state-1',
          toStateId: 'state-2',
          changedBy: 'user-1',
          createdAt: new Date(),
        },
      ];

      const mockUsers = [
        {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: null,
        },
      ];

      (prisma.statusChangeHistory.findMany as any).mockResolvedValue(mockHistory);
      (prisma.user.findMany as any).mockResolvedValue(mockUsers);

      const result = await workflowService.getStatusChangeHistory('ProductGoal', 'goal-1');

      expect(result).toHaveLength(1);
      expect(result[0]!.entityId).toBe('goal-1');
    });

    it('should apply limit and offset', async () => {
      (prisma.statusChangeHistory.findMany as any).mockResolvedValue([]);
      (prisma.user.findMany as any).mockResolvedValue([]);

      await workflowService.getStatusChangeHistory('ProductGoal', 'goal-1', 10, 5);

      expect(prisma.statusChangeHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });

    it('should return null changer for unknown user', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          entityType: 'ProductGoal',
          entityId: 'goal-1',
          fromStateId: 'state-1',
          toStateId: 'state-2',
          changedBy: 'unknown-user',
          createdAt: new Date(),
        },
      ];

      (prisma.statusChangeHistory.findMany as any).mockResolvedValue(mockHistory);
      (prisma.user.findMany as any).mockResolvedValue([]);

      const result = await workflowService.getStatusChangeHistory('ProductGoal', 'goal-1');

      expect(result).toHaveLength(1);
      expect((result[0] as any).changer).toBeNull();
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for user', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
          { id: 'state-3', name: 'COMPLETED', displayName: 'Completed', orderIndex: 3 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: ['PRODUCT_OWNER'],
            allowedUserIds: [],
          },
          {
            id: 'trans-2',
            fromStateId: 'state-1',
            toStateId: 'state-3',
            isActive: true,
            allowedRoles: ['ADMIN'],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getAllowedTransitions('ProductGoal', 'NEW', 'user-1', [
        'PRODUCT_OWNER',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('trans-1');
    });

    it('should return empty array when no workflow exists', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      const result = await workflowService.getAllowedTransitions(
        'UnknownType',
        'NEW',
        'user-1',
        []
      );

      expect(result).toHaveLength(0);
    });

    it('should return empty array when from state not found', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [{ id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 }],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getAllowedTransitions(
        'ProductGoal',
        'NONEXISTENT',
        'user-1',
        []
      );

      expect(result).toHaveLength(0);
    });

    it('should filter out inactive transitions', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: false,
            allowedRoles: [],
            allowedUserIds: [],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getAllowedTransitions(
        'ProductGoal',
        'NEW',
        'user-1',
        []
      );

      expect(result).toHaveLength(0);
    });

    it('should allow transition with user-specific permissions', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: [],
            allowedUserIds: ['user-1'],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getAllowedTransitions(
        'ProductGoal',
        'NEW',
        'user-1',
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('trans-1');
    });

    it('should reject transition when user not in allowedUserIds', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        defaultStatus: 'NEW',
        states: [
          { id: 'state-1', name: 'NEW', displayName: 'New', orderIndex: 1 },
          { id: 'state-2', name: 'ACTIVE', displayName: 'Active', orderIndex: 2 },
        ],
        transitions: [
          {
            id: 'trans-1',
            fromStateId: 'state-1',
            toStateId: 'state-2',
            isActive: true,
            allowedRoles: [],
            allowedUserIds: ['other-user'],
          },
        ],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.getAllowedTransitions(
        'ProductGoal',
        'NEW',
        'user-1',
        []
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('createWorkflow', () => {
    it('should create a new workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'CustomEntity',
        name: 'Custom Workflow',
        description: 'Custom description',
        defaultStatus: 'PENDING',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(null);
      (prisma.workflow.create as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.createWorkflow(
        'CustomEntity',
        'Custom Workflow',
        'Custom description',
        'PENDING',
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Custom Workflow');
    });

    it('should throw ConflictError when workflow already exists', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue({ id: 'existing' });

      await expect(
        workflowService.createWorkflow('CustomEntity', 'Custom Workflow', null, 'PENDING', 'user-1')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('addWorkflowState', () => {
    it('should add a state to workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'CustomEntity',
        name: 'Custom Workflow',
      };

      const mockState = {
        id: 'state-1',
        workflowId: 'workflow-1',
        name: 'IN_REVIEW',
        displayName: 'In Review',
        description: null,
        color: '#F59E0B',
        icon: 'eye',
        isFinal: false,
        orderIndex: 2,
        createdAt: new Date(),
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);
      (prisma.workflowState.create as any).mockResolvedValue(mockState);

      const result = await workflowService.addWorkflowState(
        'workflow-1',
        'IN_REVIEW',
        'In Review',
        null,
        '#F59E0B',
        'eye',
        false,
        2
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('IN_REVIEW');
    });

    it('should throw NotFoundError when workflow not found', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      await expect(
        workflowService.addWorkflowState(
          'nonexistent',
          'IN_REVIEW',
          'In Review',
          null,
          null,
          null,
          false,
          1
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('addWorkflowTransition', () => {
    it('should add a transition to workflow', async () => {
      // Use ProductGoal which exists in DEFAULT_WORKFLOW_CONFIGS
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [
          { id: 'state-1', name: 'NEW' },
          { id: 'state-2', name: 'ACTIVE' },
        ],
        transitions: [],
      };

      const mockTransition = {
        id: 'trans-1',
        workflowId: 'workflow-1',
        fromStateId: 'state-1',
        toStateId: 'state-2',
        requiresApproval: false,
        allowedRoles: ['PRODUCT_OWNER'],
        allowedUserIds: [],
        isActive: true,
        createdAt: new Date(),
      };

      // First call is by id, second call is by entityType (in getWorkflowByEntityType -> fetchExistingWorkflow)
      (prisma.workflow.findUnique as any)
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockWorkflow);
      (prisma.workflowTransition.create as any).mockResolvedValue(mockTransition);

      const result = await workflowService.addWorkflowTransition(
        'workflow-1',
        'NEW',
        'ACTIVE',
        false,
        ['PRODUCT_OWNER'],
        []
      );

      expect(result).toBeDefined();
      expect(result.fromStateId).toBe('state-1');
    });

    it('should throw NotFoundError when workflow not found', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      await expect(
        workflowService.addWorkflowTransition('nonexistent', 'NEW', 'ACTIVE', false, [], [])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError for invalid state names', async () => {
      // Use ProductGoal which exists in DEFAULT_WORKFLOW_CONFIGS
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [{ id: 'state-1', name: 'NEW' }],
        transitions: [],
      };

      // First call is by id, second call is by entityType
      (prisma.workflow.findUnique as any)
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockWorkflow);

      await expect(
        workflowService.addWorkflowTransition('workflow-1', 'NEW', 'NONEXISTENT', false, [], [])
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for entity type', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      // Populate cache
      await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');

      // Invalidate cache
      workflowService.invalidateCache('ProductGoal');

      // Should fetch from DB again
      await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(prisma.workflow.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached workflows', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      // Populate cache
      await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');

      // Clear cache
      workflowService.clearCache();

      // Should fetch from DB again
      await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');
      expect(prisma.workflow.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.workflows).toBeDefined();
    });

    it('should return healthy when workflows can be checked', async () => {
      (prisma.workflow.findUnique as any).mockResolvedValue(null);

      const result = await workflowService.healthCheck();

      // healthy is true when no errors occurred, even if workflows don't exist
      expect(result.healthy).toBe(true);
      // But all workflows should report as not existing
      expect(Object.values(result.workflows).every((r) => !r.exists)).toBe(true);
    });

    it('should handle non-Error thrown during health check', async () => {
      (prisma.workflow.findUnique as any).mockRejectedValueOnce('db crash').mockResolvedValue(null);

      const result = await workflowService.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.workflows.ProductGoal).toBeDefined();
      expect(result.workflows.ProductGoal!.exists).toBe(false);
      expect(result.workflows.ProductGoal!.error).toBe('Unknown error');
    });
  });

  describe('forceReinitialize', () => {
    it('should force reinitialize workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      const result = await workflowService.forceReinitialize('ProductGoal');

      expect(result).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'ProductGoal',
        name: 'Product Goal Workflow',
        states: [],
        transitions: [],
      };

      (prisma.workflow.findUnique as any).mockResolvedValue(mockWorkflow);

      // Populate cache
      await workflowService.getWorkflowByEntityType('ProductGoal', 'user-1');

      const result = workflowService.getMetrics();

      expect(result.cacheSize).toBe(1);
      expect(result.cachedEntityTypes).toContain('productgoal');
    });
  });
});
