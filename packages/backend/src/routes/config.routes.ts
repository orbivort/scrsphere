import { Router, type Router as RouterType } from 'express';
import { ConfigController } from '../controllers/config.controller';

const router: RouterType = Router();
const controller = new ConfigController();

router.get('/notifications', controller.getNotificationConfig);

export default router;
