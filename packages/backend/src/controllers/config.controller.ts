import { type Request, type Response } from 'express';
import config from '../config';

export class ConfigController {
  async getNotificationConfig(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        pollingIntervalMs: config.notification.pollingIntervalMs,
        maxPageSize: config.notification.maxPageSize,
        retentionDays: config.notification.retentionDays,
      },
    });
  }
}
