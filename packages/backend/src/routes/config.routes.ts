import { Router, type Router as RouterType } from 'express';
import { ConfigController } from '../controllers/config.controller';
import { SUPPORTED_LOCALES, LOCALE_LABELS } from '@scrumooth/shared';

const router: RouterType = Router();
const controller = new ConfigController();

router.get('/notifications', controller.getNotificationConfig);

// Get supported locales (public endpoint — no auth required)
router.get('/locales', (_req, res) => {
  res.json({
    success: true,
    data: {
      locales: SUPPORTED_LOCALES,
      labels: LOCALE_LABELS,
    },
  });
});

export default router;
