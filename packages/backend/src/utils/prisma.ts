// Prisma Client Singleton
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { logger } from './logger';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

prisma.$on('query', (e: { duration: number; query: string; params: string }) => {
  if (e.duration > 1000) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params,
    });
  }
});

const healthCheckInterval = setInterval(() => {
  void (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.debug('Database connection healthy');
    } catch (error) {
      logger.error('Database connection unhealthy', { error });
    }
  })();
}, 30000);

healthCheckInterval.unref();

interface DatabaseHealthStatus {
  status: 'connected' | 'disconnected' | 'timeout';
  responseTime?: number;
  error?: string;
}

export const checkHealth = async (timeoutMs: number = 5000): Promise<DatabaseHealthStatus> => {
  const startTime = Date.now();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
  });

  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    return { status: 'connected', responseTime };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.message === 'Health check timeout') {
      return { status: 'timeout' };
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Database health check failed', { error });
    return { status: 'disconnected', error: errorMessage };
  }
};

export const disconnectPrisma = async (): Promise<void> => {
  try {
    clearInterval(healthCheckInterval);
    await prisma.$disconnect();
    logger.info('Disconnected from database');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
    process.exit(1);
  }
};

export default prisma;
