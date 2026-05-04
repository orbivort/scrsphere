import { Router, type Router as RouterType } from 'express';
import * as incrementController from '../controllers/increment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);

const incrementIdSchema = z.object({
  id: z.string().uuid('Invalid increment ID'),
});

const teamQuerySchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  sprintId: z.string().uuid('Invalid sprint ID').optional(),
});

const createIncrementSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  sprintId: z.string().uuid('Invalid sprint ID'),
  teamId: z.string().uuid('Invalid team ID'),
  includedPBIs: z.array(z.string().uuid()).default([]),
  totalStoryPoints: z.number().int().min(0).default(0),
  status: z.enum(['DRAFT', 'VERIFIED', 'DELIVERED', 'ARCHIVED']).default('DRAFT'),
  createdBy: z.string().uuid().optional(),
});

const updateIncrementSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  includedPBIs: z.array(z.string().uuid()).optional(),
  totalStoryPoints: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'VERIFIED', 'DELIVERED', 'ARCHIVED']).optional(),
});

const deliverIncrementSchema = z.object({
  deliveryMethod: z.enum(['sprint_review', 'early_release']),
  notes: z.string().max(2000).optional(),
});

router.get('/', validateQuery(teamQuerySchema), incrementController.getIncrements);

router.get(
  '/metrics',
  validateQuery(z.object({ teamId: z.string().uuid('Invalid team ID') })),
  incrementController.getIncrementMetrics
);

router.get('/:id', validateParams(incrementIdSchema), incrementController.getIncrementById);

router.post('/', validateBody(createIncrementSchema), incrementController.createIncrement);

router.put(
  '/:id',
  validateParams(incrementIdSchema),
  validateBody(updateIncrementSchema),
  incrementController.updateIncrement
);

router.post(
  '/:id/deliver',
  validateParams(incrementIdSchema),
  validateBody(deliverIncrementSchema),
  incrementController.deliverIncrement
);

export default router;
