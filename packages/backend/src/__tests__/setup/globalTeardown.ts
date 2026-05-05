import { disconnectPrisma } from '../../utils/prisma';
import { eventLoopMonitor } from '../../utils/eventLoopMonitor';
import { logger } from '../../utils/logger';

export default async function teardown() {
  try {
    logger.info('Starting global teardown for E2E tests');

    if (eventLoopMonitor.isRunning()) {
      eventLoopMonitor.stop();
      logger.info('Event loop monitor stopped');
    }

    await disconnectPrisma();
    logger.info('Prisma disconnected');

    logger.info('Global teardown completed successfully');
  } catch (error) {
    logger.error('Error during global teardown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
