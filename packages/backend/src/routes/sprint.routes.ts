// Sprint Routes
import { Router, type Router as RouterType } from 'express';
import * as sprintController from '../controllers/sprint.controller';
import { incrementSprintService } from '../services/sprint.service';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { asyncHandler, createSuccessResponse } from '../utils/errors';
import { getParamValue } from '../utils/validation';
import { z } from 'zod';

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const sprintIdSchema = z.object({
  id: z.string().uuid('Invalid sprint ID'),
});

const sprintIdParamSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
});

const taskIdSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
  taskId: z.string().uuid('Invalid task ID'),
});

const createSprintSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  name: z.string().min(1, 'Name is required').max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  sprintGoal: z.string().max(500).optional(),
  goalId: z.string().uuid().optional().nullable(),
});

const updateSprintSchema = createSprintSchema.partial().omit({ teamId: true });

const cancelSprintSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

const createTaskSchema = z.object({
  pbiId: z.string().uuid('Invalid PBI ID'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  estimatedHours: z.number().min(0).optional(),
  remainingHours: z.number().min(0).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  estimatedHours: z.number().positive().optional(),
  remainingHours: z.number().min(0).optional(),
});

const startSprintSchema = z.object({
  backlogItems: z
    .array(
      z.object({
        pbiId: z.string().uuid('Invalid PBI ID'),
      })
    )
    .optional(),
  tasks: z
    .array(
      z.object({
        pbiId: z.string().uuid('Invalid PBI ID'),
        title: z.string().min(1, 'Task title is required').max(200),
        description: z.string().max(2000).optional(),
        assigneeId: z.string().uuid().optional().nullable(),
        estimatedHours: z.number().positive().optional(),
        remainingHours: z.number().min(0).optional(),
      })
    )
    .optional(),
});

const addPBIToSprintSchema = z.object({
  pbiId: z.string().uuid('Invalid PBI ID'),
  reason: z.string().max(500).optional(),
});

const removePBIFromSprintSchema = z.object({
  taskAction: z.enum(['delete', 'return_to_backlog', 'keep_in_sprint']),
  reason: z.string().max(500).optional(),
});

const pbiIdSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
  pbiId: z.string().uuid('Invalid PBI ID'),
});

const teamQuerySchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
});

/**
 * @route   GET /api/v1/sprints
 * @desc    Get all sprints for a team
 * @access  Private
 */
router.get('/', validateQuery(teamQuerySchema), sprintController.getSprints);

/**
 * @route   GET /api/v1/sprints/active
 * @desc    Get active sprint for a team
 * @access  Private
 */
router.get('/active', validateQuery(teamQuerySchema), sprintController.getActiveSprint);

/**
 * @route   GET /api/v1/sprints/available-pbis
 * @desc    Get available PBIs for sprint (READY status, not in active sprint)
 * @access  Private
 */
router.get('/available-pbis', validateQuery(teamQuerySchema), sprintController.getAvailablePBIs);

/**
 * @route   POST /api/v1/sprints
 * @desc    Create a new sprint
 * @access  Private
 */
router.post('/', validateBody(createSprintSchema), sprintController.createSprint);

/**
 * @route   GET /api/v1/sprints/:id
 * @desc    Get sprint by ID
 * @access  Private
 */
router.get('/:id', validateParams(sprintIdSchema), sprintController.getSprintById);

/**
 * @route   PUT /api/v1/sprints/:id
 * @desc    Update sprint
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(sprintIdSchema),
  validateBody(updateSprintSchema),
  sprintController.getSprintById // TODO: implement updateSprint
);

/**
 * @route   POST /api/v1/sprints/:id/start
 * @desc    Start sprint
 * @access  Private
 */
router.post(
  '/:id/start',
  validateParams(sprintIdSchema),
  validateBody(startSprintSchema),
  sprintController.startSprint
);

/**
 * @route   POST /api/v1/sprints/:id/rollback
 * @desc    Rollback sprint start operation
 * @access  Private
 */
