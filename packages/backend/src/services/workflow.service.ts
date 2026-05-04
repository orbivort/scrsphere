// Workflow Management Service
// Handles workflow configuration, validation, and status change tracking
import prisma from '../utils/prisma';
import { type Prisma } from '../generated/prisma/client';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { WorkflowLockService } from './workflow-lock.service';
import logger from '../utils/logger';

// Workflow Types
export interface Workflow {
  id: string;
  entityType: string;
  name: string;
  description: string | null;
  isActive: boolean;
  defaultStatus: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowState {
  id: string;
  workflowId: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isFinal: boolean;
  orderIndex: number;
  createdAt: Date;
}

export interface WorkflowTransition {
  id: string;
  workflowId: string;
  fromStateId: string;
  toStateId: string;
  condition: string | null;
  requiresApproval: boolean;
  allowedRoles: string[];
  allowedUserIds: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface StatusChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  workflowId: string;
  fromStateId: string | null;
  toStateId: string;
  changedBy: string;
  changeReason: string | null;
  changeNotes: string | null;
  transitionId: string | null;
  metadata: any;
  createdAt: Date;
}

export interface WorkflowWithStates extends Workflow {
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface TransitionValidationResult {
  isValid: boolean;
  allowed: boolean;
  reason?: string;
  transition?: WorkflowTransition;
}

export interface StatusChangeRequest {
  entityType: string;
  entityId: string;
  fromStatus: string | null;
  toStatus: string;
  userId: string;
  userRoles: string[];
  changeReason?: string;
  changeNotes?: string;
  metadata?: any;
}

// Default workflow state configuration
interface DefaultStateConfig {
  name: string;
  displayName: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isFinal: boolean;
  orderIndex: number;
}

// Default workflow transition configuration
interface DefaultTransitionConfig {
  fromState: string;
  toState: string;
  requiresApproval: boolean;
  allowedRoles: string[];
  allowedUserIds: string[];
}

// Default workflow configuration
interface DefaultWorkflowConfig {
  name: string;
  description: string;
  defaultStatus: string;
  states: DefaultStateConfig[];
  transitions: DefaultTransitionConfig[];
}

// Constants for lazy initialization
const MAX_INITIALIZATION_RETRIES = 3;
const INITIALIZATION_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 300000; // 5 minutes

class WorkflowService {
  static readonly DEFAULT_WORKFLOW_CONFIGS: Record<string, DefaultWorkflowConfig> = {
    ProductGoal: {
      name: 'Product Goal Workflow',
      description: 'Default workflow for product goals',
      defaultStatus: 'NEW',
      states: [
        {
          name: 'NEW',
          displayName: 'New',
          description: 'Newly created product goal',
          color: '#6B7280',
          icon: 'flag',
          isFinal: false,
          orderIndex: 1,
        },
        {
          name: 'ACTIVE',
          displayName: 'Active',
          description: 'Product goal is being actively worked on',
          color: '#3B82F6',
          icon: 'play',
          isFinal: false,
          orderIndex: 2,
        },
        {
          name: 'COMPLETED',
          displayName: 'Completed',
          description: 'Product goal has been achieved',
          color: '#10B981',
          icon: 'check',
          isFinal: true,
          orderIndex: 3,
        },
        {
          name: 'ABANDONED',
          displayName: 'Abandoned',
          description: 'Product goal was abandoned',
          color: '#EF4444',
          icon: 'x',
          isFinal: true,
          orderIndex: 4,
        },
      ],
      transitions: [
        {
          fromState: 'NEW',
          toState: 'ACTIVE',
          requiresApproval: false,
          allowedRoles: ['PRODUCT_OWNER'],
          allowedUserIds: [],
        },
        {
          fromState: 'ACTIVE',
          toState: 'COMPLETED',
          requiresApproval: false,
          allowedRoles: ['PRODUCT_OWNER'],
          allowedUserIds: [],
        },
        {
          fromState: 'ACTIVE',
          toState: 'ABANDONED',
          requiresApproval: false,
          allowedRoles: ['PRODUCT_OWNER'],
          allowedUserIds: [],
        },
        {
          fromState: 'NEW',
          toState: 'ABANDONED',
          requiresApproval: false,
          allowedRoles: ['PRODUCT_OWNER'],
          allowedUserIds: [],
        },
      ],
    },
    BacklogItem: {
      name: 'Backlog Item Workflow',
      description: 'Default workflow for backlog items',
      defaultStatus: 'NEW',
      states: [
        {
          name: 'NEW',
          displayName: 'New',
          description: 'Newly created backlog item',
          color: '#6B7280',
          icon: 'inbox',
          isFinal: false,
          orderIndex: 1,
        },
        {
          name: 'REFINED',
          displayName: 'Refined',
          description: 'Backlog item has been refined and estimated',
          color: '#F59E0B',
          icon: 'filter',
          isFinal: false,
          orderIndex: 2,
        },
        {
          name: 'READY',
          displayName: 'Ready',
          description: 'Backlog item is ready for sprint',
          color: '#3B82F6',
          icon: 'check-circle',
          isFinal: false,
          orderIndex: 3,
        },
        {
          name: 'IN_PROGRESS',
          displayName: 'In Progress',
          description: 'Backlog item is being worked on',
          color: '#8B5CF6',
          icon: 'play',
          isFinal: false,
          orderIndex: 4,
        },
        {
          name: 'DONE',
          displayName: 'Done',
          description: 'Backlog item is completed',
          color: '#10B981',
          icon: 'check',
          isFinal: true,
          orderIndex: 5,
        },
      ],
      transitions: [
        {
          fromState: 'NEW',
          toState: 'REFINED',
          requiresApproval: false,
          allowedRoles: ['PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER'],
          allowedUserIds: [],
        },
        {
          fromState: 'REFINED',
          toState: 'READY',
          requiresApproval: false,
          allowedRoles: ['PRODUCT_OWNER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
        {
          fromState: 'READY',
          toState: 'IN_PROGRESS',
          requiresApproval: false,
          allowedRoles: ['DEVELOPER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
        {
          fromState: 'IN_PROGRESS',
          toState: 'DONE',
          requiresApproval: false,
          allowedRoles: ['DEVELOPER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
        {
          fromState: 'IN_PROGRESS',
          toState: 'READY',
          requiresApproval: false,
          allowedRoles: ['DEVELOPER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
      ],
    },
    Task: {
      name: 'Task Workflow',
      description: 'Default workflow for tasks',
      defaultStatus: 'TODO',
      states: [
        {
          name: 'TODO',
          displayName: 'To Do',
          description: 'Task is pending',
          color: '#6B7280',
          icon: 'list',
          isFinal: false,
          orderIndex: 1,
        },
        {
          name: 'IN_PROGRESS',
          displayName: 'In Progress',
          description: 'Task is being worked on',
          color: '#3B82F6',
          icon: 'play',
          isFinal: false,
          orderIndex: 2,
        },
        {
          name: 'DONE',
          displayName: 'Done',
          description: 'Task is completed',
          color: '#10B981',
          icon: 'check',
          isFinal: true,
          orderIndex: 3,
        },
      ],
      transitions: [
        {
          fromState: 'TODO',
          toState: 'IN_PROGRESS',
          requiresApproval: false,
          allowedRoles: ['DEVELOPER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
        {
          fromState: 'IN_PROGRESS',
          toState: 'DONE',
          requiresApproval: false,
          allowedRoles: ['DEVELOPER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
        {
          fromState: 'IN_PROGRESS',
          toState: 'TODO',
          requiresApproval: false,
          allowedRoles: ['DEVELOPER', 'SCRUM_MASTER'],
          allowedUserIds: [],
        },
      ],
    },
  };

  // Cache for workflows with TTL
  private workflowCache: Map<string, { workflow: WorkflowWithStates; expiry: number }> = new Map();

  // In-process initialization locks for coordination within the same instance
  private initializationLocks: Map<string, Promise<WorkflowWithStates>> = new Map();

  // Track initialization attempts for retry logic
  private initializationAttempts: Map<string, number> = new Map();

  /**
   * Normalize entity type to consistent format
   * Converts to lowercase for case-insensitive matching
   */
  private normalizeEntityType(entityType: string): string {
    return entityType.toLowerCase().trim();
  }

  /**
   * Find the canonical entity type name from DEFAULT_WORKFLOW_CONFIGS
   * Performs case-insensitive lookup
   */
  private findCanonicalEntityType(normalizedType: string): string | null {
    const configKeys = Object.keys(WorkflowService.DEFAULT_WORKFLOW_CONFIGS);
    return configKeys.find((key) => key.toLowerCase() === normalizedType) || null;
  }

  /**
   * Get workflow by entity type with lazy initialization
   * @param entityType - The entity type (e.g., 'ProductGoal', 'BacklogItem', 'Task')
   * @param userId - Optional user ID for workflow creation audit trail
   */
  async getWorkflowByEntityType(
    entityType: string,
    userId?: string
  ): Promise<WorkflowWithStates | null> {
    const normalizedType = this.normalizeEntityType(entityType);
    const canonicalType = this.findCanonicalEntityType(normalizedType);

    if (!canonicalType) {
      logger.debug('Unknown entity type', { entityType, normalizedType });
      return null;
    }

    // 1. Check cache first
    const cached = this.workflowCache.get(normalizedType);
    if (cached && cached.expiry > Date.now()) {
      logger.debug('Workflow cache hit', { entityType: normalizedType });
      return cached.workflow;
    }

    // 2. Check if initialization is already in progress (return existing promise)
    const inProgressPromise = this.initializationLocks.get(normalizedType);
    if (inProgressPromise) {
      logger.debug('Waiting for in-progress initialization', { entityType: normalizedType });
      return inProgressPromise;
    }

    // 3. Start initialization process
    const initPromise = this.initializeWorkflow(normalizedType, canonicalType, userId);
    this.initializationLocks.set(normalizedType, initPromise as Promise<WorkflowWithStates>);

    try {
      const workflow = await initPromise;
      return workflow;
    } finally {
      // Clean up the lock after completion
      this.initializationLocks.delete(normalizedType);
    }
  }

  /**
   * Initialize workflow with cross-instance coordination
   */
  private async initializeWorkflow(
    normalizedType: string,
    canonicalType: string,
    userId?: string
  ): Promise<WorkflowWithStates | null> {
    // 1. Try to fetch existing workflow first (fast path)
    const existingWorkflow = await this.fetchExistingWorkflow(canonicalType);
    if (existingWorkflow) {
      this.cacheWorkflow(normalizedType, existingWorkflow);
      return existingWorkflow;
    }

    // 2. Check if we have a default config for this entity type
    const config = WorkflowService.DEFAULT_WORKFLOW_CONFIGS[canonicalType];
    if (!config) {
      logger.debug('No workflow found and no default config available', {
        entityType: normalizedType,
      });
      return null;
    }

    // 3. Need to create default workflow - use lock for cross-instance coordination
    logger.info('Workflow not found, attempting lazy initialization', {
      entityType: canonicalType,
    });

    // Get or increment initialization attempts
    const attempts = (this.initializationAttempts.get(normalizedType) ?? 0) + 1;
    this.initializationAttempts.set(normalizedType, attempts);

    if (attempts > MAX_INITIALIZATION_RETRIES) {
      logger.error('Max initialization retries exceeded', { entityType: canonicalType, attempts });
      this.initializationAttempts.delete(normalizedType);
      return null;
    }

    try {
      // Use WorkflowLockService for cross-instance coordination
      const workflow = await WorkflowLockService.withLock(
        canonicalType,
        async () => {
          // Double-check pattern: another instance might have created it while we waited for lock
          const doubleCheckWorkflow = await this.fetchExistingWorkflow(canonicalType);
          if (doubleCheckWorkflow) {
            logger.info('Workflow created by another instance', { entityType: canonicalType });
            return doubleCheckWorkflow;
          }

          // Create the default workflow with the user ID
          logger.info('Creating default workflow', { entityType: canonicalType });
          return this.createDefaultWorkflow(canonicalType, userId);
        },
        INITIALIZATION_TIMEOUT_MS
      );

      // Cache the result
      this.cacheWorkflow(normalizedType, workflow);

      // Reset attempts on success
      this.initializationAttempts.delete(normalizedType);

      return workflow;
    } catch (error) {
      // Handle P2002 (unique constraint violation) - another instance created it
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        logger.info('Workflow created by another instance (P2002)', { entityType: canonicalType });
        const existingWorkflow = await this.fetchExistingWorkflow(canonicalType);
        if (existingWorkflow) {
          this.cacheWorkflow(normalizedType, existingWorkflow);
          this.initializationAttempts.delete(normalizedType);
          return existingWorkflow;
        }
      }

      logger.error('Failed to initialize workflow', {
        entityType: canonicalType,
        error: error instanceof Error ? error.message : String(error),
        attempts,
      });

      // Add exponential backoff delay before potential retry
      const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      await this.delay(backoffMs);

      // If lock acquisition failed, return null
      return null;
    }
  }

  /**
   * Fetch existing workflow from database
   */
  private async fetchExistingWorkflow(entityType: string): Promise<WorkflowWithStates | null> {
    const workflow = await prisma.workflow.findUnique({
      where: { entityType },
      include: {
        states: {
          orderBy: { orderIndex: 'asc' },
        },
        transitions: {
          where: { isActive: true },
        },
      },
    });

    if (!workflow) {
      return null;
    }

    return workflow as unknown as WorkflowWithStates;
  }

  /**
   * Create default workflow in a transaction
   * @param entityType - The entity type for the workflow
   * @param userId - Optional user ID to use for createdBy field
   */
  private async createDefaultWorkflow(
    entityType: string,
    userId?: string
  ): Promise<WorkflowWithStates> {
    const config = WorkflowService.DEFAULT_WORKFLOW_CONFIGS[entityType];
    if (!config) {
      throw new Error(`No default workflow configuration for entity type: ${entityType}`);
    }

    const workflowId = generateUUIDv7();
    const now = new Date();

    // Use provided userId, or throw error if not provided
    const createdByUserId = userId;
    if (!createdByUserId) {
      throw new Error('User ID is required to create workflow');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create workflow
      await tx.workflow.create({
        data: {
          id: workflowId,
          entityType,
          name: config.name,
          description: config.description,
          isActive: true,
          defaultStatus: config.defaultStatus,
          createdBy: createdByUserId,
          createdAt: now,
          updatedAt: now,
        },
      });

      // Create states
      const stateIdMap: Record<string, string> = {};
      for (const stateConfig of config.states) {
        const stateId = generateUUIDv7();
        stateIdMap[stateConfig.name] = stateId;

        await tx.workflowState.create({
          data: {
            id: stateId,
            workflowId,
            name: stateConfig.name,
            displayName: stateConfig.displayName,
            description: stateConfig.description,
            color: stateConfig.color,
            icon: stateConfig.icon,
            isFinal: stateConfig.isFinal,
            orderIndex: stateConfig.orderIndex,
            createdAt: now,
          },
        });
      }

      // Create transitions
      for (const transitionConfig of config.transitions) {
        const transitionId = generateUUIDv7();
        const fromStateId = stateIdMap[transitionConfig.fromState];
        const toStateId = stateIdMap[transitionConfig.toState];

        if (!fromStateId || !toStateId) {
          logger.warn('Invalid transition configuration - state not found', {
            entityType,
            fromState: transitionConfig.fromState,
            toState: transitionConfig.toState,
          });
          continue;
        }

        await tx.workflowTransition.create({
          data: {
            id: transitionId,
            workflowId,
            fromStateId,
            toStateId,
            condition: null,
            requiresApproval: transitionConfig.requiresApproval,
            allowedRoles: transitionConfig.allowedRoles,
            allowedUserIds: transitionConfig.allowedUserIds,
            isActive: true,
            createdAt: now,
          },
        });
      }

      // Fetch the complete workflow with relations
      const completeWorkflow = await tx.workflow.findUnique({
        where: { id: workflowId },
        include: {
          states: {
            orderBy: { orderIndex: 'asc' },
          },
          transitions: {
            where: { isActive: true },
          },
        },
      });

      return completeWorkflow as unknown as WorkflowWithStates;
    });

    logger.info('Default workflow created successfully', {
      entityType,
      workflowId,
      stateCount: config.states.length,
      transitionCount: config.transitions.length,
    });

    return result;
  }

  /**
   * Cache workflow with TTL
   */
  private cacheWorkflow(entityType: string, workflow: WorkflowWithStates): void {
    const expiry = Date.now() + CACHE_TTL_MS;
    this.workflowCache.set(entityType, { workflow, expiry });
    logger.debug('Workflow cached', { entityType, expiry: new Date(expiry).toISOString() });

    // Schedule cache expiry cleanup
    this.scheduleCacheExpiry(entityType);
  }

  /**
   * Schedule cache expiration cleanup
   */
  private scheduleCacheExpiry(entityType: string): void {
    const ttlMs = CACHE_TTL_MS + 1000; // Add 1 second buffer

    setTimeout(() => {
      const cached = this.workflowCache.get(entityType);
      if (cached && cached.expiry <= Date.now()) {
        this.workflowCache.delete(entityType);
        logger.debug('Workflow cache expired and removed', { entityType });
      }
    }, ttlMs);
  }

  /**
   * Promise-based delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get workflow states for entity type
   */
  async getWorkflowStates(entityType: string): Promise<WorkflowState[]> {
    const workflow = await this.getWorkflowByEntityType(entityType);
    if (!workflow) {
      throw new NotFoundError(`Workflow for entity type ${entityType}`);
    }
    return workflow.states;
  }

  /**
   * Get workflow transitions for entity type
   */
  async getWorkflowTransitions(entityType: string): Promise<WorkflowTransition[]> {
    const workflow = await this.getWorkflowByEntityType(entityType);
    if (!workflow) {
      throw new NotFoundError(`Workflow for entity type ${entityType}`);
    }
    return workflow.transitions;
  }

  /**
   * Get state by name for entity type
   */
  async getStateByName(entityType: string, stateName: string): Promise<WorkflowState | null> {
    const workflow = await this.getWorkflowByEntityType(entityType);
    if (!workflow) {
      return null;
    }

    return workflow.states.find((state) => state.name === stateName) ?? null;
  }

  /**
   * Validate if a status transition is allowed
   */
  async validateTransition(
    entityType: string,
    fromStatus: string | null,
    toStatus: string,
    userId: string | undefined,
    userRoles: string[]
  ): Promise<TransitionValidationResult> {
    const workflow = await this.getWorkflowByEntityType(entityType, userId);
    if (!workflow) {
      return {
        isValid: false,
        allowed: false,
        reason: `No workflow configured for entity type ${entityType}`,
      };
    }

    const fromState = fromStatus ? await this.getStateByName(entityType, fromStatus) : null;
    const toState = await this.getStateByName(entityType, toStatus);

    if (!toState) {
      return {
        isValid: false,
        allowed: false,
        reason: `Target state ${toStatus} does not exist in workflow`,
      };
    }

    // If no from status, check if toStatus is the default status
    if (!fromStatus) {
      if (toStatus === workflow.defaultStatus) {
        return {
          isValid: true,
          allowed: true,
        };
      }
      return {
        isValid: false,
        allowed: false,
        reason: `Initial status must be ${workflow.defaultStatus}`,
      };
    }

    // Find the transition
    const transition = workflow.transitions.find(
      (t) => t.fromStateId === fromState?.id && t.toStateId === toState.id
    );

    if (!transition) {
      return {
        isValid: true,
        allowed: false,
        reason: `Transition from ${fromStatus} to ${toStatus} is not allowed`,
      };
    }

    // Check if transition is active
    if (!transition.isActive) {
      return {
        isValid: true,
        allowed: false,
        reason: 'This transition is currently disabled',
      };
    }

    // Check role permissions
    if (transition.allowedRoles.length > 0) {
      const hasRole = transition.allowedRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        return {
          isValid: true,
          allowed: false,
          reason: `You do not have permission to perform this transition. Required roles: ${transition.allowedRoles.join(', ')}`,
        };
      }
    }

    // Check user permissions
    if (transition.allowedUserIds.length > 0) {
      if (!userId) {
        return {
          isValid: true,
          allowed: false,
          reason: 'User authentication required for this transition',
        };
      }
      const hasUserPermission = transition.allowedUserIds.includes(userId);
      if (!hasUserPermission) {
        return {
          isValid: true,
          allowed: false,
          reason: 'You do not have permission to perform this transition',
        };
      }
    }

    return {
      isValid: true,
      allowed: true,
      transition,
    };
  }

  /**
   * Execute a status change with validation and history tracking
   */
  async executeStatusChange(request: StatusChangeRequest): Promise<StatusChangeHistory> {
    const {
      entityType,
      entityId,
      fromStatus,
      toStatus,
      userId,
      userRoles,
      changeReason,
      changeNotes,
      metadata,
    } = request;

    // Validate the transition
    const validationResult = await this.validateTransition(
      entityType,
      fromStatus,
      toStatus,
      userId,
      userRoles
    );

    if (!validationResult.isValid) {
      throw new BadRequestError(validationResult.reason ?? 'Invalid status transition');
    }

    if (!validationResult.allowed) {
      throw new ForbiddenError(validationResult.reason ?? 'Status transition not allowed');
    }

    // Get workflow with userId for lazy initialization
    const workflow = await this.getWorkflowByEntityType(entityType, userId);
    if (!workflow) {
      throw new NotFoundError(`Workflow for entity type ${entityType}`);
    }

    const fromState = fromStatus ? await this.getStateByName(entityType, fromStatus) : null;
    const toState = await this.getStateByName(entityType, toStatus);

    if (!toState) {
      throw new BadRequestError(`Target state ${toStatus} does not exist`);
    }

    // Create status change history record
    const historyId = generateUUIDv7();
    const history = await prisma.statusChangeHistory.create({
      data: {
        id: historyId,
        entityType,
        entityId,
        workflowId: workflow.id,
        fromStateId: fromState?.id ?? null,
        toStateId: toState.id,
        changedBy: userId,
        changeReason: changeReason ?? null,
        changeNotes: changeNotes ?? null,
        transitionId: validationResult.transition?.id ?? null,
        metadata: metadata ?? {},
      },
    });

    return history as unknown as StatusChangeHistory;
  }

  /**
   * Get status change history for an entity
   */
  async getStatusChangeHistory(
    entityType: string,
    entityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<StatusChangeHistory[]> {
    const history = await prisma.statusChangeHistory.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        workflow: {
          include: {
            states: true,
          },
        },
        fromState: true,
        toState: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const userIds = [...new Set(history.map((item: { changedBy: string }) => item.changedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
    const userMap = new Map(
      users.map(
        (user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          avatarUrl: string | null;
        }) => [user.id, user]
      )
    );

    const historyWithChanger = history.map((item: { changedBy: string }) => ({
      ...item,
      changer: userMap.get(item.changedBy) ?? null,
    }));

    return historyWithChanger as unknown as StatusChangeHistory[];
  }

  /**
   * Get allowed transitions from a given state
   */
  async getAllowedTransitions(
    entityType: string,
    fromStatus: string,
    userId: string | undefined,
    userRoles: string[]
  ): Promise<WorkflowTransition[]> {
    const workflow = await this.getWorkflowByEntityType(entityType);
    if (!workflow) {
      return [];
    }

    const fromState = await this.getStateByName(entityType, fromStatus);
    if (!fromState) {
      return [];
    }

    const transitions = workflow.transitions.filter((t) => t.fromStateId === fromState.id);

    // Filter by permissions
    const allowedTransitions = transitions.filter((transition) => {
      if (!transition.isActive) return false;

      if (transition.allowedRoles.length > 0) {
        const hasRole = transition.allowedRoles.some((role) => userRoles.includes(role));
        if (!hasRole) return false;
      }

      if (transition.allowedUserIds.length > 0) {
        if (!userId) return false;
        const hasUserPermission = transition.allowedUserIds.includes(userId);
        if (!hasUserPermission) return false;
      }

      return true;
    });

    return allowedTransitions;
  }

  /**
   * Create a new workflow (admin function)
   */
  async createWorkflow(
    entityType: string,
    name: string,
    description: string | null,
    defaultStatus: string,
    createdBy: string
  ): Promise<Workflow> {
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { entityType },
    });

    if (existingWorkflow) {
      throw new ConflictError(`Workflow for entity type ${entityType} already exists`);
    }

    const workflowId = generateUUIDv7();
    const workflow = await prisma.workflow.create({
      data: {
        id: workflowId,
        entityType,
        name,
        description,
        defaultStatus,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return workflow as unknown as Workflow;
  }

  /**
   * Add a state to a workflow
   */
  async addWorkflowState(
    workflowId: string,
    name: string,
    displayName: string,
    description: string | null,
    color: string | null,
    icon: string | null,
    isFinal: boolean,
    orderIndex: number
  ): Promise<WorkflowState> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    const stateId = generateUUIDv7();
    const state = await prisma.workflowState.create({
      data: {
        id: stateId,
        workflowId,
        name,
        displayName,
        description,
        color,
        icon,
        isFinal,
        orderIndex,
        createdAt: new Date(),
      },
    });

    // Invalidate cache for this entity type
    this.workflowCache.delete(workflow.entityType);

    return state as unknown as WorkflowState;
  }

  /**
   * Add a transition to a workflow
   */
  async addWorkflowTransition(
    workflowId: string,
    fromStateName: string,
    toStateName: string,
    requiresApproval: boolean,
    allowedRoles: string[],
    allowedUserIds: string[]
  ): Promise<WorkflowTransition> {
    const workflow = await this.getWorkflowByEntityType(
      (await prisma.workflow.findUnique({ where: { id: workflowId } }))?.entityType ?? ''
    );

    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    const fromState = workflow.states.find((s) => s.name === fromStateName);
    const toState = workflow.states.find((s) => s.name === toStateName);

    if (!fromState || !toState) {
      throw new BadRequestError('Invalid state names');
    }

    const transitionId = generateUUIDv7();
    const transition = await prisma.workflowTransition.create({
      data: {
        id: transitionId,
        workflowId,
        fromStateId: fromState.id,
        toStateId: toState.id,
        requiresApproval,
        allowedRoles,
        allowedUserIds,
        isActive: true,
        createdAt: new Date(),
      },
    });

    // Invalidate cache for this entity type
    this.workflowCache.delete(workflow.entityType);

    return transition as unknown as WorkflowTransition;
  }

  /**
   * Invalidate cache for a specific entity type (useful for admin operations)
   */
  invalidateCache(entityType: string): void {
    const normalizedType = this.normalizeEntityType(entityType);
    this.workflowCache.delete(normalizedType);
    logger.info('Workflow cache invalidated', { entityType: normalizedType });
  }

  /**
   * Clear all cached workflows
   */
  clearCache(): void {
    this.workflowCache.clear();
    logger.info('All workflow cache cleared');
  }

  /**
   * Health check: Verify workflow initialization capability
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    workflows: Record<string, { exists: boolean; error?: string }>;
  }> {
    const results: Record<string, { exists: boolean; error?: string }> = {};

    for (const entityType of Object.keys(WorkflowService.DEFAULT_WORKFLOW_CONFIGS)) {
      try {
        const workflow = await this.fetchExistingWorkflow(entityType);
        results[entityType] = { exists: workflow !== null };
      } catch (error: any) {
        results[entityType] = {
          exists: false,
          error: error.message,
        };
      }
    }

    const healthy = Object.values(results).every((r) => r.exists || !r.error);

    return { healthy, workflows: results };
  }

  /**
   * Force re-initialization (admin function)
   */
  async forceReinitialize(entityType: string): Promise<WorkflowWithStates | null> {
    const normalizedType = this.normalizeEntityType(entityType);
    logger.warn('Force re-initialization requested', { entityType: normalizedType });

    // Clear cache and locks
    this.workflowCache.delete(normalizedType);
    this.initializationLocks.delete(normalizedType);
    this.initializationAttempts.delete(normalizedType);

    // Get or create fresh
    return this.getWorkflowByEntityType(normalizedType);
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(): {
    cacheSize: number;
    cachedEntityTypes: string[];
    pendingInitializations: number;
  } {
    return {
      cacheSize: this.workflowCache.size,
      cachedEntityTypes: Array.from(this.workflowCache.keys()),
      pendingInitializations: this.initializationLocks.size,
    };
  }
}

export { WorkflowService };
export const workflowService = new WorkflowService();
export default workflowService;
