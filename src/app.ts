import express, { type Application } from 'express';
import { environment } from '@config/environment';
import { corsMiddleware, securityHeaders, requestIdMiddleware } from '@middleware/security';
import { requestContextMiddleware } from '@middleware/requestContext';
import { requestLoggerMiddleware } from '@middleware/requestLogger';
import { errorHandlerMiddleware, notFoundMiddleware } from '@middleware/errorHandler';
import { metricsMiddleware } from '@middleware/metricsMiddleware';
import { logger } from '@utils/logger';
import { HealthChecker } from '@infra/health/health-check';

export function createApp(): Application {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Security middleware
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Request context middleware
  app.use(requestContextMiddleware);

  // Request logging middleware
  app.use(requestLoggerMiddleware);

  // Metrics middleware
  app.use(metricsMiddleware);

  // Health endpoint (comprehensive checks)
  app.get('/health', async (_req, res) => {
    const health = await HealthChecker.performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 503;
    res.status(statusCode).json(health);
  });

  // Readiness check endpoint (critical checks only)
  app.get('/ready', async (_req, res) => {
    const readiness = await HealthChecker.performReadinessCheck();
    const statusCode = readiness.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(readiness);
  });

  // API routes will be mounted here in Step 3
  // Example placeholder:
  app.get('/api/info', (_req, res) => {
    res.json({
      message: 'Featherlight Backend API',
      version: '0.1.0',
      environment: environment.NODE_ENV,
      modules: {
        auth: 'pending',
        users: 'pending',
        companions: 'pending',
        conversations: 'pending',
        memory: 'pending',
        relationships: 'pending',
        moments: 'pending',
        notifications: 'pending',
        worlds: 'pending',
        scenes: 'pending',
        activities: 'pending',
        weather: 'pending',
        outfits: 'pending',
        media: 'pending',
        voice: 'pending',
        admin: 'pending',
        analytics: 'pending',
      },
    });
  });

  // 404 handler
  app.use(notFoundMiddleware);

  // Error handling middleware (must be last)
  app.use(errorHandlerMiddleware);

  logger.info('✅ Express app configured');

  return app;
}
