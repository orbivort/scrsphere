// Timebox Routes
import { Router, type Router as RouterType } from 'express';
import * as timeboxController from '../controllers/timebox.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeamContext, requireTeamRoles } from '../middleware/teamContext.middleware';
import { validateParams, validateQuery, validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);
router.use(requireTeamContext);

// Only the Scrum Master can control (start/pause/reset) a timebox, matching
// the Scrum Guide's accountability that the SM keeps events within their
// timebox. Viewing is open to all team members (Transparency).
const smOnly = requireTeamRoles('SCRUM_MASTER');

const eventTypeSchema = z.enum(['sprintPlanning', 'dailyScrum', 'sprintReview', 'retrospective']);

const eventParamSchema = z.object({
  eventType: eventTypeSchema,
});

const timeboxQuerySchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID').optional(),
  date: z.string().datetime('Invalid date').optional(),
});

const timeboxBodySchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID').nullish(),
  date: z.string().datetime('Invalid date').optional(),
});

router.get(
  '/:eventType',
  validateParams(eventParamSchema),
  validateQuery(timeboxQuerySchema),
  timeboxController.getTimebox
);

router.post(
  '/:eventType/start',
  smOnly,
  validateParams(eventParamSchema),
  validateBody(timeboxBodySchema),
  timeboxController.startTimebox
);

router.post(
  '/:eventType/pause',
  smOnly,
  validateParams(eventParamSchema),
  validateBody(timeboxBodySchema),
  timeboxController.pauseTimebox
);

router.post(
  '/:eventType/reset',
  smOnly,
  validateParams(eventParamSchema),
  validateBody(timeboxBodySchema),
  timeboxController.resetTimebox
);

router.post(
  '/:eventType/conclude',
  smOnly,
  validateParams(eventParamSchema),
  validateBody(timeboxBodySchema),
  timeboxController.concludeTimebox
);

export default router;
