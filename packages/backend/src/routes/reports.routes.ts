import { Router, type Router as RouterType } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: RouterType = Router();

router.use(authenticate);

router.get('/velocity', reportsController.getVelocityData);

router.get('/sprint-history', reportsController.getSprintHistory);

router.get('/metrics', reportsController.getTeamMetrics);

router.get('/insights', reportsController.getInsights);

export default router;
