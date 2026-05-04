import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getWorkflowByEntityType,
  getWorkflowStates,
  getWorkflowTransitions,
  validateTransition,
  executeStatusChange,
  getStatusChangeHistory,
  getAllowedTransitions,
  createWorkflow,
  addWorkflowState,
  addWorkflowTransition,
} from '../../../controllers/workflow.controller';
import { workflowService } from '../../../services/workflow.service';
import { createMockRequest, createMockResponse } from '../../setup/testSetup';

vi.mock('../../../services/workflow.service', () => ({
  workflowService: {
    getWorkflowByEntityType: vi.fn(),
    getWorkflowStates: vi.fn(),
    getWorkflowTransitions: vi.fn(),
    validateTransition: vi.fn(),
    executeStatusChange: vi.fn(),
    getStatusChangeHistory: vi.fn(),
    getAllowedTransitions: vi.fn(),
    createWorkflow: vi.fn(),
    addWorkflowState: vi.fn(),
    addWorkflowTransition: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Workflow Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  describe('getWorkflowByEntityType', () => {
    it('should return workflow for entity type', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem' };
      const mockWorkflow = { id: 'wf-123', entityType: 'ProductBacklogItem' };

      (workflowService.getWorkflowByEntityType as any).mockResolvedValue(mockWorkflow);

      await getWorkflowByEntityType(mockReq as any, mockRes as any);

      expect(mockRes._json).toEqual({
        success: true,
        data: mockWorkflow,
      });
    });

    it('should return 400 when entity type is missing', async () => {
      mockReq.params = {};

      await getWorkflowByEntityType(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(400);
      expect(mockRes._json).toEqual({
        success: false,
        error: 'Entity type is required',
      });
    });

    it('should return 404 when workflow not found', async () => {
      mockReq.params = { entityType: 'Unknown' };

      (workflowService.getWorkflowByEntityType as any).mockResolvedValue(null);

      await getWorkflowByEntityType(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(404);
      expect(mockRes._json).toEqual({
        success: false,
        error: 'Workflow not found',
      });
    });

    it('should return 500 on errors', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem' };

      (workflowService.getWorkflowByEntityType as any).mockRejectedValue(
        new Error('Database error')
      );

      await getWorkflowByEntityType(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(500);
    });
  });

  describe('getWorkflowStates', () => {
    it('should return workflow states', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem' };
      const mockStates = [{ id: 'state-1', name: 'NEW' }];

      (workflowService.getWorkflowStates as any).mockResolvedValue(mockStates);

      await getWorkflowStates(mockReq as any, mockRes as any);

      expect(mockRes._json).toEqual({
        success: true,
        data: mockStates,
      });
    });

    it('should return 400 when entity type is missing', async () => {
      mockReq.params = {};

      await getWorkflowStates(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(400);
    });
  });

  describe('getWorkflowTransitions', () => {
    it('should return workflow transitions', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem' };
      const mockTransitions = [{ id: 'trans-1', fromState: 'NEW', toState: 'IN_PROGRESS' }];

      (workflowService.getWorkflowTransitions as any).mockResolvedValue(mockTransitions);

      await getWorkflowTransitions(mockReq as any, mockRes as any);

      expect(mockRes._json).toEqual({
        success: true,
        data: mockTransitions,
      });
    });

    it('should return 400 when entity type is missing', async () => {
      mockReq.params = {};

      await getWorkflowTransitions(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(400);
    });
  });

  describe('validateTransition', () => {
    it('should validate transition', async () => {
      mockReq.body = {
        entityType: 'ProductBacklogItem',
        fromStatus: 'NEW',
        toStatus: 'IN_PROGRESS',
      };
      mockReq.user = { id: 'user-123' };
      const mockResult = { valid: true };

      (workflowService.validateTransition as any).mockResolvedValue(mockResult);

      await validateTransition(mockReq as any, mockRes as any);

      expect(mockRes._json).toEqual({
        success: true,
        data: mockResult,
      });
    });

    it('should use teamId from params if available', async () => {
      mockReq.params = { teamId: 'team-123' };
      mockReq.body = {
        entityType: 'ProductBacklogItem',
        fromStatus: 'NEW',
        toStatus: 'IN_PROGRESS',
      };
      mockReq.user = { id: 'user-123' };
      mockReq.prisma = {
        teamMember: {
          findUnique: vi.fn().mockResolvedValue({ role: 'PRODUCT_OWNER' }),
        },
      };

      (workflowService.validateTransition as any).mockResolvedValue({ valid: true });

      await validateTransition(mockReq as any, mockRes as any);

      expect(mockReq.prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: {
          teamId_userId: {
            teamId: 'team-123',
            userId: 'user-123',
          },
        },
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = { entityType: 'ProductBacklogItem', fromStatus: 'NEW', toStatus: 'INVALID' };
      mockReq.user = { id: 'user-123' };

      const error = new Error('Invalid transition');
      (error as any).statusCode = 400;

      (workflowService.validateTransition as any).mockRejectedValue(error);

      await validateTransition(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(400);
    });
  });

  describe('executeStatusChange', () => {
    it('should execute status change', async () => {
      mockReq.body = {
        entityType: 'ProductBacklogItem',
        entityId: 'pbi-123',
        fromStatus: 'NEW',
        toStatus: 'IN_PROGRESS',
        changeReason: 'Starting work',
      };
      mockReq.user = { id: 'user-123' };
      const mockHistory = { id: 'history-123', fromStatus: 'NEW', toStatus: 'IN_PROGRESS' };

      (workflowService.executeStatusChange as any).mockResolvedValue(mockHistory);

      await executeStatusChange(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockHistory,
      });
    });

    it('should return 401 when user not authenticated', async () => {
      mockReq.body = { entityType: 'ProductBacklogItem' };
      mockReq.user = undefined;

      await executeStatusChange(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(401);
      expect(mockRes._json).toEqual({
        success: false,
        error: 'User not authenticated',
      });
    });

    it('should pass user roles from team membership', async () => {
      mockReq.params = { teamId: 'team-123' };
      mockReq.body = {
        entityType: 'ProductBacklogItem',
        entityId: 'pbi-123',
        fromStatus: 'NEW',
        toStatus: 'IN_PROGRESS',
      };
      mockReq.user = { id: 'user-123' };
      mockReq.prisma = {
        teamMember: {
          findUnique: vi.fn().mockResolvedValue({ role: 'DEVELOPER' }),
        },
      };

      (workflowService.executeStatusChange as any).mockResolvedValue({ id: 'history-123' });

      await executeStatusChange(mockReq as any, mockRes as any);

      expect(workflowService.executeStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userRoles: ['DEVELOPER'],
        })
      );
    });
  });

  describe('getStatusChangeHistory', () => {
    it('should return status change history', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem', entityId: 'pbi-123' };
      mockReq.query = { limit: '10', offset: '0' };
      const mockHistory = [{ id: 'history-1', fromStatus: 'NEW', toStatus: 'IN_PROGRESS' }];

      (workflowService.getStatusChangeHistory as any).mockResolvedValue(mockHistory);

      await getStatusChangeHistory(mockReq as any, mockRes as any);

      expect(workflowService.getStatusChangeHistory).toHaveBeenCalledWith(
        'ProductBacklogItem',
        'pbi-123',
        10,
        0
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockHistory,
      });
    });

    it('should use default limit and offset', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem', entityId: 'pbi-123' };

      (workflowService.getStatusChangeHistory as any).mockResolvedValue([]);

      await getStatusChangeHistory(mockReq as any, mockRes as any);

      expect(workflowService.getStatusChangeHistory).toHaveBeenCalledWith(
        'ProductBacklogItem',
        'pbi-123',
        50,
        0
      );
    });

    it('should return 400 when entity type or ID is missing', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem' };

      await getStatusChangeHistory(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(400);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem', fromStatus: 'NEW' };
      mockReq.user = { id: 'user-123' };
      const mockTransitions = [{ id: 'trans-1', toState: 'IN_PROGRESS' }];

      (workflowService.getAllowedTransitions as any).mockResolvedValue(mockTransitions);

      await getAllowedTransitions(mockReq as any, mockRes as any);

      expect(mockRes._json).toEqual({
        success: true,
        data: mockTransitions,
      });
    });

    it('should return 400 when entity type or fromStatus is missing', async () => {
      mockReq.params = { entityType: 'ProductBacklogItem' };

      await getAllowedTransitions(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(400);
    });
  });

  describe('createWorkflow', () => {
    it('should create a workflow', async () => {
      mockReq.body = {
        entityType: 'CustomEntity',
        name: 'Custom Workflow',
        description: 'Test workflow',
        defaultStatus: 'DRAFT',
      };
      mockReq.user = { id: 'user-123' };
      const mockWorkflow = { id: 'wf-123', entityType: 'CustomEntity' };

      (workflowService.createWorkflow as any).mockResolvedValue(mockWorkflow);

      await createWorkflow(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockWorkflow,
      });
    });

    it('should return 401 when user not authenticated', async () => {
      mockReq.body = { entityType: 'CustomEntity' };
      mockReq.user = undefined;

      await createWorkflow(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(401);
    });
  });

  describe('addWorkflowState', () => {
    it('should add a workflow state', async () => {
      mockReq.body = {
        workflowId: 'wf-123',
        name: 'REVIEW',
        displayName: 'In Review',
        description: 'Under review',
        color: '#ff0000',
        icon: 'eye',
        isFinal: false,
        orderIndex: 2,
      };
      const mockState = { id: 'state-123', name: 'REVIEW' };

      (workflowService.addWorkflowState as any).mockResolvedValue(mockState);

      await addWorkflowState(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockState,
      });
    });

    it('should handle null optional fields', async () => {
      mockReq.body = {
        workflowId: 'wf-123',
        name: 'REVIEW',
        displayName: 'In Review',
      };

      (workflowService.addWorkflowState as any).mockResolvedValue({ id: 'state-123' });

      await addWorkflowState(mockReq as any, mockRes as any);

      expect(workflowService.addWorkflowState).toHaveBeenCalledWith(
        'wf-123',
        'REVIEW',
        'In Review',
        null,
        null,
        null,
        undefined,
        undefined
      );
    });
  });

  describe('addWorkflowTransition', () => {
    it('should add a workflow transition', async () => {
      mockReq.body = {
        workflowId: 'wf-123',
        fromStateName: 'NEW',
        toStateName: 'IN_PROGRESS',
        requiresApproval: true,
        allowedRoles: ['PRODUCT_OWNER'],
        allowedUserIds: ['user-123'],
      };
      const mockTransition = { id: 'trans-123', fromState: 'NEW', toState: 'IN_PROGRESS' };

      (workflowService.addWorkflowTransition as any).mockResolvedValue(mockTransition);

      await addWorkflowTransition(mockReq as any, mockRes as any);

      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockTransition,
      });
    });

    it('should handle empty arrays for allowed roles and users', async () => {
      mockReq.body = {
        workflowId: 'wf-123',
        fromStateName: 'NEW',
        toStateName: 'IN_PROGRESS',
      };

      (workflowService.addWorkflowTransition as any).mockResolvedValue({ id: 'trans-123' });

      await addWorkflowTransition(mockReq as any, mockRes as any);

      expect(workflowService.addWorkflowTransition).toHaveBeenCalledWith(
        'wf-123',
        'NEW',
        'IN_PROGRESS',
        undefined,
        [],
        []
      );
    });
  });
});
