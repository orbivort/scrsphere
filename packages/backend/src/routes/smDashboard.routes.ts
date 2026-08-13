import { Router, type Router as RouterType } from 'express';
import * as smDashboardController from '../controllers/smDashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeamContext, requireTeamRoles } from '../middleware/teamContext.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);
router.use(requireTeamContext);

// Only the Scrum Master can access the facilitation dashboard.
const smOnly = requireTeamRoles('SCRUM_MASTER');

const dashboardQuerySchema = z.object({
  sprintCount: z.coerce.number().int().min(1).max(20).optional(),
});

router.get(
  '/scrum-master',
  smOnly,
  validateQuery(dashboardQuerySchema),
  smDashboardController.getSmDashboard
);

router.get('/scrum-master/schedule', smOnly, smDashboardController.getEventSchedule);

export default router;
