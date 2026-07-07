import { prisma } from './prisma';
import { logger } from '@utils/logger';

const dbLogger = logger.child({ module: 'database' });

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    dbLogger.info('Database connection established');
  } catch (error) {
    dbLogger.error({ error }, 'Failed to connect to the database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    dbLogger.info('Database connection closed');
  } catch (error) {
    dbLogger.error({ error }, 'Error while disconnecting from the database');
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    dbLogger.error({ error }, 'Database health check failed');
    return false;
  }
}
