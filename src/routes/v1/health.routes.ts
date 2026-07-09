import type { Application } from 'express';
import { HealthController } from '@controllers/health.controller';
import { createLogger } from '@utils/logger';

const logger = createLogger('HealthRoutes');

const controller = new HealthController();

/**
 * Health Check Routes
 * /health - Full health status
 * /health/live - Liveness probe
 * /health/ready - Readiness probe
 */
export function registerHealthRoutes(app: Application): void {
  // Full health check
  app.get('/health', controller.getHealth);

  // Kubernetes liveness probe
  app.get('/health/live', controller.liveness);

  // Kubernetes readiness probe
  app.get('/health/ready', controller.readiness);

  logger.info('✅ Health routes registered');
}
