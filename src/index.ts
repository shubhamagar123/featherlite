import { startServer } from './server';
import { environment } from '@config/environment';
import { logger } from '@utils/logger';

async function main(): Promise<void> {
  try {
    logger.info('Starting Featherlight Backend...');
    logger.info(`Node Environment: ${environment.NODE_ENV}`);
    logger.info(`Node Version: ${process.version}`);

    await startServer({ port: environment.PORT });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

main();
