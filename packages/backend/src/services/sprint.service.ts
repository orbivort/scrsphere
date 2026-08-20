// Sprint Service
import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { workflowService } from './workflow.service';
import {
  withTransaction,
  TRANSACTION_CONFIG,
  type TransactionOptions,
} from '../utils/dbTransaction';
import {
  NotificationType,
  type Sprint,
  type Task,
  type TaskStatus,
  type GeneratedSprint,
  type Prisma,
  type ProductBacklogItem,
  type User,
  type ItemStatus,
  type SprintBacklogItem,
} from '../generated/prisma/client';
import { logger } from '../utils/logger';
import { processBatch } from '../utils/batch';
import { notificationService } from './notification.service';
import { t as requestT } from '../i18n/requestT.js';

// Sprint with relations (optimized for API responses)
export type SprintWithRelations = Omit<Sprint, 'createdBy' | 'updatedBy'> & {
  items?: Omit<ProductBacklogItem, 'createdBy' | 'updatedBy' | 'sprintId'>[];
  tasks?: (Omit<Task, 'createdBy' | 'updatedBy'> & {
    assignee?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  })[];
};

// Optimized task response (excludes createdBy/updatedBy)
export type TaskWithAssignee = Omit<Task, 'createdBy' | 'updatedBy'> & {
  assignee?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  pbi?: Pick<ProductBacklogItem, 'id' | 'title'> | null;
};

// Create sprint data
export interface CreateSprintData {
  teamId: string;
  name: string;
  startDate: string;
  endDate: string;
  sprintGoal?: string;
  goalId?: string;
}

// Create task data
export interface CreateTaskData {
  sprintId: string;
  pbiId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  estimatedHours?: number;
  remainingHours?: number;
}

// Update task data
export interface UpdateTaskData {
  title?: string;
  description?: string;
  assigneeId?: string;
  status?: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
}

// Save Sprint Backlog draft data
export interface SaveSprintBacklogData {
  items?: Array<{ pbiId: string }>;
  tasks?: Array<{
    pbiId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    estimatedHours?: number;
    remainingHours?: number;
  }>;
}

export interface SprintStartResult {
  sprint: Sprint;
  rollbackData: {
    previousPbiStatuses: Map<string, string>;
    createdSprintBacklogItemIds: string[];
    createdTaskIds: string[];
  };
}

// Burndown data
export interface BurndownData {
  dates: string[];
  ideal: number[];
  actual: number[];
}

