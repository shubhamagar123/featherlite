import { createApp } from './app';
import { environment } from '@config/environment';
import { logger } from '@utils/logger';
import { initializeTracing, shutdownTracing } from '@infra/tracing/otel';
import { initializeMetrics } from '@infra/observability/metrics';
import { getDeploymentConfig } from '@config/deployment';

const app = createApp();

interface ServerOptions {
  port: number;
  host?: string;
}

export async function startServer(options: ServerOptions = { port: environment.PORT }): Promise<void> {
  const { port, host = '0.0.0.0' } = options;
  const deploymentConfig = getDeploymentConfig();

  // Initialize observability
  if (deploymentConfig.otel.enabled) {
    await initializeTracing();
    initializeMetrics();
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      logger.info(`🚀 Server running on http://${host}:${port}`);
      logger.info(`📊 Environment: ${environment.NODE_ENV}`);
      logger.info(`🔍 Log Level: ${environment.LOG_LEVEL}`);
      logger.info(`📊 Observability: ${deploymentConfig.otel.enabled ? 'enabled' : 'disabled'}`);
      resolve();
    });

    server.on('error', (error) => {
      logger.error({ error }, 'Server error');
      reject(error);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Close incoming connections
      server.close(async () => {
        try {
          logger.info('HTTP server closed');

          // Close database connections
          const { prisma } = await import('@database/prisma');
          await prisma.$disconnect();
          logger.info('Database connections closed');

          // Close Redis connections
          try {
            const { getRedisClient } = await import('@infra/redis/redis.provider');
            const redis = getRedisClient();
            await redis.quit();
            logger.info('Redis connections closed');
          } catch {
            // Redis might not be initialized
          }

          // Shutdown tracing
          if (deploymentConfig.otel.enabled) {
            await shutdownTracing();
          }

          logger.info('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown timeout exceeded');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught exception');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled promise rejection');
      process.exit(1);
    });

    // Handle warnings
    process.on('warning', (warning) => {
      logger.warn({ warning }, 'Process warning');
    });
  });
}
