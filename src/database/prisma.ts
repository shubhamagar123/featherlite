import { PrismaClient, Prisma } from '@prisma/client';
import { environment } from '@config/environment';
import { logger } from '@utils/logger';

const dbLogger = logger.child({ module: 'prisma' });

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
    errorFormat: environment.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });

  client.$on('query', (event: Prisma.QueryEvent) => {
    dbLogger.debug(
      {
        query: event.query,
        params: event.params,
        durationMs: event.duration,
      },
      'prisma:query'
    );
  });

  client.$on('info', (event: Prisma.LogEvent) => {
    dbLogger.info({ target: event.target }, event.message);
  });

  client.$on('warn', (event: Prisma.LogEvent) => {
    dbLogger.warn({ target: event.target }, event.message);
  });

  client.$on('error', (event: Prisma.LogEvent) => {
    dbLogger.error({ target: event.target }, event.message);
  });

  return client;
}

type PrismaGlobal = typeof globalThis & { __featherlightPrisma?: PrismaClient };

const globalForPrisma = globalThis as PrismaGlobal;

export const prisma: PrismaClient = globalForPrisma.__featherlightPrisma ?? createPrismaClient();

if (environment.NODE_ENV !== 'production') {
  globalForPrisma.__featherlightPrisma = prisma;
}
