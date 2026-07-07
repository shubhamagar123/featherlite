import express, { type Application } from 'express';
import { environment } from '@config/environment';
import { corsMiddleware, securityHeaders, requestIdMiddleware } from '@middleware/security';
import { requestContextMiddleware } from '@middleware/requestContext';
import { requestLoggerMiddleware } from '@middleware/requestLogger';
import { errorHandlerMiddleware, notFoundMiddleware } from '@middleware/errorHandler';
import { logger } from '@utils/logger';

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

  // Health endpoint (before other routes)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: environment.NODE_ENV,
      version: '0.1.0',
    });
  });

  // Readiness check endpoint
  app.get('/ready', (_req, res) => {
    // TODO: Add database and cache connection checks
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
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
