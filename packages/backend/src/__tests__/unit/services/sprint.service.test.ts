import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sprintService,
  sprintBacklogManagerService,
  incrementSprintService,
} from '../../../services/sprint.service';
import { NotFoundError, BadRequestError } from '../../../utils/errors';

// Mock prisma
vi.mock('../../../utils/prisma', () => ({
  default: {
    sprint: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    generatedSprint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    productBacklogItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    sprintBacklogItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    burndownData: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    workflow: {
      findFirst: vi.fn(),
    },
    workflowState: {
      findMany: vi.fn(),
    },
    statusChangeHistory: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock workflow service
vi.mock('../../../services/workflow.service', () => ({
  workflowService: {
    validateTransition: vi.fn(),
    executeStatusChange: vi.fn(),
  },
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

// Mock uuid
vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('mock-uuid-7'),
}));

// Mock dbTransaction
vi.mock('../../../utils/dbTransaction', () => ({
  withTransaction: vi.fn().mockImplementation(async (callback: any, _options: any) => {
    return callback({
      sprint: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      sprintBacklogItem: {
        createMany: vi.fn(),
      },
      productBacklogItem: {
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      task: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      burndownData: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      workflow: {
        findFirst: vi.fn(),
      },
      workflowState: {
        findMany: vi.fn(),
      },
      statusChangeHistory: {
        create: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
    });
  }),
  TRANSACTION_CONFIG: {
    START_SPRINT: { timeout: 30000 },
    DEFAULT: { timeout: 10000 },
  },
}));

import prisma from '../../../utils/prisma';
import { workflowService } from '../../../services/workflow.service';
import { withTransaction } from '../../../utils/dbTransaction';

describe('SprintService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSprints', () => {
    it('should return sprints for a team', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          teamId: 'team-1',
          name: 'Sprint 1',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(),
          sprintGoal: 'Complete features',
        },
        {
          id: 'sprint-2',
          teamId: 'team-1',
          name: 'Sprint 2',
          status: 'PLANNED',
          startDate: new Date(),
          endDate: new Date(),
          sprintGoal: 'Bug fixes',
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      const result = await sprintService.getSprints('team-1');

      expect(result).toHaveLength(2);
      expect(prisma.sprint.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        select: expect.any(Object),
        orderBy: { startDate: 'desc' },
      });
    });
  });

  describe('getActiveSprint', () => {
    it('should return active sprint for a team', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(),
        sprintGoal: 'Complete features',
        sprintBacklogItems: [
          {
            id: 'sbi-1',
            pbi: {
              id: 'pbi-1',
              title: 'Test PBI',
              status: 'IN_PROGRESS',
            },
          },
        ],
        tasks: [],
      };

      (prisma.sprint.findFirst as any).mockResolvedValue(mockSprint);

      const result = await sprintService.getActiveSprint('team-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('sprint-1');
      expect(result?.items).toHaveLength(1);
    });

    it('should return null when no active sprint', async () => {
      (prisma.sprint.findFirst as any).mockResolvedValue(null);

      const result = await sprintService.getActiveSprint('team-1');

      expect(result).toBeNull();
    });
  });

  describe('getSprintById', () => {
    it('should return sprint by id', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(),
        sprintGoal: 'Complete features',
        sprintBacklogItems: [],
        tasks: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      const result = await sprintService.getSprintById('sprint-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('sprint-1');
    });

    it('should throw NotFoundError when sprint not found', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(sprintService.getSprintById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createSprint', () => {
    it('should create a new sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        sprintGoal: 'Complete features',
        status: 'PLANNED',
        createdBy: 'user-1',
      };

      (prisma.sprint.findFirst as any).mockResolvedValue(null);
      (prisma.sprint.create as any).mockResolvedValue(mockSprint);

      const result = await sprintService.createSprint('user-1', {
        teamId: 'team-1',
        name: 'Sprint 1',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        sprintGoal: 'Complete features',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Sprint 1');
    });

    it('should throw BadRequestError when active sprint exists', async () => {
      (prisma.sprint.findFirst as any).mockResolvedValue({ id: 'active-sprint' });

      await expect(
        sprintService.createSprint('user-1', {
          teamId: 'team-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('startSprint', () => {
    it('should start a planned sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(),
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprint.findFirst as any).mockResolvedValue(null);

      const mockUpdatedSprint = { ...mockSprint, status: 'ACTIVE' };
      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            findUnique: vi.fn().mockResolvedValue(mockSprint),
            update: vi.fn().mockResolvedValue(mockUpdatedSprint),
          },
          sprintBacklogItem: {
            createMany: vi.fn(),
          },
          productBacklogItem: {
            update: vi.fn(),
            updateMany: vi.fn(),
          },
          task: {
            createMany: vi.fn(),
          },
          burndownData: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn(),
          },
          workflowState: {
            findMany: vi.fn(),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
          user: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        });
      });

      const result = await sprintService.startSprint('sprint-1', 'user-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundError when sprint not found', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);
      (prisma.generatedSprint.findUnique as any).mockResolvedValue(null);

      await expect(sprintService.startSprint('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError when sprint is not planned', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(sprintService.startSprint('sprint-1', 'user-1')).rejects.toThrow(
        BadRequestError
      );
    });

    it('should throw BadRequestError when another sprint is active', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'PLANNED',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprint.findFirst as any).mockResolvedValue({ id: 'active-sprint' });

      await expect(sprintService.startSprint('sprint-1', 'user-1')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('completeSprint', () => {
    it('should complete an active sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprintBacklogItem.findMany as any).mockResolvedValue([]);
      (prisma.task.findMany as any).mockResolvedValue([]);
      (prisma.workflow.findFirst as any).mockResolvedValue(null);

      const mockCompletedSprint = { ...mockSprint, status: 'COMPLETED' };
      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            update: vi.fn().mockResolvedValue(mockCompletedSprint),
          },
          productBacklogItem: {
            updateMany: vi.fn(),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn(),
          },
          workflowState: {
            findMany: vi.fn(),
          },
        });
      });

      const result = await sprintService.completeSprint('sprint-1', 'user-1');

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundError when sprint not found', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(sprintService.completeSprint('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError when sprint is not active', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'PLANNED',
        sprintBacklogItems: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(sprintService.completeSprint('sprint-1', 'user-1')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('cancelSprint', () => {
    it('should cancel a sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      const mockCancelledSprint = {
        ...mockSprint,
        status: 'CANCELLED',
        cancellationReason: 'Team unavailable',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprint.update as any).mockResolvedValue(mockCancelledSprint);

      const result = await sprintService.cancelSprint('sprint-1', 'Team unavailable');

      expect(result.status).toBe('CANCELLED');
      expect(result.cancellationReason).toBe('Team unavailable');
    });

    it('should throw BadRequestError when sprint is completed', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'COMPLETED',
        sprintBacklogItems: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(sprintService.cancelSprint('sprint-1', 'Reason')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('getBurndownData', () => {
    it('should return burndown data for a sprint', async () => {
      const mockData = [
        { id: 'bd-1', date: new Date('2024-01-01'), idealRemaining: 100, actualRemaining: 100 },
        { id: 'bd-2', date: new Date('2024-01-02'), idealRemaining: 80, actualRemaining: 90 },
        { id: 'bd-3', date: new Date('2024-01-03'), idealRemaining: 60, actualRemaining: 70 },
      ];

      (prisma.burndownData.findMany as any).mockResolvedValue(mockData);

      const result = await sprintService.getBurndownData('sprint-1');

      expect(result.dates).toHaveLength(3);
      expect(result.ideal).toEqual([100, 80, 60]);
      expect(result.actual).toEqual([100, 90, 70]);
    });
  });

  describe('getSprintTasks', () => {
    it('should return tasks for a sprint', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          sprintId: 'sprint-1',
          title: 'Task 1',
          status: 'TODO',
          assignee: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          pbi: { id: 'pbi-1', title: 'PBI 1' },
        },
        {
          id: 'task-2',
          sprintId: 'sprint-1',
          title: 'Task 2',
          status: 'IN_PROGRESS',
          assignee: null,
          pbi: { id: 'pbi-1', title: 'PBI 1' },
        },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockTasks);

      const result = await sprintService.getSprintTasks('sprint-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.title).toBe('Task 1');
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        pbiId: 'pbi-1',
        title: 'New Task',
        status: 'TODO',
        assigneeId: null,
        sprint: {
          teamId: 'team-1',
          name: 'Sprint 1',
          team: { id: 'team-1' },
        },
      };

      (prisma.task.create as any).mockResolvedValue(mockTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.executeStatusChange as any).mockResolvedValue({});

      const result = await sprintService.createTask('user-1', {
        sprintId: 'sprint-1',
        pbiId: 'pbi-1',
        title: 'New Task',
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('New Task');
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        title: 'Old Title',
        status: 'TODO',
        sprint: {
          teamId: 'team-1',
          team: {
            members: [],
          },
        },
      };

      const mockUpdatedTask = { ...mockTask, title: 'Updated Title' };

      (prisma.task.findFirst as any).mockResolvedValue(mockTask);
      (prisma.task.update as any).mockResolvedValue(mockUpdatedTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.validateTransition as any).mockResolvedValue({
        isValid: true,
        allowed: true,
      });

      const result = await sprintService.updateTask(
        'sprint-1',
        'task-1',
        {
          title: 'Updated Title',
        },
        'user-1'
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundError when task not found', async () => {
      (prisma.task.findFirst as any).mockResolvedValue(null);

      await expect(
        sprintService.updateTask('sprint-1', 'nonexistent', { title: 'Updated' }, 'user-1')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        title: 'Task to Delete',
      };

      (prisma.task.findFirst as any).mockResolvedValue(mockTask);
      (prisma.task.delete as any).mockResolvedValue(mockTask);

      await sprintService.deleteTask('sprint-1', 'task-1');

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });

    it('should throw NotFoundError when task not found', async () => {
      (prisma.task.findFirst as any).mockResolvedValue(null);

      await expect(sprintService.deleteTask('sprint-1', 'nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

describe('SprintBacklogManagerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addPBIToActiveSprint', () => {
    it('should add PBI to active sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        title: 'Test PBI',
        status: 'READY',
      };

      const mockUser = {
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.productBacklogItem.findUnique as any).mockResolvedValue(mockPBI);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const mockResult = {
        sprintBacklogItem: { id: 'sbi-1', pbi: mockPBI },
        change: {
          id: 'change-1',
          sprintId: 'sprint-1',
          pbiId: 'pbi-1',
          pbiTitle: 'Test PBI',
          changeType: 'ADDED',
          changedBy: 'user-1',
          changedByName: 'John Doe',
          createdAt: new Date(),
        },
      };

      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprintBacklogItem: {
            create: vi.fn().mockResolvedValue(mockResult.sprintBacklogItem),
          },
          productBacklogItem: {
            update: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn(),
          },
          workflowState: {
            findMany: vi.fn(),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
        });
      });

      const result = await sprintBacklogManagerService.addPBIToActiveSprint('sprint-1', 'user-1', {
        pbiId: 'pbi-1',
      });

      expect(result.sprintBacklogItem).toBeDefined();
    });

    it('should throw NotFoundError when sprint not found', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(
        sprintBacklogManagerService.addPBIToActiveSprint('nonexistent', 'user-1', {
          pbiId: 'pbi-1',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when sprint is not active', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'PLANNED',
        sprintBacklogItems: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(
        sprintBacklogManagerService.addPBIToActiveSprint('sprint-1', 'user-1', { pbiId: 'pbi-1' })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when PBI already in sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [{ pbiId: 'pbi-1' }],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(
        sprintBacklogManagerService.addPBIToActiveSprint('sprint-1', 'user-1', { pbiId: 'pbi-1' })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when PBI is not in READY status', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        title: 'Test PBI',
        status: 'TODO',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.productBacklogItem.findUnique as any).mockResolvedValue(mockPBI);

      await expect(
        sprintBacklogManagerService.addPBIToActiveSprint('sprint-1', 'user-1', { pbiId: 'pbi-1' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('removePBIFromActiveSprint', () => {
    it('should remove PBI from active sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [{ id: 'sbi-1', pbiId: 'pbi-1' }],
      };

      const mockPBI = {
        id: 'pbi-1',
        title: 'Test PBI',
        status: 'IN_PROGRESS',
      };

      const mockUser = {
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.productBacklogItem.findUnique as any).mockResolvedValue(mockPBI);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.task.findMany as any).mockResolvedValue([]);

      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprintBacklogItem: {
            delete: vi.fn(),
          },
          task: {
            deleteMany: vi.fn(),
          },
          productBacklogItem: {
            update: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn(),
          },
          workflowState: {
            findMany: vi.fn(),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
        });
      });

      const result = await sprintBacklogManagerService.removePBIFromActiveSprint(
        'sprint-1',
        'pbi-1',
        'user-1',
        { taskAction: 'delete' }
      );

      expect(result.change).toBeDefined();
    });
  });

  describe('getAvailablePBIsForSprint', () => {
    it('should return available PBIs for sprint', async () => {
      const mockActiveSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [{ pbiId: 'pbi-1' }],
      };

      const mockPBIs = [
        { id: 'pbi-2', title: 'PBI 2', status: 'READY', teamId: 'team-1' },
        { id: 'pbi-3', title: 'PBI 3', status: 'READY', teamId: 'team-1' },
      ];

      (prisma.sprint.findFirst as any).mockResolvedValue(mockActiveSprint);
      (prisma.productBacklogItem.findMany as any).mockResolvedValue(mockPBIs);

      const result = await sprintBacklogManagerService.getAvailablePBIsForSprint('team-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('pbi-2');
    });

    it('should exclude PBIs already in active sprint', async () => {
      const mockActiveSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [{ pbiId: 'pbi-1' }],
      };

      (prisma.sprint.findFirst as any).mockResolvedValue(mockActiveSprint);
      (prisma.productBacklogItem.findMany as any).mockResolvedValue([]);

      await sprintBacklogManagerService.getAvailablePBIsForSprint('team-1');

      expect(prisma.productBacklogItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: ['pbi-1'] },
          }),
        })
      );
    });
  });
});

describe('incrementSprintService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEligiblePBIsForIncrement', () => {
    it('should return done PBIs from sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        sprintBacklogItems: [
          {
            pbi: {
              id: 'pbi-1',
              title: 'Done PBI',
              description: 'Description',
              storyPoints: 13,
              status: 'DONE',
              labels: ['feature'],
            },
          },
          {
            pbi: {
              id: 'pbi-2',
              title: 'In Progress PBI',
              description: 'Description',
              storyPoints: 8,
              status: 'IN_PROGRESS',
              labels: [],
            },
          },
        ],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      const result = await incrementSprintService.getEligiblePBIsForIncrement('sprint-1');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('pbi-1');
      expect(result[0]!.status).toBe('DONE');
    });

    it('should throw NotFoundError when sprint not found', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(
        incrementSprintService.getEligiblePBIsForIncrement('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSprintBacklogPBIs', () => {
    it('should return all PBIs from sprint backlog', async () => {
      const mockSprint = {
        id: 'sprint-1',
        sprintBacklogItems: [
          {
            pbi: {
              id: 'pbi-1',
              title: 'PBI 1',
              description: 'Description 1',
              storyPoints: 13,
              status: 'DONE',
              labels: ['feature'],
            },
          },
          {
            pbi: {
              id: 'pbi-2',
              title: 'PBI 2',
              description: 'Description 2',
              storyPoints: 8,
              status: 'IN_PROGRESS',
              labels: [],
            },
          },
        ],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      const result = await incrementSprintService.getSprintBacklogPBIs('sprint-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('pbi-1');
      expect(result[1]!.id).toBe('pbi-2');
    });

    it('should throw NotFoundError when sprint not found', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(incrementSprintService.getSprintBacklogPBIs('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

describe('SprintService - Additional Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startSprint with backlog items and tasks', () => {
    it('should start sprint with backlog items and update PBI status', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(),
      };

      const mockPBI = {
        id: 'pbi-1',
        status: 'READY',
      };

      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'BacklogItem',
      };

      const mockStates = [
        { id: 'state-1', name: 'READY' },
        { id: 'state-2', name: 'IN_PROGRESS' },
      ];

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprint.findFirst as any).mockResolvedValue(null);
      (prisma.productBacklogItem.findMany as any).mockResolvedValue([mockPBI]);
      (prisma.workflow.findFirst as any).mockResolvedValue(mockWorkflow);
      (prisma.workflowState.findMany as any).mockResolvedValue(mockStates);

      const mockUpdatedSprint = { ...mockSprint, status: 'ACTIVE' };
      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            findUnique: vi.fn().mockResolvedValue(mockSprint),
            update: vi.fn().mockResolvedValue(mockUpdatedSprint),
          },
          sprintBacklogItem: {
            createMany: vi.fn(),
          },
          productBacklogItem: {
            update: vi.fn(),
            updateMany: vi.fn(),
          },
          task: {
            createMany: vi.fn(),
          },
          burndownData: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn().mockResolvedValue(mockWorkflow),
          },
          workflowState: {
            findMany: vi.fn().mockResolvedValue(mockStates),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
          user: {
            findMany: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
          },
        });
      });

      const result = await sprintService.startSprint('sprint-1', 'user-1', {
        backlogItems: [{ pbiId: 'pbi-1' }],
        tasks: [],
      });

      expect(result.status).toBe('ACTIVE');
    });

    it('should start sprint with tasks and assignees', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(),
      };

      const mockTaskWorkflow = {
        id: 'task-workflow-1',
        entityType: 'Task',
      };

      const mockTaskStates = [{ id: 'task-state-1', name: 'TODO' }];

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprint.findFirst as any).mockResolvedValue(null);
      (prisma.productBacklogItem.findMany as any).mockResolvedValue([]);

      const mockUpdatedSprint = { ...mockSprint, status: 'ACTIVE' };
      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            findUnique: vi.fn().mockResolvedValue(mockSprint),
            update: vi.fn().mockResolvedValue(mockUpdatedSprint),
          },
          sprintBacklogItem: {
            createMany: vi.fn(),
          },
          productBacklogItem: {
            update: vi.fn(),
            updateMany: vi.fn(),
          },
          task: {
            createMany: vi.fn(),
          },
          burndownData: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn().mockResolvedValue(mockTaskWorkflow),
          },
          workflowState: {
            findMany: vi.fn().mockResolvedValue(mockTaskStates),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
          user: {
            findMany: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
          },
        });
      });

      const result = await sprintService.startSprint('sprint-1', 'user-1', {
        backlogItems: [],
        tasks: [
          {
            pbiId: 'pbi-1',
            title: 'Task 1',
            description: 'Description',
            assigneeId: 'user-1',
            estimatedHours: 8,
          },
        ],
      });

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw BadRequestError for invalid assignee IDs', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(),
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprint.findFirst as any).mockResolvedValue(null);
      (prisma.productBacklogItem.findMany as any).mockResolvedValue([]);

      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            findUnique: vi.fn().mockResolvedValue(mockSprint),
            update: vi.fn().mockResolvedValue({ ...mockSprint, status: 'ACTIVE' }),
          },
          sprintBacklogItem: {
            createMany: vi.fn(),
          },
          productBacklogItem: {
            update: vi.fn(),
            updateMany: vi.fn(),
          },
          task: {
            createMany: vi.fn(),
          },
          burndownData: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          workflowState: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
          user: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        });
      });

      await expect(
        sprintService.startSprint('sprint-1', 'user-1', {
          backlogItems: [],
          tasks: [
            {
              pbiId: 'pbi-1',
              title: 'Task 1',
              assigneeId: 'invalid-user',
            },
          ],
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('completeSprint with PBI updates', () => {
    it('should update PBI status to DONE when all tasks are done', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        sprintBacklogItems: [
          {
            id: 'sbi-1',
            pbiId: 'pbi-1',
            pbi: {
              id: 'pbi-1',
              title: 'PBI 1',
              status: 'IN_PROGRESS',
              storyPoints: 8,
            },
          },
        ],
      };

      const mockTasks = [
        {
          id: 'task-1',
          pbiId: 'pbi-1',
          status: 'DONE',
        },
      ];

      const mockWorkflow = {
        id: 'workflow-1',
        entityType: 'BacklogItem',
      };

      const mockStates = [
        { id: 'state-in-progress', name: 'IN_PROGRESS' },
        { id: 'state-done', name: 'DONE' },
      ];

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.sprintBacklogItem.findMany as any).mockResolvedValue(mockSprint.sprintBacklogItems);
      (prisma.task.findMany as any).mockResolvedValue(mockTasks);
      (prisma.workflow.findFirst as any).mockResolvedValue(mockWorkflow);

      const mockCompletedSprint = { ...mockSprint, status: 'COMPLETED' };
      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            update: vi.fn().mockResolvedValue(mockCompletedSprint),
          },
          productBacklogItem: {
            updateMany: vi.fn(),
          },
          statusChangeHistory: {
            create: vi.fn(),
          },
          workflow: {
            findFirst: vi.fn().mockResolvedValue(mockWorkflow),
          },
          workflowState: {
            findMany: vi.fn().mockResolvedValue(mockStates),
          },
        });
      });

      const result = await sprintService.completeSprint('sprint-1', 'user-1');

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('updateTask with status change', () => {
    it('should update task status with workflow validation', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        title: 'Task 1',
        status: 'TODO',
        assigneeId: null,
        sprint: {
          teamId: 'team-1',
          team: {
            members: [],
          },
        },
      };

      const mockUpdatedTask = { ...mockTask, status: 'IN_PROGRESS' };

      (prisma.task.findFirst as any).mockResolvedValue(mockTask);
      (prisma.task.update as any).mockResolvedValue(mockUpdatedTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.validateTransition as any).mockResolvedValue({
        isValid: true,
        allowed: true,
      });
      (workflowService.executeStatusChange as any).mockResolvedValue({});
      (prisma.burndownData.findFirst as any).mockResolvedValue(null);
      (prisma.sprint.findUnique as any).mockResolvedValue({
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(),
      });

      const result = await sprintService.updateTask(
        'sprint-1',
        'task-1',
        { status: 'IN_PROGRESS' },
        'user-1'
      );

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should set remainingHours to 0 when status is DONE', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        title: 'Task 1',
        status: 'IN_PROGRESS',
        remainingHours: 4,
        sprint: {
          teamId: 'team-1',
          team: {
            members: [],
          },
        },
      };

      (prisma.task.findFirst as any).mockResolvedValue(mockTask);
      (prisma.task.update as any).mockImplementation(async (args: any) => ({
        ...mockTask,
        ...args.data,
      }));
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.validateTransition as any).mockResolvedValue({
        isValid: true,
        allowed: true,
      });
      (workflowService.executeStatusChange as any).mockResolvedValue({});
      (prisma.burndownData.findFirst as any).mockResolvedValue(null);
      (prisma.sprint.findUnique as any).mockResolvedValue({
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(),
      });

      const result = await sprintService.updateTask(
        'sprint-1',
        'task-1',
        { status: 'DONE' },
        'user-1'
      );

      expect(result.remainingHours).toBe(0);
    });

    it('should throw BadRequestError when user is not a team member', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        title: 'Task 1',
        status: 'TODO',
        sprint: {
          teamId: 'team-1',
          team: {
            members: [],
          },
        },
      };

      (prisma.task.findFirst as any).mockResolvedValue(mockTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue(null);

      await expect(
        sprintService.updateTask('sprint-1', 'task-1', { status: 'IN_PROGRESS' }, 'user-1')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when transition is invalid', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        title: 'Task 1',
        status: 'TODO',
        sprint: {
          teamId: 'team-1',
          team: {
            members: [],
          },
        },
      };

      (prisma.task.findFirst as any).mockResolvedValue(mockTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.validateTransition as any).mockResolvedValue({
        isValid: false,
        allowed: false,
        reason: 'Invalid transition',
      });

      await expect(
        sprintService.updateTask('sprint-1', 'task-1', { status: 'DONE' }, 'user-1')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('createTask with notification', () => {
    it('should create notification when task is assigned to another user', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        pbiId: 'pbi-1',
        title: 'New Task',
        status: 'TODO',
        assigneeId: 'assignee-1',
        sprint: {
          teamId: 'team-1',
          name: 'Sprint 1',
          team: { id: 'team-1' },
        },
      };

      const mockAssigner = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.task.create as any).mockResolvedValue(mockTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.executeStatusChange as any).mockResolvedValue({});
      (prisma.user.findUnique as any).mockResolvedValue(mockAssigner);
      (prisma.notification.create as any).mockResolvedValue({});

      const result = await sprintService.createTask('user-1', {
        sprintId: 'sprint-1',
        pbiId: 'pbi-1',
        title: 'New Task',
        assigneeId: 'assignee-1',
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('New Task');
    });

    it('should not create notification when assignee is the creator', async () => {
      const mockTask = {
        id: 'task-1',
        sprintId: 'sprint-1',
        pbiId: 'pbi-1',
        title: 'New Task',
        status: 'TODO',
        assigneeId: 'user-1',
        sprint: {
          teamId: 'team-1',
          name: 'Sprint 1',
          team: { id: 'team-1' },
        },
      };

      (prisma.task.create as any).mockResolvedValue(mockTask);
      (prisma.teamMember.findFirst as any).mockResolvedValue({ role: 'DEVELOPER' });
      (workflowService.executeStatusChange as any).mockResolvedValue({});

      const result = await sprintService.createTask('user-1', {
        sprintId: 'sprint-1',
        pbiId: 'pbi-1',
        title: 'New Task',
        assigneeId: 'user-1',
      });

      expect(result).toBeDefined();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('getTasksByPbiId', () => {
    it('should return tasks for a PBI', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          pbiId: 'pbi-1',
          title: 'Task 1',
          status: 'TODO',
          assignee: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          pbi: { id: 'pbi-1', title: 'PBI 1', status: 'IN_PROGRESS' },
          sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
        },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockTasks);

      const result = await sprintService.getTasksByPbiId('pbi-1');

      expect(result).toHaveLength(1);
      expect(result[0]!.pbiId).toBe('pbi-1');
    });
  });

  describe('rollbackSprintStart', () => {
    it('should rollback sprint start operation', async () => {
      const mockSprint = {
        id: 'sprint-1',
        status: 'ACTIVE',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      const rollbackData = {
        previousPbiStatuses: new Map([['pbi-1', 'READY']]),
        createdSprintBacklogItemIds: ['sbi-1'],
        createdTaskIds: ['task-1'],
      };

      (withTransaction as any).mockImplementation(async (callback: any) => {
        return callback({
          sprint: {
            update: vi.fn().mockResolvedValue({ ...mockSprint, status: 'PLANNED' }),
          },
          task: {
            deleteMany: vi.fn(),
          },
          sprintBacklogItem: {
            deleteMany: vi.fn(),
          },
          productBacklogItem: {
            update: vi.fn(),
          },
          burndownData: {
            deleteMany: vi.fn(),
          },
        });
      });

      await sprintService.rollbackSprintStart('sprint-1', rollbackData);

      expect(withTransaction).toHaveBeenCalled();
    });
  });

  describe('updateBurndownData', () => {
    it('should update burndown data for active sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const mockTasks = [
        { remainingHours: 4, estimatedHours: 8 },
        { remainingHours: 2, estimatedHours: 4 },
      ];

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.task.findMany as any).mockResolvedValue(mockTasks);
      (prisma.burndownData.findFirst as any).mockResolvedValue({
        id: 'bd-1',
        actualRemaining: 10,
      });

      await sprintService.updateBurndownData('sprint-1');

      expect(prisma.burndownData.update).toHaveBeenCalled();
    });

    it('should not update burndown data for non-active sprint', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue({
        status: 'PLANNED',
      });

      await sprintService.updateBurndownData('sprint-1');

      expect(prisma.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('SprintBacklogManagerService - additional cases', () => {
    it('should throw NotFoundError when PBI not found in addPBIToActiveSprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.productBacklogItem.findUnique as any).mockResolvedValue(null);

      await expect(
        sprintBacklogManagerService.addPBIToActiveSprint('sprint-1', 'user-1', { pbiId: 'pbi-1' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when PBI team does not match sprint team', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-2',
        title: 'Test PBI',
        status: 'READY',
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.productBacklogItem.findUnique as any).mockResolvedValue(mockPBI);

      await expect(
        sprintBacklogManagerService.addPBIToActiveSprint('sprint-1', 'user-1', { pbiId: 'pbi-1' })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when sprint not found in removePBIFromActiveSprint', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(
        sprintBacklogManagerService.removePBIFromActiveSprint('sprint-1', 'pbi-1', 'user-1', {
          taskAction: 'delete',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when sprint is not active in removePBIFromActiveSprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'PLANNED',
        sprintBacklogItems: [{ id: 'sbi-1', pbiId: 'pbi-1' }],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(
        sprintBacklogManagerService.removePBIFromActiveSprint('sprint-1', 'pbi-1', 'user-1', {
          taskAction: 'delete',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when sprint backlog item not found', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);

      await expect(
        sprintBacklogManagerService.removePBIFromActiveSprint('sprint-1', 'pbi-1', 'user-1', {
          taskAction: 'delete',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when PBI not found in removePBIFromActiveSprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        teamId: 'team-1',
        status: 'ACTIVE',
        sprintBacklogItems: [{ id: 'sbi-1', pbiId: 'pbi-1' }],
      };

      (prisma.sprint.findUnique as any).mockResolvedValue(mockSprint);
      (prisma.productBacklogItem.findUnique as any).mockResolvedValue(null);

      await expect(
        sprintBacklogManagerService.removePBIFromActiveSprint('sprint-1', 'pbi-1', 'user-1', {
          taskAction: 'delete',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when sprint not found in getSprintBacklogChanges', async () => {
      (prisma.sprint.findUnique as any).mockResolvedValue(null);

      await expect(sprintBacklogManagerService.getSprintBacklogChanges('sprint-1')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
