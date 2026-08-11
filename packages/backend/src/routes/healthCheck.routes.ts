import { Router, type Router as RouterType } from 'express';
import * as healthCheckController from '../controllers/teamHealthCheck.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);

const idSchema = z.object({ id: z.string().uuid('Invalid ID') });

const submitResponsesSchema = z.object({
  responses: z
    .array(
      z.object({
        scrumValue: z.enum(['COMMITMENT', 'FOCUS', 'OPENNESS', 'RESPECT', 'COURAGE']),
        score: z.number().int().min(1).max(5),
        anonymous: z.boolean().default(false),
      })
    )
    .min(1)
    .max(5),
});

router.post(
  '/:id/responses',
  validateParams(idSchema),
  validateBody(submitResponsesSchema),
  healthCheckController.submitResponses
);

router.get('/:id/results', validateParams(idSchema), healthCheckController.getResults);

export default router;
