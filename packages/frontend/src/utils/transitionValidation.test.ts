import { describe, it, expect } from 'vitest';

import { TaskStatus, type Task } from '../types';

interface TransitionValidationResult {
  valid: boolean;
  updates?: Partial<Task>;
  error?: string;
}

interface ValidateTransitionOptions {
  checkWipLimits?: boolean;
  wipLimits?: { in_progress: number };
  tasksByStatus?: { in_progress: Task[] };
  checkRequiredFields?: boolean;
}

// Extracted validation function for testing
export function validateAndPrepareTransition(
  task: Task,
  newStatus: TaskStatus,
  options?: ValidateTransitionOptions,
  validateTaskStatusTransition?: (
    from: TaskStatus,
    to: TaskStatus
  ) => { valid: boolean; message?: string }
): TransitionValidationResult {
  // Step 1: Validate status transition
  if (validateTaskStatusTransition) {
    const validationResult = validateTaskStatusTransition(task.status, newStatus);
    if (!validationResult.valid) {
      return { valid: false, error: validationResult.message || 'Invalid status transition' };
    }
  }

  // Step 2: Check WIP limits for IN_PROGRESS
  if (newStatus === TaskStatus.IN_PROGRESS && options?.checkWipLimits) {
    const wipLimit = options.wipLimits?.in_progress ?? 0;
    const currentCount = options.tasksByStatus?.in_progress.length ?? 0;
    if (currentCount >= wipLimit) {
      return {
        valid: false,
        error: `WIP limit reached for In Progress (${wipLimit} tasks max)`,
      };
    }
  }

  // Step 3: Check required fields for IN_PROGRESS
  if (newStatus === TaskStatus.IN_PROGRESS && options?.checkRequiredFields) {
    const missingFields: string[] = [];
    if (!task.assigneeId) {
      missingFields.push('Assignee');
    }
    if (!task.estimatedHours || task.estimatedHours <= 0) {
      missingFields.push('Estimated Hours');
    }

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Cannot move to In Progress. Please set: ${missingFields.join(', ')}`,
      };
    }
  }

  // Step 4: Prepare updates
  const updates: Partial<Task> = { status: newStatus };
  if (newStatus === TaskStatus.DONE) {
    updates.remainingHours = 0;
  }

  return { valid: true, updates };
}

describe('validateAndPrepareTransition', () => {
  const createMockTask = (overrides?: Partial<Task>): Task => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    pbiId: 'pbi-1',
    sprintId: 'sprint-1',
    assigneeId: 'user-1',
    estimatedHours: 8,
    remainingHours: 8,
    actualHours: 0,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('Basic Validation', () => {
    it('should return valid for allowed transition', () => {
      const task = createMockTask({ status: TaskStatus.TODO });
      const mockValidator = () => ({ valid: true });

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, {}, mockValidator);

      expect(result.valid).toBe(true);
      expect(result.updates).toEqual({ status: TaskStatus.IN_PROGRESS });
    });

    it('should return error for invalid transition', () => {
      const task = createMockTask({ status: TaskStatus.DONE });
      const mockValidator = () => ({ valid: false, message: 'Cannot transition from DONE' });

      const result = validateAndPrepareTransition(task, TaskStatus.TODO, {}, mockValidator);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot transition from DONE');
    });
  });

  describe('WIP Limit Validation', () => {
    it('should pass when WIP limit is not reached', () => {
      const task = createMockTask({ status: TaskStatus.TODO });
      const options = {
        checkWipLimits: true,
        wipLimits: { in_progress: 3 },
        tasksByStatus: { in_progress: [createMockTask()] },
      };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(true);
    });

    it('should fail when WIP limit is reached', () => {
      const task = createMockTask({ status: TaskStatus.TODO });
      const options = {
        checkWipLimits: true,
        wipLimits: { in_progress: 2 },
        tasksByStatus: { in_progress: [createMockTask(), createMockTask()] },
      };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('WIP limit reached');
    });

    it('should skip WIP check when not moving to IN_PROGRESS', () => {
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });
      const options = {
        checkWipLimits: true,
        wipLimits: { in_progress: 0 },
        tasksByStatus: { in_progress: [] },
      };

      const result = validateAndPrepareTransition(task, TaskStatus.DONE, options);

      expect(result.valid).toBe(true);
    });
  });

  describe('Required Fields Validation', () => {
    it('should pass when all required fields are present', () => {
      const task = createMockTask({
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
        estimatedHours: 8,
      });
      const options = { checkRequiredFields: true };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(true);
    });

    it('should fail when assignee is missing', () => {
      const task = createMockTask({
        status: TaskStatus.TODO,
        assigneeId: null,
        estimatedHours: 8,
      });
      const options = { checkRequiredFields: true };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Assignee');
    });

    it('should fail when estimated hours is missing', () => {
      const task = createMockTask({
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
        estimatedHours: null,
      });
      const options = { checkRequiredFields: true };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Estimated Hours');
    });

    it('should fail when estimated hours is zero', () => {
      const task = createMockTask({
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
        estimatedHours: 0,
      });
      const options = { checkRequiredFields: true };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Estimated Hours');
    });

    it('should skip required fields check when not moving to IN_PROGRESS', () => {
      const task = createMockTask({
        status: TaskStatus.IN_PROGRESS,
        assigneeId: null,
        estimatedHours: null,
      });
      const options = { checkRequiredFields: true };

      const result = validateAndPrepareTransition(task, TaskStatus.DONE, options);

      expect(result.valid).toBe(true);
    });
  });

  describe('Status Updates', () => {
    it('should set remainingHours to 0 when moving to DONE', () => {
      const task = createMockTask({
        status: TaskStatus.IN_PROGRESS,
        remainingHours: 5,
      });

      const result = validateAndPrepareTransition(task, TaskStatus.DONE);

      expect(result.valid).toBe(true);
      expect(result.updates).toEqual({
        status: TaskStatus.DONE,
        remainingHours: 0,
      });
    });

    it('should not modify remainingHours for other transitions', () => {
      const task = createMockTask({
        status: TaskStatus.TODO,
        remainingHours: 8,
      });

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS);

      expect(result.valid).toBe(true);
      expect(result.updates).toEqual({
        status: TaskStatus.IN_PROGRESS,
      });
      expect(result.updates?.remainingHours).toBeUndefined();
    });
  });

  describe('Combined Validation', () => {
    it('should check both WIP limits and required fields', () => {
      const task = createMockTask({
        status: TaskStatus.TODO,
        assigneeId: null,
        estimatedHours: null,
      });
      const options = {
        checkWipLimits: true,
        wipLimits: { in_progress: 3 },
        tasksByStatus: { in_progress: [] },
        checkRequiredFields: true,
      };

      const result = validateAndPrepareTransition(task, TaskStatus.IN_PROGRESS, options);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Assignee');
    });
  });
});
