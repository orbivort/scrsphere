import { Router, type Router as RouterType } from 'express';
import * as sprintConfigController from '../controllers/sprintConfiguration.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);

const teamQuerySchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
});

const teamYearQuerySchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

const configIdSchema = z.object({
  id: z.string().uuid('Invalid configuration ID'),
});

const createConfigSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  duration: z.enum(['ONE_WEEK', 'TWO_WEEKS', 'THREE_WEEKS', 'FOUR_WEEKS']),
  year: z.number().int().min(2020).max(2100),
  sprintStartDay: z.number().int().min(0).max(6).optional(),
});

const updateConfigSchema = z.object({
  duration: z.enum(['ONE_WEEK', 'TWO_WEEKS', 'THREE_WEEKS', 'FOUR_WEEKS']).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  sprintStartDay: z.number().int().min(0).max(6).optional(),
});

const generateSprintsSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  duration: z.enum(['ONE_WEEK', 'TWO_WEEKS', 'THREE_WEEKS', 'FOUR_WEEKS']),
  year: z.number().int().min(2020).max(2100),
});

const sprintIdSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
});

const updateGeneratedSprintSchema = z.object({
  sprintGoal: z.string().min(1, 'Sprint goal cannot be empty').optional(),
});

router.get('/', validateQuery(teamQuerySchema), sprintConfigController.getSprintConfiguration);

router.post(
  '/',
  validateBody(createConfigSchema),
  sprintConfigController.createSprintConfiguration
);

router.put(
  '/:id',
  validateParams(configIdSchema),
  validateBody(updateConfigSchema),
  sprintConfigController.updateSprintConfiguration
);

router.post(
  '/generate',
  validateBody(generateSprintsSchema),
  sprintConfigController.generateSprintsForYear
);

router.get(
  '/sprints',
  validateQuery(teamYearQuerySchema),
  sprintConfigController.getGeneratedSprints
);

router.put(
  '/sprints/:sprintId',
  validateParams(sprintIdSchema),
  validateBody(updateGeneratedSprintSchema),
  sprintConfigController.updateGeneratedSprint
);

router.delete(
  '/sprints/:sprintId',
  validateParams(sprintIdSchema),
  sprintConfigController.deleteGeneratedSprint
);

export default router;
