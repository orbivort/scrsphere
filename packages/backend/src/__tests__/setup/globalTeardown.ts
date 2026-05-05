import { eventLoopMonitor } from '../../utils/eventLoopMonitor';
import { logger } from '../../utils/logger';

export default async function teardown() {
  try {
    logger.info('Starting global teardown for tests');

    if (eventLoopMonitor.isRunning()) {
      eventLoopMonitor.stop();
      logger.info('Event loop monitor stopped');
    }

    if (process.env.DATABASE_URL) {
      const { disconnectPrisma } = await import('../../utils/prisma');
      await disconnectPrisma();
      logger.info('Prisma disconnected');
    }

    logger.info('Global teardown completed successfully');
  } catch (error) {
    logger.error('Error during global teardown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
