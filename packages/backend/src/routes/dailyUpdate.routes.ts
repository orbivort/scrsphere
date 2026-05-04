import { Router, type Router as RouterType } from 'express';
import * as dailyUpdateController from '../controllers/dailyUpdate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);

const sprintIdParamSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
});

const updateIdParamSchema = z.object({
  id: z.string().uuid('Invalid daily update ID'),
});

const promoteImpedimentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  ownerId: z.string().uuid().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  teamId: z.string().uuid('Invalid team ID'),
  sprintId: z.string().uuid().optional(),
});

const dateQuerySchema = z.object({
  date: z.string().optional(),
});

const createDailyUpdateSchema = z.object({
  yesterdayWork: z.string().max(2000).optional(),
  todayWork: z.string().max(2000).optional(),
  impediment: z.string().max(2000).optional(),
});

const updateDailyUpdateSchema = z.object({
  yesterdayWork: z.string().max(2000).optional(),
  todayWork: z.string().max(2000).optional(),
  impediment: z.string().max(2000).optional(),
});

/**
 * @route   GET /api/v1/daily-updates/:sprintId/team-status
 * @desc    Get team members with their update status for a sprint
 * @access  Private
 */
router.get(
  '/:sprintId/team-status',
  validateParams(sprintIdParamSchema),
  validateQuery(dateQuerySchema),
  dailyUpdateController.getTeamMembersWithUpdates
);

/**
 * @route   GET /api/v1/daily-updates/:sprintId
 * @desc    Get daily updates for a sprint
 * @access  Private
 */
router.get(
  '/:sprintId',
  validateParams(sprintIdParamSchema),
  validateQuery(dateQuerySchema),
  dailyUpdateController.getDailyUpdates
);

/**
 * @route   POST /api/v1/daily-updates/:sprintId
 * @desc    Create a daily update for a sprint
 * @access  Private
 */
router.post(
  '/:sprintId',
  validateParams(sprintIdParamSchema),
  validateBody(createDailyUpdateSchema),
  dailyUpdateController.createDailyUpdate
);

/**
 * @route   GET /api/v1/daily-updates/update/:id
 * @desc    Get daily update by ID
 * @access  Private
 */
router.get(
  '/update/:id',
  validateParams(updateIdParamSchema),
  dailyUpdateController.getDailyUpdateById
);

/**
 * @route   PUT /api/v1/daily-updates/update/:id
 * @desc    Update a daily update
 * @access  Private
 */
router.put(
  '/update/:id',
  validateParams(updateIdParamSchema),
  validateBody(updateDailyUpdateSchema),
  dailyUpdateController.updateDailyUpdate
);

/**
 * @route   DELETE /api/v1/daily-updates/update/:id
 * @desc    Delete a daily update
 * @access  Private
 */
router.delete(
  '/update/:id',
  validateParams(updateIdParamSchema),
  dailyUpdateController.deleteDailyUpdate
);

/**
 * @route   POST /api/v1/daily-updates/:id/promote-impediment
 * @desc    Promote an impediment from daily update to formal impediment record
 * @access  Private
 */
router.post(
  '/:id/promote-impediment',
  validateParams(updateIdParamSchema),
  validateBody(promoteImpedimentSchema),
  dailyUpdateController.promoteToImpediment
);

/**
 * @route   POST /api/v1/daily-updates/:sprintId/send-reminder
 * @desc    Send daily update reminder to team members who haven't submitted
 * @access  Private
 */
router.post(
  '/:sprintId/send-reminder',
  validateParams(sprintIdParamSchema),
  dailyUpdateController.sendReminder
);

export default router;