router.post('/:id/rollback', validateParams(sprintIdSchema), sprintController.rollbackSprintStart);

/**
 * @route   POST /api/v1/sprints/:id/complete
 * @desc    Complete sprint
 * @access  Private
 */
router.post('/:id/complete', validateParams(sprintIdSchema), sprintController.completeSprint);

/**
 * @route   POST /api/v1/sprints/:id/cancel
 * @desc    Cancel sprint
 * @access  Private
 */
router.post(
  '/:id/cancel',
  validateParams(sprintIdSchema),
  validateBody(cancelSprintSchema),
  sprintController.cancelSprint
);

/**
 * @route   GET /api/v1/sprints/:sprintId/burndown
 * @desc    Get burndown data
 * @access  Private
 */
router.get(
  '/:sprintId/burndown',
  validateParams(sprintIdParamSchema),
  sprintController.getBurndownData
);

// ==================== Sprint Tasks ====================

/**
 * @route   GET /api/v1/sprint-backlog/:sprintId/tasks
 * @desc    Get sprint tasks
 * @access  Private
 */
router.get(
  '/:sprintId/tasks',
  validateParams(sprintIdParamSchema),
  sprintController.getSprintTasks
);

/**
 * @route   POST /api/v1/sprint-backlog/:sprintId/tasks
 * @desc    Create task
 * @access  Private
 */
router.post(
  '/:sprintId/tasks',
  validateParams(sprintIdParamSchema),
  validateBody(createTaskSchema),
  sprintController.createTask
);

/**
 * @route   PUT /api/v1/sprint-backlog/:sprintId/tasks/:taskId
 * @desc    Update task
 * @access  Private
 */
router.put(
  '/:sprintId/tasks/:taskId',
  validateParams(taskIdSchema),
  validateBody(updateTaskSchema),
  sprintController.updateTask
);

/**
 * @route   DELETE /api/v1/sprint-backlog/:sprintId/tasks/:taskId
 * @desc    Delete task
 * @access  Private
 */
router.delete(
  '/:sprintId/tasks/:taskId',
  validateParams(taskIdSchema),
  sprintController.deleteTask
);

router.get(
  '/:sprintId/eligible-pbis',
  validateParams(sprintIdParamSchema),
  asyncHandler(async (req, res) => {
    const sprintId = getParamValue(req.params.sprintId);
    if (!sprintId) {
      throw new Error('Sprint ID is required');
    }
    const pbis = await incrementSprintService.getEligiblePBIsForIncrement(sprintId);
    res.json(createSuccessResponse(pbis));
  })
);

router.get(
  '/:sprintId/backlog-pbis',
  validateParams(sprintIdParamSchema),
  asyncHandler(async (req, res) => {
    const sprintId = getParamValue(req.params.sprintId);
    if (!sprintId) {
      throw new Error('Sprint ID is required');
    }
    const pbis = await incrementSprintService.getSprintBacklogPBIs(sprintId);
    res.json(createSuccessResponse(pbis));
  })
);

router.post(
  '/:sprintId/backlog-items',
  validateParams(sprintIdParamSchema),
  validateBody(addPBIToSprintSchema),
  sprintController.addPBIToSprint
);

router.delete(
  '/:sprintId/backlog-items/:pbiId',
  validateParams(pbiIdSchema),
  validateBody(removePBIFromSprintSchema),
  sprintController.removePBIFromSprint
);

router.get(
  '/:sprintId/backlog-changes',
  validateParams(sprintIdParamSchema),
  sprintController.getSprintBacklogChanges
);

/**
 * @route   GET /api/v1/sprints/:sprintId/dod-compliance
 * @desc    Get DoD compliance report for sprint
 * @access  Private
 */
router.get(
  '/:sprintId/dod-compliance',
  validateParams(sprintIdParamSchema),
  sprintController.getDoDComplianceReport
);

export default router;