class SprintService {
  /**
   * Get all sprints for a team
   */
  async getSprints(teamId: string): Promise<Sprint[]> {
    const sprints = await prisma.sprint.findMany({
      where: { teamId },
      select: {
        id: true,
        teamId: true,
        goalId: true,
        name: true,
        startDate: true,
        endDate: true,
        sprintGoal: true,
        status: true,
        cancellationReason: true,
        smNotes: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return sprints;
  }

  /**
   * Get active sprint for a team
   */
  async getActiveSprint(teamId: string): Promise<SprintWithRelations | null> {
    const sprint = await prisma.sprint.findFirst({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        teamId: true,
        goalId: true,
        name: true,
        startDate: true,
        endDate: true,
        sprintGoal: true,
        status: true,
        cancellationReason: true,
        smNotes: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        sprintBacklogItems: {
          select: {
            id: true,
            sprintId: true,
            pbiId: true,
            createdAt: true,
            updatedAt: true,
            pbi: {
              select: {
                id: true,
                teamId: true,
                goalId: true,
                title: true,
                description: true,
                priority: true,
                businessValue: true,
                storyPoints: true,
                status: true,
                labels: true,
                acceptanceCriteria: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            sprintId: true,
            pbiId: true,
            title: true,
            description: true,
            assigneeId: true,
            status: true,
            estimatedHours: true,
            remainingHours: true,
            createdAt: true,
            updatedAt: true,
            assignee: {
              select: { id: true, firstName: true, lastName: true },
            },
            pbi: {
              select: { id: true, title: true, storyPoints: true },
            },
          },
        },
      },
    });

    if (!sprint) {
      return null;
    }

    // Transform to match frontend expectations
    return {
      ...sprint,
      items: sprint.sprintBacklogItems.map((sbi) => sbi.pbi),
    } as SprintWithRelations;
  }

  /**
   * Get sprint by ID
   */
  async getSprintById(sprintId: string): Promise<SprintWithRelations> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        teamId: true,
        goalId: true,
        name: true,
        startDate: true,
        endDate: true,
        sprintGoal: true,
        status: true,
        cancellationReason: true,
        smNotes: true,
        createdAt: true,
        updatedAt: true,
        sprintBacklogItems: {
          select: {
            id: true,
            sprintId: true,
            pbiId: true,
            createdAt: true,
            updatedAt: true,
            pbi: {
              select: {
                id: true,
                teamId: true,
                goalId: true,
                title: true,
                description: true,
                priority: true,
                businessValue: true,
                storyPoints: true,
                status: true,
                labels: true,
                acceptanceCriteria: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            sprintId: true,
            pbiId: true,
            title: true,
            description: true,
            assigneeId: true,
            status: true,
            estimatedHours: true,
            remainingHours: true,
            createdAt: true,
            updatedAt: true,
            assignee: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    return {
      ...sprint,
      items: sprint.sprintBacklogItems.map((sbi) => sbi.pbi),
    } as SprintWithRelations;
  }

  /**
   * Create a new sprint
   */
  async createSprint(userId: string, data: CreateSprintData): Promise<Sprint> {
    // Check if there's an active sprint
    const activeSprint = await prisma.sprint.findFirst({
      where: {
        teamId: data.teamId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (activeSprint) {
      throw new BadRequestError('Cannot create a new sprint while another sprint is active');
    }

    const sprintId = generateUUIDv7();

    const sprint = await prisma.sprint.create({
      data: {
        id: sprintId,
        teamId: data.teamId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        sprintGoal: data.sprintGoal,
        goalId: data.goalId,
        status: 'PLANNED',
        createdBy: userId,
      },
    });

    // Create burndown data points
    await this.initializeBurndownData(
      sprint.id,
      new Date(data.startDate),
      new Date(data.endDate),
      userId
    );

    return sprint;
  }

  /**
   * Persist a Sprint Backlog draft for a PLANNED sprint.
   *
   * During Sprint Planning the Developers decompose the selected PBIs into tasks and
   * self-assign them. This draft is saved before the sprint can start. The operation is:
   * - DEVELOPERS-only (PO/SM are rejected via `assertDeveloperRole`)
   * - self-assignment-only (non-self assignee references are rejected)
   * - idempotent (re-saving replaces the previous draft for the sprint)
   * - status-preserving (the sprint stays `PLANNED`)
   */
  async saveSprintBacklog(
    sprintId: string,
    userId: string,
    data?: SaveSprintBacklogData
  ): Promise<{ sprintId: string; backlogItems: string[]; taskIds: string[] }> {
    // Resolve the sprint by ID. Sprint Planning works against pre-generated sprints
    // (GeneratedSprint), which may not have a real `Sprint` record until it is started.
    // Mirror `startSprint`: fall back to the GeneratedSprint table and materialize the
    // actual `Sprint` so the backlog/tasks can be persisted against a real sprint.
    let sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, teamId: true, status: true },
    });

    if (!sprint) {
      const generatedSprint = await prisma.generatedSprint.findUnique({
        where: { id: sprintId },
      });

      if (!generatedSprint) {
        throw new NotFoundError('Sprint');
      }

      const converted = await this.convertGeneratedSprintToSprint(generatedSprint, userId);
      sprint = { id: converted.id, teamId: converted.teamId, status: converted.status };
    }

    if (sprint.status !== 'PLANNED') {
      throw new BadRequestError(requestT('errors:sprint.notPlanned'));
    }

    // DEVELOPERS-only decomposition: only DEVELOPERS-role members may plan/save the backlog.
    await this.assertDeveloperRole(sprint.teamId, userId);

    const items = data?.items ?? [];
    const tasks = data?.tasks ?? [];

    // Validate self-assignment for every provided task assignment.
    for (const task of tasks) {
      await this.assertSelfAssignmentAllowed(sprint.teamId, userId, task.assigneeId);
    }

    // If any task references a PBI that is not part of the selected backlog, reject it.
    const selectedPbiIds = new Set(items.map((item) => item.pbiId));
    for (const task of tasks) {
      if (task.pbiId && !selectedPbiIds.has(task.pbiId)) {
        throw new BadRequestError(requestT('validation:task.pbiNotInBacklog'));
      }
    }

    const transactionOptions: TransactionOptions = {
      ...TRANSACTION_CONFIG.DEFAULT,
      operationName: 'saveSprintBacklog',
    };

    // Use the resolved sprint ID: when the input was a GeneratedSprint, this is the newly
    // materialized `Sprint.id`, so all backlog/task writes target the real sprint record.
    const resolvedSprintId = sprint.id;

    const result = await withTransaction(async (tx) => {
      // Idempotent replace: clear the existing draft for this sprint, then re-create.
      await tx.sprintBacklogItem.deleteMany({ where: { sprintId: resolvedSprintId } });
      await tx.task.deleteMany({ where: { sprintId: resolvedSprintId } });

      const backlogItemData = items.map((item) => ({
        id: generateUUIDv7(),
        sprintId: resolvedSprintId,
        pbiId: item.pbiId,
        createdBy: userId,
      }));

      if (backlogItemData.length > 0) {
        await tx.sprintBacklogItem.createMany({ data: backlogItemData });
      }

      const tasksData = tasks.map((task) => ({
        id: generateUUIDv7(),
        sprintId: resolvedSprintId,
        pbiId: task.pbiId,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId ?? null,
        estimatedHours: task.estimatedHours,
        remainingHours: task.remainingHours ?? task.estimatedHours,
        status: 'TODO' as TaskStatus,
        createdBy: userId,
      }));

      if (tasksData.length > 0) {
        await tx.task.createMany({ data: tasksData });
      }

      return {
        sprintId: resolvedSprintId,
        backlogItems: backlogItemData.map((item) => item.id),
        taskIds: tasksData.map((task) => task.id),
      };
    }, transactionOptions);

    return result;
  }

  /**
   * Start sprint with comprehensive transaction management
   * All database operations are atomic - either all succeed or all fail
   * Includes rollback data capture for error recovery
   */
  async startSprint(sprintId: string, userId: string): Promise<Sprint> {
    let sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      const generatedSprint = await prisma.generatedSprint.findUnique({
        where: { id: sprintId },
      });

      if (generatedSprint) {
        sprint = await this.convertGeneratedSprintToSprint(generatedSprint, userId);
      } else {
        throw new NotFoundError('Sprint');
      }
    }

    if (sprint.status !== 'PLANNED') {
      throw new BadRequestError(requestT('errors:sprint.notPlanned'));
    }

    // Readiness validation (not role-gated): a Sprint can only start once its Sprint
    // Goal is committed AND a non-empty backlog has been saved during Sprint Planning.
    // The backlog and its decomposed tasks are persisted via `saveSprintBacklog`;
    // the start transition merely consumes what was already planned.
    if (!sprint.sprintGoal?.trim()) {
      throw new BadRequestError(requestT('errors:sprint.missingGoal'));
    }

    const savedBacklog = await prisma.sprintBacklogItem.findMany({
      where: { sprintId: sprint.id },
      select: { pbiId: true },
    });

    if (savedBacklog.length === 0) {
      throw new BadRequestError(requestT('errors:sprint.notReadyToStart'));
    }

    const activeSprint = await prisma.sprint.findFirst({
      where: {
        teamId: sprint.teamId,
        status: 'ACTIVE',
      },
    });

    if (activeSprint) {
      throw new BadRequestError(requestT('errors:sprint.anotherActive'));
    }

    const persistedTasks = await prisma.task.findMany({
      where: { sprintId: sprint.id },
      select: { estimatedHours: true },
    });

    const totalEstimatedHours = persistedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours ?? 0),
      0
    );

    const pbiIds = savedBacklog.map((item) => item.pbiId);

    const transactionOptions: TransactionOptions = {
      ...TRANSACTION_CONFIG.START_SPRINT,
      operationName: 'startSprint',
    };

    const currentSprintId = sprint.id;

    const updatedSprint = await withTransaction(async (tx) => {
      const updated = await tx.sprint.update({
        where: { id: currentSprintId },
        data: { status: 'ACTIVE' },
      });

      // Move every saved backlog PBI to IN_PROGRESS (no task creation happens here —
      // tasks were already persisted by `saveSprintBacklog` during planning).
      if (pbiIds.length > 0) {
        const workflow = await tx.workflow.findFirst({
          where: { entityType: 'BacklogItem' },
        });

        if (workflow) {
          const states = await tx.workflowState.findMany({
            where: { workflowId: workflow.id },
          });

          const readyState = states.find((s) => s.name === 'READY');
          const inProgressState = states.find((s) => s.name === 'IN_PROGRESS');

          for (const pbiId of pbiIds) {
            await tx.productBacklogItem.update({
              where: { id: pbiId },
              data: { status: 'IN_PROGRESS' },
            });

            if (readyState && inProgressState) {
              await tx.statusChangeHistory.create({
                data: {
                  id: generateUUIDv7(),
                  entityType: 'BacklogItem',
                  entityId: pbiId,
                  workflowId: workflow.id,
                  fromStateId: readyState.id,
                  toStateId: inProgressState.id,
                  changedBy: userId,
                  changeReason: 'Sprint started - PBI moved to In Progress',
                  metadata: { source: 'sprint_start' },
                },
              });
            }
          }
        } else {
          await processBatch(
            pbiIds,
            async (pbiId) => {
              await tx.productBacklogItem.update({
                where: { id: pbiId },
                data: { status: 'IN_PROGRESS' },
              });
            },
            5
          );
        }
      }

      await this.reinitializeBurndownDataInTransaction(
        tx,
        currentSprintId,
        totalEstimatedHours,
        userId
      );

      return updated;
    }, transactionOptions);

    return updatedSprint;
  }

  /**
   * Rollback a failed sprint start operation
   * Restores all entities to their previous state
   */
  async rollbackSprintStart(
    sprintId: string,
    rollbackData: {
      previousPbiStatuses: Map<string, string>;
      createdSprintBacklogItemIds: string[];
      createdTaskIds: string[];
    }
  ): Promise<void> {
    await withTransaction(
      async (tx) => {
        await tx.sprint.update({
          where: { id: sprintId },
          data: { status: 'PLANNED' },
        });

        if (rollbackData.createdTaskIds.length > 0) {
          await tx.task.deleteMany({
            where: { id: { in: rollbackData.createdTaskIds } },
          });
        }

        if (rollbackData.createdSprintBacklogItemIds.length > 0) {
          await tx.sprintBacklogItem.deleteMany({
            where: { id: { in: rollbackData.createdSprintBacklogItemIds } },
          });
        }

        for (const [pbiId, previousStatus] of rollbackData.previousPbiStatuses) {
          await tx.productBacklogItem.update({
            where: { id: pbiId },
            data: { status: previousStatus as ItemStatus },
          });
        }

        await tx.burndownData.deleteMany({
          where: { sprintId },
        });
      },
      { ...TRANSACTION_CONFIG.DEFAULT, operationName: 'rollbackSprintStart' }
    );
  }

  /**
   * Determine which PBIs (among the given candidate PBIs) do NOT satisfy the team's
   * Definition of Done. A PBI is compliant only when every active DoD item is verified.
   * A team with no active DoD items has no gate to satisfy (vacuously compliant), so all
   * candidate PBIs are considered compliant.
   *
   * Runs against the transaction client so the gate is atomic with the status write.
   */
  private async findPBIsWithoutFullDoD(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    teamId: string,
    pbiIds: string[]
  ): Promise<string[]> {
    const dod = await tx.definitionOfDone.findUnique({
      where: { teamId },
      select: {
        items: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const activeDodItemIds = (dod?.items ?? []).map((item) => item.id);
    if (activeDodItemIds.length === 0) {
      return [];
    }

    const verifiedRows = await tx.doDChecklistVerification.findMany({
      where: {
        pbiId: { in: pbiIds },
        dodItemId: { in: activeDodItemIds },
        isVerified: true,
      },
      select: { pbiId: true, dodItemId: true },
    });

    const verifiedMap = new Map<string, Set<string>>();
    for (const row of verifiedRows) {
      const set = verifiedMap.get(row.pbiId) ?? new Set<string>();
      set.add(row.dodItemId);
      verifiedMap.set(row.pbiId, set);
    }

    const activeDodIdSet = new Set(activeDodItemIds);
    return pbiIds.filter((pbiId) => {
      const verified = verifiedMap.get(pbiId) ?? new Set<string>();
      return !Array.from(activeDodIdSet).every((dodItemId) => verified.has(dodItemId));
    });
  }

  /**
   * Reinitialize burndown data within a transaction
   * This ensures burndown data is created atomically with sprint start
   */
  private async reinitializeBurndownDataInTransaction(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    sprintId: string,
    totalHours: number,
    userId: string
  ): Promise<void> {
    const sprint = await tx.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) return;

    await tx.burndownData.deleteMany({
      where: { sprintId },
    });

    const days = this.getWorkingDays(sprint.startDate, sprint.endDate);
    const totalDays = days.length;
    const dailyBurn = totalDays > 0 ? totalHours / totalDays : 0;

    const data = days.map((date, index) => ({
      id: generateUUIDv7(),
      sprintId,
      date,
      idealRemaining: Math.max(0, totalHours - dailyBurn * index),
      actualRemaining: index === 0 ? totalHours : null,
      createdBy: userId,
    }));

    await tx.burndownData.createMany({ data });
  }

  /**
   * Convert a GeneratedSprint to an actual Sprint
   */
  private async convertGeneratedSprintToSprint(
    generatedSprint: GeneratedSprint,
    userId?: string
  ): Promise<Sprint> {
    if (generatedSprint.sprintId) {
      const existingSprint = await prisma.sprint.findUnique({
        where: { id: generatedSprint.sprintId },
      });
      if (existingSprint) {
        return existingSprint;
      }
    }

    const sprintId = generateUUIDv7();
    const creatorId = userId ?? generatedSprint.createdBy ?? 'system';

    // Link the team's active Product Goal (if any) so the Sprint Review page can
    // surface Product Goal progress during the review.
    const activeGoal = await prisma.productGoal.findFirst({
      where: {
        teamId: generatedSprint.teamId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const sprint = await prisma.sprint.create({
      data: {
        id: sprintId,
        teamId: generatedSprint.teamId,
        name: generatedSprint.name,
        startDate: generatedSprint.startDate,
        endDate: generatedSprint.endDate,
        sprintGoal: generatedSprint.sprintGoal,
        goalId: activeGoal?.id ?? null,
        status: 'PLANNED',
        createdBy: creatorId,
      },
    });

    await this.initializeBurndownData(
      sprint.id,
      generatedSprint.startDate,
      generatedSprint.endDate,
      creatorId
    );

    await prisma.generatedSprint.update({
      where: { id: generatedSprint.id },
      data: { sprintId: sprint.id },
    });

    return sprint;
  }

  /**
   * Complete sprint with PBI status updates
   * PBIs with all tasks DONE will be automatically updated to DONE status.
   *
   * A PBI is only auto-advanced to `DONE` when EVERY one of its tasks is `DONE`.
   * Any task in `REVIEW` (awaiting peer review) is not complete, so it deliberately
   * blocks PBI auto-completion until it is approved to `DONE`.
   */
  async completeSprint(sprintId: string, userId?: string): Promise<Sprint> {
    const sprint = await this.getSprintById(sprintId);

    if (sprint.status !== 'ACTIVE') {
      throw new BadRequestError('Only active sprints can be completed');
    }

    const [sprintBacklogItems, tasks] = await Promise.all([
      prisma.sprintBacklogItem.findMany({
        where: { sprintId },
        select: {
          id: true,
          sprintId: true,
          pbiId: true,
          createdAt: true,
          updatedAt: true,
          pbi: {
            select: {
              id: true,
              title: true,
              status: true,
              storyPoints: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        where: { sprintId },
        select: {
          id: true,
          pbiId: true,
          status: true,
        },
      }),
    ]);

    const pbiTaskStatusMap = new Map<
      string,
      { tasks: Array<{ id: string; pbiId: string; status: TaskStatus }>; allDone: boolean }
    >();

    for (const task of tasks) {
      const entry = pbiTaskStatusMap.get(task.pbiId) ?? {
        tasks: [],
        allDone: true,
      };
      entry.tasks.push(task);
      // Any task not in `DONE` — including `REVIEW` (awaiting peer review) — counts as
      // incomplete, so a PBI with a task in `REVIEW` is intentionally NOT auto-completed.
      if (task.status !== 'DONE') entry.allDone = false;
      pbiTaskStatusMap.set(task.pbiId, entry);
    }

    const pbiIdsToUpdate: string[] = [];
    const pbiUpdates: { pbiId: string; fromStatus: string }[] = [];

    for (const item of sprintBacklogItems) {
      const statusInfo = pbiTaskStatusMap.get(item.pbiId);
      if (statusInfo?.allDone && statusInfo.tasks.length > 0 && item.pbi.status !== 'DONE') {
        pbiIdsToUpdate.push(item.pbi.id);
        pbiUpdates.push({ pbiId: item.pbi.id, fromStatus: item.pbi.status });
      }
    }

    const workflow = await prisma.workflow.findFirst({
      where: { entityType: 'BacklogItem' },
      select: { id: true },
    });

    const teamId = sprint.teamId;

    const updatedSprint = await withTransaction(
      async (tx) => {
        // Definition of Done is the gate to "Done": a PBI whose tasks are all DONE may only be
        // marked DONE if every active DoD item is verified for it. This is enforced inside the
        // same transaction as the status write so a direct API call cannot bypass the gate.
        if (pbiIdsToUpdate.length > 0) {
          const nonCompliantPbiIds = await this.findPBIsWithoutFullDoD(tx, teamId, pbiIdsToUpdate);

          if (nonCompliantPbiIds.length > 0) {
            throw new BadRequestError(
              `Sprint cannot be completed because the Definition of Done is not met for PBI(s): ${nonCompliantPbiIds.join(', ')}. Verify all Definition of Done items for these items before completing the sprint.`
            );
          }
        }

        const sprint = await tx.sprint.update({
          where: { id: sprintId },
          data: { status: 'COMPLETED' },
        });

        if (pbiIdsToUpdate.length > 0) {
          await tx.productBacklogItem.updateMany({
            where: { id: { in: pbiIdsToUpdate } },
            data: {
              status: 'DONE',
              updatedBy: userId,
            },
          });

          if (workflow) {
            const states = await tx.workflowState.findMany({
              where: { workflowId: workflow.id },
            });

            const inProgressState = states.find((s) => s.name === 'IN_PROGRESS');
            const doneState = states.find((s) => s.name === 'DONE');

            if (inProgressState && doneState) {
              for (const update of pbiUpdates) {
                await tx.statusChangeHistory.create({
                  data: {
                    id: generateUUIDv7(),
                    entityType: 'BacklogItem',
                    entityId: update.pbiId,
                    workflowId: workflow.id,
                    fromStateId: inProgressState.id,
                    toStateId: doneState.id,
                    changedBy: userId ?? 'system',
                    changeReason: 'Sprint completed - All tasks done',
                    metadata: { source: 'sprint_completion' },
                  },
                });
              }
            }
          }
        }

        return sprint;
      },
      { ...TRANSACTION_CONFIG.DEFAULT, operationName: 'completeSprint' }
    );

    return updatedSprint;
  }

  /**
   * Cancel sprint
   */
  async cancelSprint(sprintId: string, reason: string): Promise<Sprint> {
    const sprint = await this.getSprintById(sprintId);

    if (sprint.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel a completed sprint');
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    return updatedSprint;
  }

  /**
   * Get burndown data
   */
  async getBurndownData(sprintId: string): Promise<BurndownData> {
    const data = await prisma.burndownData.findMany({
      where: { sprintId },
      select: {
        id: true,
        date: true,
        idealRemaining: true,
        actualRemaining: true,
      },
      orderBy: { date: 'asc' },
    });

    return {
      dates: data.map((d) => d.date.toISOString().split('T')[0] as string),
      ideal: data.map((d) => d.idealRemaining),
      actual: data.map((d) => d.actualRemaining ?? 0),
    };
  }

  /**
   * Get sprint tasks
   */
  async getSprintTasks(sprintId: string): Promise<TaskWithAssignee[]> {
    const tasks = await prisma.task.findMany({
      where: { sprintId },
      select: {
        id: true,
        sprintId: true,
        pbiId: true,
        title: true,
        description: true,
        assigneeId: true,
        status: true,
        estimatedHours: true,
        remainingHours: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
        pbi: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return tasks;
  }

  /**
   * Get tasks by PBI ID
   */
  async getTasksByPbiId(pbiId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { pbiId },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
        pbi: {
          select: { id: true, title: true, status: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return tasks;
  }

  /**
   * Assert that the acting user is a `DEVELOPERS`-role team member for the given team.
   * Resolves the user's `TeamMember` role and throws `ForbiddenError` when the role is
   * not `DEVELOPERS`. This is the backbone of Developers-only task decomposition.
   */
  private async assertDeveloperRole(teamId: string, userId: string): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: { teamId, userId },
      select: { role: true },
    });

    if (!teamMember) {
      throw new ForbiddenError(requestT('errors:notTeamMember'));
    }

    if (teamMember.role !== 'DEVELOPERS') {
      throw new ForbiddenError(requestT('errors:task.creationRequiresDeveloper'));
    }
  }

  /**
   * Assert that an assignee reference is either absent (unassigned) or the acting user
   * themselves. A Developer may self-assign or clear an assignment, but may never assign
   * work to another team member, and PO/SM must never assign anyone.
   */
  private async assertSelfAssignmentAllowed(
    teamId: string,
    userId: string,
    assigneeId?: string | null
  ): Promise<void> {
    if (!assigneeId) return;

    await this.assertDeveloperRole(teamId, userId);

    if (assigneeId !== userId) {
      throw new ForbiddenError(requestT('errors:task.cannotAssignOtherDeveloper'));
    }
  }

  /**
   * Create task
   */
  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    const taskId = generateUUIDv7();
    const initialStatus: TaskStatus = 'TODO';

    // Developers-only decomposition: only DEVELOPERS-role members may create tasks.
    // If an assignee is supplied it must be the acting user themselves (self-assignment).
    const sprint = await prisma.sprint.findUnique({
      where: { id: data.sprintId },
      select: { teamId: true },
    });
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }
    await this.assertDeveloperRole(sprint.teamId, userId);
    await this.assertSelfAssignmentAllowed(sprint.teamId, userId, data.assigneeId);

    const task = await prisma.task.create({
      data: {
        id: taskId,
        sprintId: data.sprintId,
        pbiId: data.pbiId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        estimatedHours: data.estimatedHours,
        remainingHours: data.remainingHours ?? data.estimatedHours,
        status: initialStatus,
        createdBy: userId,
      },
      include: {
        sprint: {
          include: {
            team: true,
          },
        },
      },
    });

    // Record initial status in workflow history
    try {
      const teamMember = await prisma.teamMember.findFirst({
        where: { teamId: task.sprint.teamId, userId },
      });

      await workflowService.executeStatusChange({
        entityType: 'Task',
        entityId: taskId,
        fromStatus: null,
        toStatus: initialStatus,
        userId,
        userRoles: teamMember ? [teamMember.role] : [],
        changeReason: 'Initial task creation',
        metadata: {
          sprintId: data.sprintId,
          pbiId: data.pbiId,
          title: data.title,
        },
      });
    } catch (error) {
      logger.error('Failed to record initial status change history for task', { error });
    }

    // Create notification if assignee is set and not the creator
    if (data.assigneeId && data.assigneeId !== userId) {
      try {
        await notificationService.createLocalized({
          userId: data.assigneeId,
          type: NotificationType.TASK_ASSIGNMENT,
          titleKey: 'newTaskAssignedTitle',
          titleParams: { taskTitle: task.title },
          messageKey: 'newTaskAssignedMessage',
          messageParams: { taskTitle: task.title, sprintName: task.sprint.name },
          data: {
            taskId: task.id,
            sprintId: task.sprintId,
            pbiId: task.pbiId,
          },
          createdBy: userId,
        });
      } catch (error) {
        logger.error('Failed to create task assignment notification', {
          error,
        });
      }
    }

    return task;
  }

  /**
   * Update task
   */
  async updateTask(
    sprintId: string,
    taskId: string,
    data: UpdateTaskData,
    userId?: string
  ): Promise<Task> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, sprintId },
      include: {
        sprint: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Self-managed assignment: apply the self-assignment guard ONLY when the change
    // actually carries `assigneeId` and its value differs from the current assignee.
    // Status/estimate-only updates are unaffected and remain open to all team members.
    if (userId && 'assigneeId' in data && data.assigneeId !== task.assigneeId) {
      await this.assertSelfAssignmentAllowed(task.sprint.teamId, userId, data.assigneeId);
    }

    if (data.status && data.status !== task.status && userId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: task.sprint.teamId,
          userId,
        },
      });

      if (!teamMember) {
        throw new BadRequestError('You are not a member of this team');
      }

      // The REVIEW → DONE approval step must be performed by a team member other than the
      // task's assignee. The assignee may request review and rework but cannot self-approve.
      // An unassigned task (assigneeId === null) has no one to exclude, so any developer may
      // approve it. This is an authorization failure, hence ForbiddenError.
      if (
        task.status === 'REVIEW' &&
        data.status === 'DONE' &&
        userId &&
        task.assigneeId !== null &&
        task.assigneeId === userId
      ) {
        throw new ForbiddenError(requestT('validation:task.cannotApproveOwnReview'));
      }

      const userRoles = [teamMember.role];

      const validationResult = await workflowService.validateTransition(
        'Task',
        task.status,
        data.status,
        userId,
        userRoles
      );

      if (!validationResult.isValid) {
        throw new BadRequestError(validationResult.reason ?? 'Invalid status transition');
      }

      if (!validationResult.allowed) {
        throw new BadRequestError(validationResult.reason ?? 'Status transition not allowed');
      }
    }

    if (data.status === 'DONE') {
      data.remainingHours = 0;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    if (data.status && data.status !== task.status && userId) {
      try {
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: task.sprint.teamId,
            userId,
          },
        });

        if (teamMember) {
          await workflowService.executeStatusChange({
            entityType: 'Task',
            entityId: taskId,
            fromStatus: task.status,
            toStatus: data.status,
            userId,
            userRoles: [teamMember.role],
            changeReason: 'Task status updated',
            metadata: {
              previousStatus: task.status,
              newStatus: data.status,
              remainingHours: data.remainingHours,
            },
          });
        }
      } catch (error) {
        logger.error('Failed to record status change history', { error });
      }
    }

    if (data.remainingHours !== undefined || data.status !== undefined) {
      await this.updateBurndownData(sprintId);
    }

    // Create notification if assignee changed
    if (data.assigneeId && data.assigneeId !== task.assigneeId && userId) {
      if (data.assigneeId !== userId) {
        try {
          await notificationService.createLocalized({
            userId: data.assigneeId,
            type: NotificationType.TASK_ASSIGNMENT,
            titleKey: 'taskReassignedTitle',
            titleParams: { taskTitle: task.title },
            messageKey: 'taskReassignedMessage',
            messageParams: { taskTitle: task.title, sprintName: task.sprint.name },
            data: {
              taskId: task.id,
              sprintId: task.sprintId,
              pbiId: task.pbiId,
            },
            createdBy: userId,
          });
        } catch (error) {
          logger.error('Failed to create task reassignment notification', {
            error,
          });
        }
      }
    }

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(sprintId: string, taskId: string): Promise<void> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, sprintId },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await this.updateBurndownData(sprintId);
  }

  /**
   * Initialize burndown data for a sprint
   */
  private async initializeBurndownData(
    sprintId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    totalHours: number = 0
  ): Promise<void> {
    const days = this.getWorkingDays(startDate, endDate);
    const totalDays = days.length;
    const dailyBurn = totalDays > 0 ? totalHours / totalDays : 0;

    const data = days.map((date, index) => ({
      id: generateUUIDv7(),
      sprintId,
      date,
      idealRemaining: Math.max(0, totalHours - dailyBurn * index),
      actualRemaining: index === 0 ? totalHours : null,
      createdBy: userId,
    }));

    await prisma.burndownData.createMany({ data });
  }

  /**
   * Update burndown data for today
   */
  async updateBurndownData(sprintId: string): Promise<void> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { status: true, startDate: true, endDate: true },
    });

    if (sprint?.status !== 'ACTIVE') {
      return;
    }

    const [tasks, todayStart, todayEnd] = await Promise.all([
      prisma.task.findMany({
        where: { sprintId },
        select: { remainingHours: true, estimatedHours: true },
      }),
      Promise.resolve(this.getStartOfDay(new Date())),
      Promise.resolve(this.getEndOfDay(new Date())),
    ]);

    const totalRemainingHours = tasks.reduce(
      (sum, task) => sum + (task.remainingHours ?? task.estimatedHours ?? 0),
      0
    );

    const existingRecord = await prisma.burndownData.findFirst({
      where: {
        sprintId,
        date: { gte: todayStart, lt: todayEnd },
      },
    });

    if (existingRecord) {
      await prisma.burndownData.update({
        where: { id: existingRecord.id },
        data: { actualRemaining: totalRemainingHours },
      });
    } else {
      const startDate = this.getStartOfDay(new Date(sprint.startDate));

      const days = this.getWorkingDays(startDate, new Date(sprint.endDate));
      const dayIndex = days.findIndex((d) => {
        const dayStart = this.getStartOfDay(d);
        return dayStart.getTime() === todayStart.getTime();
      });

      if (dayIndex >= 0) {
        const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0);
        const totalDays = days.length;
        const dailyBurn = totalDays > 0 ? totalHours / totalDays : 0;

        await prisma.burndownData.create({
          data: {
            id: generateUUIDv7(),
            sprintId,
            date: todayStart,
            idealRemaining: Math.max(0, totalHours - dailyBurn * dayIndex),
            actualRemaining: totalRemainingHours,
            createdBy: null, // System-generated data has no specific creator
          },
        });
      }
    }
  }

  /**
   * Get start of day (00:00:00.000)
   */
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day (23:59:59.999)
   */
  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Get working days between two dates (excluding weekends)
   */
  private getWorkingDays(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }
}

export const sprintService = new SprintService();

const incrementSprintService = {
  async getEligiblePBIsForIncrement(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintBacklogItems: {
          include: {
            pbi: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const donePBIs = sprint.sprintBacklogItems
      .filter((sbi) => sbi.pbi.status === 'DONE')
      .map((sbi) => ({
        id: sbi.pbi.id,
        title: sbi.pbi.title,
        description: sbi.pbi.description,
        storyPoints: sbi.pbi.storyPoints,
        estimate: sbi.pbi.storyPoints,
        status: sbi.pbi.status,
        labels: sbi.pbi.labels,
      }));

    return donePBIs;
  },

  async getSprintBacklogPBIs(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintBacklogItems: {
          include: {
            pbi: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const allPBIs = sprint.sprintBacklogItems.map((sbi) => ({
      id: sbi.pbi.id,
      title: sbi.pbi.title,
      description: sbi.pbi.description,
      storyPoints: sbi.pbi.storyPoints,
      estimate: sbi.pbi.storyPoints,
      status: sbi.pbi.status,
      labels: sbi.pbi.labels,
    }));

    return allPBIs;
  },
};

export interface SprintBacklogChange {
  id: string;
  sprintId: string;
  pbiId: string;
  pbiTitle: string;
  changeType: 'ADDED' | 'REMOVED';
  reason?: string;
  changedBy: string;
  changedByName: string;
  createdAt: Date;
}

export interface AddPBIToSprintData {
  pbiId: string;
  reason?: string;
}

export interface RemovePBIFromSprintData {
  taskAction: 'delete' | 'return_to_backlog' | 'keep_in_sprint';
  reason?: string;
}

class SprintBacklogManagerService {
  async addPBIToActiveSprint(
    sprintId: string,
    userId: string,
    data: AddPBIToSprintData
  ): Promise<{
    sprintBacklogItem: SprintBacklogItem & { pbi: ProductBacklogItem };
    change: SprintBacklogChange;
  }> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintBacklogItems: true,
      },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    if (sprint.status !== 'ACTIVE') {
      throw new BadRequestError('Can only add items to an active sprint');
    }

    const existingItem = sprint.sprintBacklogItems.find((item) => item.pbiId === data.pbiId);
    if (existingItem) {
      throw new BadRequestError('PBI is already in the sprint backlog');
    }

    const pbi = await prisma.productBacklogItem.findUnique({
      where: { id: data.pbiId },
    });

    if (!pbi) {
      throw new NotFoundError('Product Backlog Item');
    }

    if (pbi.teamId !== sprint.teamId) {
      throw new BadRequestError('PBI does not belong to the same team as the sprint');
    }

    if (pbi.status !== 'READY') {
      throw new BadRequestError('PBI must be in READY status to be added to sprint');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const result = await withTransaction(
      async (tx) => {
        const sprintBacklogItem = await tx.sprintBacklogItem.create({
          data: {
            id: generateUUIDv7(),
            sprintId,
            pbiId: data.pbiId,
            createdBy: userId,
          },
          include: {
            pbi: true,
          },
        });

        await tx.productBacklogItem.update({
          where: { id: data.pbiId },
          data: { status: 'IN_PROGRESS' },
        });

        const workflow = await tx.workflow.findFirst({
          where: { entityType: 'BacklogItem' },
        });

        if (workflow) {
          const states = await tx.workflowState.findMany({
            where: { workflowId: workflow.id },
          });

          const readyState = states.find((s) => s.name === 'READY');
          const inProgressState = states.find((s) => s.name === 'IN_PROGRESS');

          if (readyState && inProgressState) {
            await tx.statusChangeHistory.create({
              data: {
                id: generateUUIDv7(),
                entityType: 'BacklogItem',
                entityId: data.pbiId,
                workflowId: workflow.id,
                fromStateId: readyState.id,
                toStateId: inProgressState.id,
                changedBy: userId,
                changeReason: data.reason ?? 'PBI added to active sprint',
                metadata: { source: 'sprint_backlog_addition' },
              },
            });
          }
        }

        let changeRecord: {
          id: string;
          pbi?: { title: string } | null;
          creator?: { firstName: string; lastName: string } | null;
          createdAt: Date;
        } | null = null;
        // Check if sprintBacklogChange model exists (requires migration)
        const txWithSprintBacklogChange = tx as Prisma.TransactionClient & {
          sprintBacklogChange?: {
            create: (args: {
              data: {
                id: string;
                sprintId: string;
                pbiId: string;
                sprintBacklogItemId: string;
                changeType: string;
                reason?: string;
                previousStatus: string;
                newStatus: string;
                taskCount: number;
                createdBy: string;
              };
              include: {
                pbi: { select: { title: true } };
                creator: { select: { firstName: true; lastName: true } };
              };
            }) => Promise<{
              id: string;
              pbi?: { title: string } | null;
              creator?: { firstName: string; lastName: string } | null;
              createdAt: Date;
            }>;
          };
        };
        if ('sprintBacklogChange' in txWithSprintBacklogChange) {
          try {
            changeRecord = await txWithSprintBacklogChange.sprintBacklogChange.create({
              data: {
                id: generateUUIDv7(),
                sprintId,
                pbiId: data.pbiId,
                sprintBacklogItemId: sprintBacklogItem.id,
                changeType: 'ADDED',
                reason: data.reason,
                previousStatus: 'READY',
                newStatus: 'IN_PROGRESS',
                taskCount: 0,
                createdBy: userId,
              },
              include: {
                pbi: { select: { title: true } },
                creator: { select: { firstName: true, lastName: true } },
              },
            });
          } catch (e) {
            logger.warn('Failed to create SprintBacklogChange record', {
              error: e,
            });
          }
        }

        const change: SprintBacklogChange = {
          id: changeRecord?.id ?? generateUUIDv7(),
          sprintId,
          pbiId: data.pbiId,
          pbiTitle: changeRecord?.pbi?.title ?? pbi.title,
          changeType: 'ADDED',
          reason: data.reason,
          changedBy: userId,
          changedByName: changeRecord?.creator
            ? `${changeRecord.creator.firstName} ${changeRecord.creator.lastName}`.trim()
            : user
              ? `${user.firstName} ${user.lastName}`.trim()
              : 'Unknown',
          createdAt: changeRecord?.createdAt ?? new Date(),
        };

        return { sprintBacklogItem, change };
      },
      { ...TRANSACTION_CONFIG.DEFAULT, operationName: 'addPBIToActiveSprint' }
    );

    await this.updateBurndownData(sprintId);

    return result;
  }

  async removePBIFromActiveSprint(
    sprintId: string,
    pbiId: string,
    userId: string,
    data: RemovePBIFromSprintData
  ): Promise<{ change: SprintBacklogChange }> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintBacklogItems: {
          where: { pbiId },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    if (sprint.status !== 'ACTIVE') {
      throw new BadRequestError('Can only remove items from an active sprint');
    }

    const sprintBacklogItem = sprint.sprintBacklogItems[0];
    if (!sprintBacklogItem) {
      throw new NotFoundError('Sprint Backlog Item');
    }

    const pbi = await prisma.productBacklogItem.findUnique({
      where: { id: pbiId },
    });

    if (!pbi) {
      throw new NotFoundError('Product Backlog Item');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const tasks = await prisma.task.findMany({
      where: { sprintId, pbiId },
    });

    const result = await withTransaction(
      async (tx) => {
        await tx.sprintBacklogItem.delete({
          where: { id: sprintBacklogItem.id },
        });

        if (data.taskAction === 'delete' || data.taskAction === 'return_to_backlog') {
          await tx.task.deleteMany({
            where: { sprintId, pbiId },
          });
        }

        const newStatus = data.taskAction === 'return_to_backlog' ? 'READY' : pbi.status;
        await tx.productBacklogItem.update({
          where: { id: pbiId },
          data: { status: newStatus as ItemStatus },
        });

        if (newStatus !== pbi.status) {
          const workflow = await tx.workflow.findFirst({
            where: { entityType: 'BacklogItem' },
          });

          if (workflow) {
            const states = await tx.workflowState.findMany({
              where: { workflowId: workflow.id },
            });

            const fromStateName = pbi.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : pbi.status;
            const toStateName = newStatus === 'READY' ? 'READY' : newStatus;

            const fromState = states.find((s) => s.name === fromStateName);
            const toState = states.find((s) => s.name === toStateName);

            if (fromState && toState) {
              await tx.statusChangeHistory.create({
                data: {
                  id: generateUUIDv7(),
                  entityType: 'BacklogItem',
                  entityId: pbiId,
                  workflowId: workflow.id,
                  fromStateId: fromState.id,
                  toStateId: toState.id,
                  changedBy: userId,
                  changeReason: data.reason ?? 'PBI removed from sprint',
                  metadata: {
                    source: 'sprint_backlog_removal',
                    taskAction: data.taskAction,
                  },
                },
              });
            }
          }
        }

        let changeRecord: {
          id: string;
          pbi?: { title: string } | null;
          creator?: { firstName: string; lastName: string } | null;
          createdAt: Date;
        } | null = null;
        // Check if sprintBacklogChange model exists (requires migration)
        const txWithSprintBacklogChange = tx as Prisma.TransactionClient & {
          sprintBacklogChange?: {
            create: (args: {
              data: {
                id: string;
                sprintId: string;
                pbiId: string;
                sprintBacklogItemId: string | null;
                changeType: string;
                reason?: string;
                previousStatus: string;
                newStatus: string;
                taskAction?: string;
                taskCount: number;
                createdBy: string;
              };
              include: {
                pbi: { select: { title: true } };
                creator: { select: { firstName: true; lastName: true } };
              };
            }) => Promise<{
              id: string;
              pbi?: { title: string } | null;
              creator?: { firstName: string; lastName: string } | null;
              createdAt: Date;
            }>;
          };
        };
        if ('sprintBacklogChange' in txWithSprintBacklogChange) {
          try {
            changeRecord = await txWithSprintBacklogChange.sprintBacklogChange.create({
              data: {
                id: generateUUIDv7(),
                sprintId,
                pbiId,
                sprintBacklogItemId: null,
                changeType: 'REMOVED',
                reason: data.reason,
                previousStatus: pbi.status,
                newStatus,
                taskAction: data.taskAction,
                taskCount: tasks.length,
                createdBy: userId,
              },
              include: {
                pbi: { select: { title: true } },
                creator: { select: { firstName: true, lastName: true } },
              },
            });
          } catch (e) {
            logger.warn('Failed to create SprintBacklogChange record', {
              error: e,
            });
          }
        }

        const change: SprintBacklogChange = {
          id: changeRecord?.id ?? generateUUIDv7(),
          sprintId,
          pbiId,
          pbiTitle: changeRecord?.pbi?.title ?? pbi.title,
          changeType: 'REMOVED',
          reason: data.reason,
          changedBy: userId,
          changedByName: changeRecord?.creator
            ? `${changeRecord.creator.firstName} ${changeRecord.creator.lastName}`.trim()
            : user
              ? `${user.firstName} ${user.lastName}`.trim()
              : 'Unknown',
          createdAt: changeRecord?.createdAt ?? new Date(),
        };

        return { change };
      },
      { ...TRANSACTION_CONFIG.DEFAULT, operationName: 'removePBIFromActiveSprint' }
    );

    await this.updateBurndownData(sprintId);

    return result;
  }

  async getSprintBacklogChanges(
    sprintId: string,
    limit: number = 20
  ): Promise<SprintBacklogChange[]> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    // Check if sprintBacklogChange model exists (requires migration)
    const prismaWithSprintBacklogChange = prisma as typeof prisma & {
      sprintBacklogChange?: {
        findMany: (args: {
          where: { sprintId: string };
          include: {
            pbi: { select: { title: true } };
            creator: { select: { firstName: true; lastName: true } };
          };
          orderBy: { createdAt: 'desc' };
          take: number;
        }) => Promise<
          Array<{
            id: string;
            sprintId: string;
            pbiId: string;
            changeType: string;
            reason?: string | null;
            createdBy?: string | null;
            createdAt: Date;
            pbi?: { title: string } | null;
            creator?: { firstName: string; lastName: string } | null;
          }>
        >;
      };
    };
    if (!('sprintBacklogChange' in prismaWithSprintBacklogChange)) {
      logger.warn('SprintBacklogChange table not found. Please run: npx prisma migrate dev');
      return [];
    }

    try {
      const changeRecords = await prismaWithSprintBacklogChange.sprintBacklogChange.findMany({
        where: { sprintId },
        include: {
          pbi: { select: { title: true } },
          creator: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const changes: SprintBacklogChange[] = changeRecords.map((record) => ({
        id: record.id,
        sprintId: record.sprintId,
        pbiId: record.pbiId,
        pbiTitle: record.pbi.title || 'Unknown',
        changeType: record.changeType as 'ADDED' | 'REMOVED',
        reason: record.reason ?? undefined,
        changedBy: record.createdBy ?? 'system',
        changedByName: record.creator
          ? `${record.creator.firstName} ${record.creator.lastName}`.trim()
          : 'System',
        createdAt: record.createdAt,
      }));

      return changes;
    } catch (error: unknown) {
      logger.error('Error fetching sprint backlog changes', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getAvailablePBIsForSprint(teamId: string): Promise<ProductBacklogItem[]> {
    const activeSprint = await prisma.sprint.findFirst({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      include: {
        sprintBacklogItems: {
          select: { pbiId: true },
        },
      },
    });

    const excludePbiIds = activeSprint?.sprintBacklogItems.map((item) => item.pbiId) ?? [];

    const pbis = await prisma.productBacklogItem.findMany({
      where: {
        teamId,
        status: 'READY',
        id: { notIn: excludePbiIds },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    return pbis;
  }

  private async updateBurndownData(sprintId: string): Promise<void> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (sprint?.status !== 'ACTIVE') {
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { sprintId },
    });

    const totalRemainingHours = tasks.reduce(
      (sum, task) => sum + (task.remainingHours ?? task.estimatedHours ?? 0),
      0
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await prisma.burndownData.findFirst({
      where: {
        sprintId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingRecord) {
      await prisma.burndownData.update({
        where: { id: existingRecord.id },
        data: { actualRemaining: totalRemainingHours },
      });
    }
  }
}

export const sprintBacklogManagerService = new SprintBacklogManagerService();
export { incrementSprintService };
export default sprintService;
